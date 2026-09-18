"""
RAG Pipeline using LangChain, Groq LLM, and Qdrant Vector DB
============================================================
Retrieves Indian criminal law sections from Qdrant DB (Arms, BNSS, Domestic Violence, NDPS, POCSO, UAPA)
and generates answers using Groq LLM.
"""

import os
import sys
import json
import threading
from typing import Dict, List, Any, Optional

# Ensure UTF-8 output encoding for Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.dirname(__file__))

try:
    from scripts.qdrant_search import CriminalLawRetriever
except ImportError:
    from qdrant_search import CriminalLawRetriever

try:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
except ImportError:
    # Fallback if langchain packages are not imported
    ChatGroq = None

DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

# Canonical list of all 14 criminal law collections available in Project Access
ALL_CRIMINAL_COLLECTIONS = [
    "arms",
    "bns",
    "bnss",
    "bsa",
    "dca",
    "domestic_violence",
    "dpa",
    "irwa",
    "ndps",
    "pca",
    "pmla",
    "pocso",
    "sc_st",
    "uapa",
]

def sanitize_no_ipc(text: str) -> str:
    """
    Ensures that IPC (Indian Penal Code) is NEVER referenced in final output,
    replacing any accidental mentions with Bharatiya Nyaya Sanhita, 2023 (BNS).
    Also sanitizes CrPC to BNSS and Indian Evidence Act to BSA.
    """
    if not text:
        return text

    import re
    # 1. Sanitize Indian Penal Code / IPC
    text = re.sub(r'Indian\s+Penal\s+Code\s*(?:\(?IPC\)?|\(1860\)|,?\s*1860)?', 'Bharatiya Nyaya Sanhita, 2023 (BNS)', text, flags=re.IGNORECASE)
    text = re.sub(r'\bIPC\s+Section\b', 'BNS Section', text, flags=re.IGNORECASE)
    text = re.sub(r'\bIPC\s+Sec\.?\b', 'BNS Sec.', text, flags=re.IGNORECASE)
    text = re.sub(r'\bSection\s+(\d+[A-Za-z]?)\s+(?:of\s+the\s+|of\s+)?IPC\b', r'Section \1 of BNS', text, flags=re.IGNORECASE)
    text = re.sub(r'\bSec\.?\s*(\d+[A-Za-z]?)\s+(?:of\s+the\s+|of\s+)?IPC\b', r'Section \1 of BNS', text, flags=re.IGNORECASE)
    text = re.sub(r'\bunder\s+IPC\b', 'under BNS', text, flags=re.IGNORECASE)
    text = re.sub(r'\bunder\s+the\s+IPC\b', 'under the BNS', text, flags=re.IGNORECASE)
    text = re.sub(r'\bIPC\b', 'BNS', text)

    # 2. Sanitize Code of Criminal Procedure / CrPC
    text = re.sub(r'Code\s+of\s+Criminal\s+Procedure\s*(?:\(?CrPC\)?|\(1973\)|,?\s*1973)?', 'Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)', text, flags=re.IGNORECASE)
    text = re.sub(r'\bCrPC\s+Section\b', 'BNSS Section', text, flags=re.IGNORECASE)
    text = re.sub(r'\bSection\s+(\d+[A-Za-z]?)\s+(?:of\s+the\s+|of\s+)?CrPC\b', r'Section \1 of BNSS', text, flags=re.IGNORECASE)
    text = re.sub(r'\bunder\s+CrPC\b', 'under BNSS', text, flags=re.IGNORECASE)
    text = re.sub(r'\bunder\s+the\s+CrPC\b', 'under the BNSS', text, flags=re.IGNORECASE)
    text = re.sub(r'\bCrPC\b', 'BNSS', text)

    # 3. Sanitize Indian Evidence Act / IEA
    text = re.sub(r'Indian\s+Evidence\s+Act\s*(?:\(?IEA\)?|\(1872\)|,?\s*1872)?', 'Bharatiya Sakshya Adhiniyam, 2023 (BSA)', text, flags=re.IGNORECASE)
    text = re.sub(r'\bIEA\b', 'BSA', text)

    # 4. Clean literal <br> tags
    text = re.sub(r'<br\s*/?>', ' ', text, flags=re.IGNORECASE)

    return text


RAG_PROMPT_TEMPLATE = """You are an authoritative legal AI assistant specializing in Indian Criminal Law for Project Access.
Your task is to provide clear, accurate, authoritative, and structured legal answers under the current criminal laws of India.

================================================================================
CRITICAL LEGAL MANDATE:
1. REPEAL OF IPC: The Indian Penal Code (IPC) has been REPEALED and is NO LONGER IN EXISTENCE. The Bharatiya Nyaya Sanhita, 2023 (BNS) has completely replaced and taken over the IPC.
2. NO IPC CITATIONS: You are STRICTLY PROHIBITED from mentioning, writing, or citing "IPC", "Indian Penal Code", or any former IPC section numbers anywhere in your output.
3. EXCLUSIVE BNS SUBSTANTIVE CITATION: All substantive offences (e.g. murder, culpable homicide, theft, robbery, extortion, cheating, fraud, criminal breach of trust, assault, hurt, grievous hurt, rape, sexual offenses, kidnapping, abduction, criminal intimidation, defamation, forgery, criminal conspiracy, etc.) MUST exclusively be cited under the **Bharatiya Nyaya Sanhita, 2023 (BNS)**.
   - For murder: Cite Section 103 BNS (punishable with death or life imprisonment). DO NOT cite IPC 302 or IPC 300.
   - For theft: Cite Section 303 BNS. DO NOT cite IPC 378 or IPC 379.
   - For cheating: Cite Section 318 BNS. DO NOT cite IPC 420.
   - For rape: Cite Section 63/64 BNS. DO NOT cite IPC 375/376.
   - For assault/hurt: Cite Sections 115-118 BNS.
4. BNSS FOR PROCEDURE: Criminal procedure, arrest, remand, search, seizure, bail, trials, appeals, and court powers are governed exclusively by the **Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)** (which replaced the Code of Criminal Procedure / CrPC). Do NOT cite CrPC.
5. BSA FOR EVIDENCE: Evidentiary matters, electronic records, witness examination, and admissibility are governed exclusively by the **Bharatiya Sakshya Adhiniyam, 2023 (BSA)** (which replaced the Indian Evidence Act).
6. SPECIAL CRIMINAL ACTS: Integrate and cite specific special acts where applicable:
   - POCSO Act, 2012 (Child sexual offences & protection of minors)
   - NDPS Act, 1985 (Narcotics & psychotropic substances)
   - UAPA, 1967 (Terrorism & unlawful activities)
   - Arms Act, 1959 (Firearms, weapons & ammunition)
   - Protection of Women from Domestic Violence Act, 2005 (Domestic violence)
   - Dowry Prohibition Act, 1961 (Dowry offences)
   - Prevention of Corruption Act, 1988 (Bribery & public corruption)
   - Prevention of Money-Laundering Act, 2002 (Proceeds of crime & money laundering)
   - SC/ST (Prevention of Atrocities) Act, 1989 (Caste-based atrocities & violence)
   - Drugs and Cosmetics Act, 1940 (Adulterated/spurious drugs & medical standards)
   - Indecent Representation of Women (Prohibition) Act, 1986 (Indecent portrayal of women)
7. NO HTML TAGS: Do NOT output HTML tags such as <br>, <br/>, or <br /> anywhere in your output. For line breaks inside table cells, use clean bullet points or semicolons on a single line. Outside tables, use standard Markdown paragraph breaks.
8. MANDATORY OPENING DIRECT ANSWER: You MUST ALWAYS start your entire response with a concise, direct 2 to 3 line legal summary answering the user's query upfront, before any headings, tables, or detailed analysis.
9. STATUTES TO REFER TABLE: Whenever you include a "Statutes to Refer" table, you MUST include a dedicated column named **Relevance to the facts** (e.g. `| Act | Section | Title | Relevance to the facts |`) and populate it with a clear, specific explanation of how each section/statute directly applies to the user's specific query facts.
10. HEADING NAMING PROTOCOL:
   If your response includes any of the following section headings or table headers, use these exact titles:
   - "Statutes to Refer" (for statutory framework / table of statutes)
   - "Applying the law to your query" (for legal analysis)
   - "What can the victim do now as per the procedural laws" (for procedural consequences / actions)
   - "Source of Information" (for references / sources)
   Do NOT alter your natural response structure, style, or content—only use these heading names when those sections are generated.
================================================================================

--- RETRIEVED LEGAL CONTEXT ---
{context}
-------------------------------

Question: {question}
Expected Legal Concepts: {concepts}

Instructions:
1. ALWAYS start your response with a clear, concise 2 to 3 line direct summary answering the query upfront.
2. Analyze the question carefully. First, utilize the provided retrieved legal context from official statutes to cite specific sections, chapters, acts, and statutory rules.
3. If the retrieved context does not contain a specific section for an offense or concept, you MUST draw upon your own comprehensive knowledge of the current Indian Criminal Laws (BNS, BNSS, BSA, and Special Acts) to provide a complete, sound, and accurate answer.
4. Always cite Act Names and Section Numbers clearly under the new codes (e.g. "Bharatiya Nyaya Sanhita, 2023 (BNS), Section 103").
5. In the "Statutes to Refer" table, include the **Relevance to the facts** column and fill it appropriately.
6. Organize your answer with clear markdown headings, bullet points, and a structured layout following the HEADING NAMING PROTOCOL above.

Detailed Legal Answer:"""


def format_voice_response(text: str) -> str:
    """Formats answer into a single short concise paragraph (max 3-4 sentences) for voice responses."""
    if not text:
        return text
    import re
    # Remove markdown headers
    cleaned = re.sub(r'#{1,6}\s*', '', text)
    # Remove table rows
    lines = [line.strip() for line in cleaned.split('\n') if line.strip() and not line.strip().startswith('|')]
    cleaned = " ".join(lines)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    # Take at most 4 sentences
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', cleaned) if s.strip()]
    if len(sentences) > 4:
        cleaned = " ".join(sentences[:4])
    return cleaned.strip()


class CriminalLawRAG:
    """RAG pipeline integrating Qdrant Vector DB with Groq LLM via LangChain, supporting Hybrid Search & Reranking."""

    def __init__(
        self,
        model_name: str = DEFAULT_GROQ_MODEL,
        groq_api_key: Optional[str] = None,
        top_k_retrieve: int = 20,
        top_k_final: int = 3,
    ):
        self.retriever = CriminalLawRetriever()
        self.model_name = model_name
        self.top_k_retrieve = top_k_retrieve
        self.top_k_final = top_k_final
        
        # Thread safety lock for cycling api keys
        self._lock = threading.Lock()
        self.current_key_index = 0

        # Load API keys from env: GROQ_API_KEYS (comma-separated), or dynamically check GROQ_API_KEY, GROQ_API_KEY1, GROQ_API_KEY2, etc.
        self.api_keys = []
        env_keys = os.getenv("GROQ_API_KEYS", "")
        if env_keys:
            self.api_keys = [k.strip() for k in env_keys.split(",") if k.strip()]
        else:
            single_key = groq_api_key or os.getenv("GROQ_API_KEY")
            if single_key:
                self.api_keys.append(single_key.strip())
            
            idx = 1
            while True:
                numbered_key = os.getenv(f"GROQ_API_KEY{idx}")
                if not numbered_key:
                    break
                self.api_keys.append(numbered_key.strip())
                idx += 1

        if not self.api_keys:
            print("WARNING: No GROQ_API_KEY or GROQ_API_KEYS found. LLM queries will fail.")

        # Initialize pools for each key
        self.llm_pool = []
        self.chain_pool = []

        for key in self.api_keys:
            if ChatGroq and key:
                try:
                    llm = ChatGroq(
                        model=self.model_name,
                        groq_api_key=key,
                        temperature=0.2,
                        max_tokens=4096,
                    )
                    prompt = ChatPromptTemplate.from_template(RAG_PROMPT_TEMPLATE)
                    chain = prompt | llm | StrOutputParser()
                    self.llm_pool.append(llm)
                    self.chain_pool.append(chain)
                except Exception as e:
                    print(f"Error initializing Langchain ChatGroq for key ...{key[-6:] if key else 'None'}: {e}")
                    self.llm_pool.append(None)
                    self.chain_pool.append(None)
            else:
                self.llm_pool.append(None)
                self.chain_pool.append(None)

    def _get_current_resources(self) -> tuple:
        """Thread-safely gets the current key and its pre-initialized resources from the pool."""
        if not self.api_keys:
            return "", None, None
        
        with self._lock:
            idx = self.current_key_index
            
        api_key = self.api_keys[idx]
        llm = self.llm_pool[idx] if idx < len(self.llm_pool) else None
        chain = self.chain_pool[idx] if idx < len(self.chain_pool) else None
        return api_key, llm, chain

    def _rotate_key(self) -> None:
        """Thread-safely rotates to the next API key in the pool."""
        if not self.api_keys:
            return
        with self._lock:
            self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
            print(f"[API Key Balancer] Rotated to API key index {self.current_key_index} of {len(self.api_keys)}")

    def _execute_with_failover(self, task_fn, *args, **kwargs):
        """
        Executes a task function and transparently failovers to the next API key
        if the request fails due to rate limits, token exhaustion, or API issues.
        """
        if not self.api_keys:
            return task_fn(*args, **kwargs)
            
        attempts = len(self.api_keys)
        last_exception = None
        
        for attempt in range(attempts):
            api_key, llm, chain = self._get_current_resources()
            try:
                # Inject resources into kwargs for execution
                kwargs['api_key'] = api_key
                kwargs['llm'] = llm
                kwargs['chain'] = chain
                return task_fn(*args, **kwargs)
            except Exception as e:
                last_exception = e
                error_msg = str(e).lower()
                print(f"[API Key Failover] Attempt {attempt + 1}/{attempts} failed using key ...{api_key[-6:] if api_key else 'None'}: {e}")
                
                # Check for rate limit, quota, exhaustion, or too many requests
                is_exhausted = any(term in error_msg for term in [
                    "rate limit", "rate_limit", "quota", "exhausted", "429", "401", "limit exceeded", "too many requests"
                ])
                
                if is_exhausted or True:  # Fallback to the next key for any LLM exception
                    self._rotate_key()
                else:
                    raise e
                    
        print(f"[API Key Failover] Critical: All {attempts} API keys in the pool failed.")
        raise Exception

    def classify_query(self, query: str, llm: Optional[Any] = None, api_key: Optional[str] = None) -> str:
        """
        Classifies the query into one of the 14 criminal law collections:
        arms, bns, bnss, bsa, dca, domestic_violence, dpa, irwa, ndps, pca, pmla, pocso, sc_st, uapa.
        Defaults to 'bns' for substantive crimes or 'bnss' for procedure.
        """
        categories = ALL_CRIMINAL_COLLECTIONS

        system_prompt = (
            "You are an expert Indian Criminal Law routing assistant.\n"
            "CRITICAL LEGAL RULE: The Indian Penal Code (IPC) has been completely REPEALED and REPLACED by the Bharatiya Nyaya Sanhita, 2023 (BNS). "
            "All substantive crimes previously under IPC (murder, theft, robbery, cheating, assault, rape, kidnapping, fraud, defamation, etc.) "
            "now belong exclusively to 'bns'. Never reference IPC.\n\n"
            "You must respond with EXACTLY one of the following folder names, and absolutely nothing else:\n\n"
            "- bns: (Bharatiya Nyaya Sanhita, 2023 - REPLACING IPC: substantive criminal offences such as murder, culpable homicide, theft, snatching, "
            "robbery, dacoity, cheating, fraud, criminal breach of trust, assault, hurt, grievous hurt, acid attack, rape, sexual offences, "
            "kidnapping, abduction, human trafficking, extortion, mischief, trespass, forgery, criminal conspiracy, mob lynching, hit and run, defamation)\n"
            "- bnss: (Bharatiya Nagarik Suraksha Sanhita, 2023 - REPLACING CrPC: criminal procedure, FIR, arrest without warrant, police custody, "
            "remand, bail, anticipatory bail, search and seizure, court trial procedures, charges, summons, warrants, magistrate powers, High Court powers)\n"
            "- bsa: (Bharatiya Sakshya Adhiniyam, 2023 - REPLACING Indian Evidence Act: law of evidence, admissibility of digital and electronic records, "
            "Section 63 certificate, confessions, witness statements, burden of proof, expert evidence, cross-examination)\n"
            "- pocso: (Protection of Children from Sexual Offences Act, 2012: sexual offences against children/minors under 18, child sexual abuse, "
            "penetrative sexual assault, child pornography, statutory sexual offences involving minors)\n"
            "- ndps: (Narcotic Drugs and Psychotropic Substances Act, 1985: narcotics, drugs, drug trafficking, possession of contraband, ganja, "
            "charas, heroin, cocaine, commercial quantity, Section 37 bail restrictions)\n"
            "- uapa: (Unlawful Activities Prevention Act, 1967: terrorism, terrorist acts, terrorist organizations, national security threats, "
            "unlawful associations, acts threatening sovereignty of India)\n"
            "- arms: (The Arms Act, 1959: firearms, guns, weapons, ammunition, licensing of arms, illegal arms possession, arms trafficking)\n"
            "- domestic_violence: (Protection of Women from Domestic Violence Act, 2005: domestic abuse, domestic violence against women, "
            "protection orders, residence orders, cruelty in household)\n"
            "- dpa: (The Dowry Prohibition Act, 1961: demanding dowry, giving or taking dowry, agreements for dowry, dowry harassment)\n"
            "- pca: (Prevention of Corruption Act, 1988: corruption, bribery, public servants taking bribes or illegal gratification, disproportionate assets)\n"
            "- pmla: (Prevention of Money-Laundering Act, 2002: money laundering, proceeds of crime, property attachment, Enforcement Directorate)\n"
            "- sc_st: (SC/ST Prevention of Atrocities Act, 1989: atrocities, caste-based violence, abuse, intimidation against Dalits or Adivasis)\n"
            "- dca: (The Drugs and Cosmetics Act, 1940: spurious drugs, adulterated pharmaceuticals, counterfeit cosmetics, manufacturing without license)\n"
            "- irwa: (Indecent Representation of Women Prohibition Act, 1986: indecent portrayal or depiction of women in advertisements, media, publications)\n\n"
            f"Query: {query}\n\n"
            "Output ONLY the lowercased folder name (e.g. 'bns', 'bnss', 'pocso', 'ndps'). If substantive crime, output 'bns'. If unsure, output 'bns'."
        )

        active_llm = llm if llm is not None else (self.llm_pool[0] if self.llm_pool else None)
        active_key = api_key if api_key is not None else (self.api_keys[0] if self.api_keys else None)

        if active_llm:
            try:
                from langchain_core.messages import HumanMessage
                print(f"[Router] Routing query using LangChain Groq...")
                response = active_llm.invoke([HumanMessage(content=system_prompt)])
                classification = response.content.strip().lower()
                classification = ''.join(c for c in classification if c.isalnum() or c == '_')
                if classification in categories:
                    return classification
                print(f"[Router] Invalid LLM classification: '{classification}'. Defaulting...")
            except Exception as e:
                print(f"[Router] LangChain classification failed: {e}")
                raise e

        if active_key:
            try:
                from groq import Groq
                client = Groq(api_key=active_key)
                print(f"[Router] Routing query using direct Groq API...")
                response = client.chat.completions.create(
                    messages=[{"role": "user", "content": system_prompt}],
                    model=self.model_name,
                    temperature=0.0,
                    max_tokens=10,
                )
                classification = response.choices[0].message.content.strip().lower()
                classification = ''.join(c for c in classification if c.isalnum() or c == '_')
                if classification in categories:
                    return classification
                print(f"[Router] Invalid direct LLM classification: '{classification}'. Defaulting...")
            except Exception as e:
                print(f"[Router] Direct Groq classification failed: {e}")
                raise e

        print("[Router] Falling back to default 'bns' collection.")
        return "bns"

    def query_understanding(self, query: str, llm: Optional[Any] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Uses the LLM to analyze the query, select relevant collections,
        extract legal concepts and keywords, and generate an expanded query.
        """
        system_prompt = (
            "You are an expert Indian Criminal Law analyzer.\n"
            "CRITICAL MANDATE: The Indian Penal Code (IPC) has been REPEALED and REPLACED by the Bharatiya Nyaya Sanhita, 2023 (BNS). "
            "Substantive crimes belong to 'bns' (never IPC). Criminal procedure belongs to 'bnss' (never CrPC). Evidence belongs to 'bsa'.\n\n"
            "Analyze the User Query and perform Query Understanding to extract:\n"
            "1. Relevant collections from this list (you can select one or multiple, e.g. [\"bns\", \"bnss\"]):\n"
            "   - bns: substantive criminal offences (murder, culpable homicide, theft, snatching, robbery, cheating, fraud, breach of trust, "
            "assault, hurt, rape, sexual offences, kidnapping, extortion, defamation, conspiracy, mob lynching, hit and run - REPLACING IPC)\n"
            "   - bnss: criminal procedure, arrests, bail, anticipatory bail, police search, investigation, seizure, remand, custody, trials, High Court powers (REPLACING CrPC)\n"
            "   - bsa: evidence law, electronic records, admissibility, Section 63 BSA certificate, confessions, witness statements (REPLACING Indian Evidence Act)\n"
            "   - pocso: sexual offences against children/minors under 18, child sexual abuse, penetrative sexual assault, child pornography\n"
            "   - ndps: narcotics, drugs, drug trafficking, contraband possession, cannabis, charas, heroin, commercial quantity, Section 37 bail\n"
            "   - uapa: terrorism, national security threats, unlawful activities, terrorist organizations, sovereignty of India\n"
            "   - arms: firearms, weapons, ammunition, arms licensing, illegal weapon possession, arms trafficking\n"
            "   - domestic_violence: domestic abuse, violence against women, protection orders, household cruelty\n"
            "   - dpa: dowry demands, giving or taking dowry, dowry prohibition\n"
            "   - pca: corruption, bribery, illegal gratification, public servants accepting bribes, disproportionate assets\n"
            "   - pmla: money laundering, proceeds of crime, property attachment, Enforcement Directorate (ED)\n"
            "   - sc_st: atrocities against Scheduled Castes or Scheduled Tribes, caste-based abuse, violence, discrimination\n"
            "   - dca: spurious drugs, adulterated pharmaceuticals, counterfeit cosmetics, illegal drug manufacture/sale\n"
            "   - irwa: indecent representation of women in publications, advertisements, media, derogatory portrayals\n\n"
            "2. Expected legal concepts (e.g. culpable homicide, theft, bail, age of consent, burden of proof).\n"
            "3. Key retrieval keywords for keyword/full-text search. Generate a specific, dynamic list of keywords matching search intent.\n"
            "4. An expanded search query combining legal terms, offences, parties, procedures, and statutory terminology, optimized for vector search.\n\n"
            "You MUST respond with EXACTLY a JSON object and nothing else. Follow this format:\n"
            "{\n"
            "  \"collections\": [\"bns\", \"bnss\"],\n"
            "  \"keywords\": [\"murder\", \"Section 103\", \"punishment\", \"culpable homicide\"],\n"
            "  \"legal_concepts\": [\"murder\", \"capital punishment\", \"culpable homicide\"],\n"
            "  \"expanded_query\": \"murder section 103 BNS punishment death imprisonment for life culpable homicide\"\n"
            "}\n\n"
            "Do not include markdown, explanations, comments, or any text outside the JSON object."
        )
        active_llm = llm if llm is not None else (self.llm_pool[0] if self.llm_pool else None)
        active_key = api_key if api_key is not None else (self.api_keys[0] if self.api_keys else None)

        if active_llm:
            try:
                from langchain_core.messages import HumanMessage, SystemMessage
                print(f"[Query Understanding] Analyzing query using LLM...")
                response = active_llm.invoke([
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=f"User Query: {query}")
                ])
                content = response.content.strip()
                
                # Parse JSON
                import json
                if content.startswith("```"):
                    lines = content.split("\n")
                    if lines[0].startswith("```json") or lines[0].startswith("```"):
                        content = "\n".join(lines[1:-1])
                parsed = json.loads(content)
                
                # Validate collections against all 14 legal collections
                valid_collections = ALL_CRIMINAL_COLLECTIONS
                collections = [c.lower().strip() for c in parsed.get("collections", []) if c.lower().strip() in valid_collections]
                if not collections:
                    collections = [self.classify_query(query, llm=active_llm, api_key=active_key)]
                
                concepts = parsed.get("legal_concepts") or parsed.get("concepts", [])
                keywords = parsed.get("keywords", [])
                expanded_query = parsed.get("expanded_query", query)
                
                print(f"[Query Understanding] Generated Keywords: {keywords}")
                print(f"[Query Understanding] Expanded Query: {expanded_query}")
                
                return {
                    "collections": collections,
                    "concepts": concepts,
                    "legal_concepts": concepts,
                    "keywords": keywords,
                    "expanded_query": expanded_query
                }
            except Exception as e:
                print(f"[Query Understanding] LLM extraction failed: {e}.")
                raise e

        # Fallback implementation
        col = self.classify_query(query, llm=active_llm, api_key=active_key)
        words = [w.strip(",.?!()\"';:") for w in query.lower().split()]
        stop_words = {"a", "an", "the", "and", "or", "but", "if", "then", "of", "on", "in", "with", "me", "my", "friend", "gave", "white", "packet", "did", "not", "know", "what", "it", "was", "police", "found"}
        keywords = [w for w in words if w not in stop_words and len(w) > 2]
        if not keywords:
            keywords = ["offence", "liability"]
            
        print(f"[Query Understanding] Generated Keywords: {keywords}")
        print(f"[Query Understanding] Expanded Query: {query}")
        
        return {
            "collections": [col],
            "concepts": ["arrest", "possession"],
            "legal_concepts": ["arrest", "possession"],
            "keywords": keywords,
            "expanded_query": query
        }

    def compute_lexical_boost(self, doc: Dict[str, Any], keywords: List[str]) -> float:
        boost = 0.0
        text_lower = doc.get("text", "").lower()
        title_lower = doc.get("section_title", "").lower()
        
        # High-value keywords
        high_value_keywords = {"charas", "cannabis", "ganja", "possession", "possess", "contraband", "narcotic", "drug", "firearm", "weapons", "violence", "abuse", "terror", "uapa"}
        
        for kw in keywords:
            kw_lower = kw.lower().strip()
            if not kw_lower:
                continue
                
            # Title matches (high weight)
            if kw_lower in title_lower:
                weight = 0.1
                if kw_lower in high_value_keywords:
                    weight = 0.25
                boost += weight
                
            # Text matches (lower weight)
            if kw_lower in text_lower:
                weight = 0.05
                if kw_lower in high_value_keywords:
                    weight = 0.15
                boost += weight
                
        # Joint booster (substance + conduct)
        has_substance = any(sub in text_lower or sub in title_lower for sub in ["charas", "cannabis", "ganja", "narcotic", "drug"])
        has_possession = any(pos in text_lower or pos in title_lower for pos in ["possession", "possess", "contraband"])
        if has_substance and has_possession:
            boost += 0.3 # Heavy boost for possession of drugs
            
        # Arms Act joint booster
        has_arms = any(arm in text_lower or arm in title_lower for arm in ["arms", "firearm", "weapon", "ammunition"])
        has_arms_possession = any(pos in text_lower or pos in title_lower for pos in ["possession", "possess", "licence", "license"])
        if has_arms and has_arms_possession:
            boost += 0.3
            
        return boost

    def reciprocal_rank_fusion(
        self,
        vector_results: List[Dict[str, Any]],
        keyword_results: List[Dict[str, Any]],
        keywords: List[str],
        k: int = 60
    ) -> List[Dict[str, Any]]:
        scores = {}
        
        # Dense rank scoring
        for rank, doc in enumerate(vector_results):
            chunk_id = doc["chunk_id"]
            scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0 / (k + rank + 1)
            doc["vector_rank"] = rank + 1
            doc["retrieval_method"] = "vector"
            
        # Keyword rank scoring
        for rank, doc in enumerate(keyword_results):
            chunk_id = doc["chunk_id"]
            scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0 / (k + rank + 1)
            doc["keyword_rank"] = rank + 1
            if chunk_id in scores:
                doc["retrieval_method"] = "hybrid"
            else:
                doc["retrieval_method"] = "keyword"

        # Unique documents
        all_docs = {}
        for doc in vector_results:
            all_docs[doc["chunk_id"]] = doc
        for doc in keyword_results:
            chunk_id = doc["chunk_id"]
            if chunk_id in all_docs:
                all_docs[chunk_id].update({
                    "keyword_rank": doc.get("keyword_rank"),
                    "retrieval_method": "hybrid"
                })
            else:
                all_docs[chunk_id] = doc

        # Sort chunk IDs by RRF score + Lexical boost descending
        sorted_chunk_ids = sorted(
            scores.keys(),
            key=lambda cid: scores[cid] + self.compute_lexical_boost(all_docs[cid], keywords),
            reverse=True
        )
        
        sorted_docs = []
        for chunk_id in sorted_chunk_ids:
            doc = all_docs[chunk_id]
            # Save RRF score and boost score
            doc["rrf_score"] = scores[chunk_id]
            doc["lexical_boost"] = self.compute_lexical_boost(doc, keywords)
            doc["combined_score"] = doc["rrf_score"] + doc["lexical_boost"]
            sorted_docs.append(doc)
            
        return sorted_docs

    def rerank_documents(
        self,
        question: str,
        concepts: List[str],
        documents: List[Dict[str, Any]],
        limit: int = 5,
        llm: Optional[Any] = None,
        api_key: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Uses the LLM to rerank the combined retrieved documents and select the top `limit` most relevant sections.
        """
        if not documents:
            return []
        
        if len(documents) <= limit:
            return documents

        # Format documents for the prompt
        doc_list_str = []
        for idx, doc in enumerate(documents):
            text = doc.get("text", "")
            text_snippet = text[:500] + "..." if len(text) > 500 else text
            doc_list_str.append(
                f"Index: {idx}\n"
                f"Chunk ID: {doc.get('chunk_id')}\n"
                f"Act: {doc.get('act_title')} ({doc.get('act_id')})\n"
                f"Section: {doc.get('section_number')} - {doc.get('section_title')}\n"
                f"Text:\n{text_snippet}\n"
            )
        
        docs_formatted = "\n-------------------------\n".join(doc_list_str)

        system_prompt = (
            "You are a professional legal document reranker for Indian Criminal Law.\n"
            "Analyze the User Question and the list of retrieved law sections below.\n"
            "Your goal is to select the top {limit} most relevant sections that are directly applicable to answering the question.\n"
            "Focus on these extracted concepts: {concepts_str}\n\n"
            "CRITICAL INSTRUCTION:\n"
            "- Prioritize substantive law provisions (e.g., definitions, prohibitions, offenses, punishments) that directly establish the legality or criminality of the conduct described in the query.\n"
            "- Keep procedural provisions (e.g., arrest procedures, powers of police, reports) as additional context, but do NOT allow them to crowd out the core substantive provisions.\n"
            "- Exclude sections that are irrelevant or about unrelated topics (e.g., illegally acquired property, other unrelated offenses).\n\n"
            "You MUST respond with EXACTLY a JSON object containing a ranked list of the document indexes in order of relevance, from most relevant to least relevant.\n"
            "Format:\n"
            "{{\n"
            "  \"ranked_indexes\": [3, 0, 4, 1, 2]\n"
            "}}\n"
            "Do not include any explanations, markdown code blocks (except raw JSON), or other words."
        ).format(limit=limit, concepts_str=", ".join(concepts))

        active_llm = llm if llm is not None else (self.llm_pool[0] if self.llm_pool else None)

        if active_llm:
            try:
                from langchain_core.messages import HumanMessage, SystemMessage
                print(f"[Reranker] Reranking {len(documents)} candidates using LLM...")
                response = active_llm.invoke([
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=f"User Question: {question}\n\nRetrieved Sections:\n{docs_formatted}")
                ])
                content = response.content.strip()
                import json
                if content.startswith("```"):
                    lines = content.split("\n")
                    if lines[0].startswith("```json") or lines[0].startswith("```"):
                        content = "\n".join(lines[1:-1])
                parsed = json.loads(content)
                ranked_indexes = parsed.get("ranked_indexes", [])
                
                # Filter valid indexes
                valid_indexes = [idx for idx in ranked_indexes if isinstance(idx, int) and 0 <= idx < len(documents)]
                
                # Deduplicate and build final list
                seen = set()
                final_docs = []
                for idx in valid_indexes:
                    if idx not in seen:
                        seen.add(idx)
                        final_docs.append(documents[idx])
                
                # Fill in
                for idx, doc in enumerate(documents):
                    if len(final_docs) >= limit:
                        break
                    if idx not in seen:
                        seen.add(idx)
                        final_docs.append(doc)
                        
                print(f"[Reranker] LLM rerank successfully selected {len(final_docs)} documents.")
                return final_docs
            except Exception as e:
                print(f"[Reranker] LLM reranking failed: {e}.")
                raise e
                
        return documents[:limit]

    def expand_related_sections(
        self,
        collection_name: str,
        point_id: int,
        distance: int = 1
    ) -> List[Dict[str, Any]]:
        """Retrieves adjacent sections from same collection and Act to provide rich context."""
        if not point_id or point_id <= 1:
            return []
            
        candidate_ids = [point_id - distance, point_id + distance]
        candidate_ids = [cid for cid in candidate_ids if cid > 0]
        
        try:
            points = self.retriever.client.retrieve(
                collection_name=collection_name,
                ids=candidate_ids,
                with_payload=True,
                with_vectors=False,
            )
            
            orig_point = self.retriever.client.retrieve(
                collection_name=collection_name,
                ids=[point_id],
                with_payload=True,
                with_vectors=False,
            )
            if not orig_point:
                return []
            orig_act_id = orig_point[0].payload.get("act_id")
            
            results = []
            for hit in points:
                if hit.payload.get("act_id") == orig_act_id:
                    results.append({
                        "score": 0.45,
                        "point_id": hit.id,
                        "chunk_id": hit.payload.get("chunk_id"),
                        "act_id": hit.payload.get("act_id"),
                        "act_title": hit.payload.get("act_title"),
                        "section_number": hit.payload.get("section_number"),
                        "section_title": hit.payload.get("section_title"),
                        "chapter": hit.payload.get("chapter"),
                        "source_label": hit.payload.get("source_label"),
                        "text": hit.payload.get("text"),
                        "is_expansion": True,
                    })
            return results
        except Exception as e:
            print(f"[Expansion] Warning: Adjacent points retrieval failed: {e}")
            return []

    def check_retrieval_relevance(self, documents: List[Dict[str, Any]], keywords: List[str], threshold: float = 0.58) -> bool:
        """
        Checks if the retrieved documents are relevant to the query keywords.
        Returns True if relevant, False if insufficient.
        """
        if not documents:
            return False
            
        # Check if at least one document has a vector similarity score or rrf score
        has_decent_score = any(doc.get("score", 0.0) >= threshold for doc in documents if doc.get("retrieval_method") == "vector" or "rrf_score" in doc)
        
        # Check if there is at least some overlap between the document text and critical query keywords
        critical_keywords = {
    "charas", "cannabis", "ganja", "narcotic", "drug",
    "firearm", "arms", "weapons",
    "violence", "abuse", "domestic",
    "terror", "terrorism", "uapa",
    "pocso", "child",
    "cyber", "hacking", "computer", "unauthorized access", "online fraud",
    "data", "personal data", "data protection", "privacy", "data breach",
    "prostitution", "brothel", "trafficking", "immoral traffic", "sexual exploitation",
    "corruption", "bribery", "bribe", "illegal gratification", "public servant", "disproportionate assets",
    "money laundering", "pmla", "proceeds of crime", "scheduled offence", "attachment", "confiscation",
    "sc", "st", "scheduled caste", "scheduled tribe", "atrocity", "caste", "caste abuse",
    "caste violence", "caste insult", "intimidation", "humiliation", "discrimination"
}        
        # Return True if we have retrieved documents to feed to the LLM
        return len(documents) > 0

    def search_all_collections(self, question: str, limit: int = 5, act_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search across all collections and merge results by score."""
        categories = ALL_CRIMINAL_COLLECTIONS
        all_results = []
        for col in categories:
            try:
                results = self.retriever.search(query=question, collection_name=col, limit=limit, act_id=act_id)
                all_results.extend(results)
            except Exception as e:
                print(f"[Fallback Search] Warning: Could not search collection '{col}': {e}")
        all_results.sort(key=lambda x: x["score"], reverse=True)
        return all_results[:limit]

    def format_docs(self, docs: List[Dict[str, Any]]) -> str:
        """Format retrieved Qdrant records into structured prompt context."""
        formatted_chunks = []
        for idx, doc in enumerate(docs, start=1):
            is_exp = " [Related Context]" if doc.get("is_expansion") else ""
            chunk_str = (
                f"[Document {idx}]{is_exp}\n"
                f"Source: {doc.get('source_label', '')}\n"
                f"Act: {doc.get('act_title', '')} ({doc.get('act_id', '')})\n"
                f"Chapter: {doc.get('chapter', '')}\n"
                f"Section Number: {doc.get('section_number', '')}\n"
                f"Section Title: {doc.get('section_title', '')}\n"
                f"Content:\n{doc.get('text', '')}\n"
            )
            formatted_chunks.append(chunk_str)
        return "\n-------------------------\n".join(formatted_chunks)

    def answer_question(
        self,
        question: str,
        top_k: int = 5,
        act_id: Optional[str] = None,
        is_voice: bool = False,
    ) -> Dict[str, Any]:
        """
        Retrieve relevant legal documents from Qdrant using Hybrid search + Reranking,
        and generate answer using Groq LLM, cycling through the cyclic key pool.
        """
        try:
            return self._execute_with_failover(
                self._answer_question_internal,
                question=question,
                top_k=top_k,
                act_id=act_id,
                is_voice=is_voice,
            )
        except Exception as e:
            print(f"[API Key Balancer] Critical: All keys failed. Returning graceful fallback. Error: {e}")
            
            # Connect to Qdrant directly and retrieve documents if Qdrant is still working
            retrieved_docs = []
            try:
                retrieved_docs = self.retriever.search(
                    query=question,
                    collection_name="bns",
                    limit=top_k,
                    act_id=act_id
                )
            except Exception as retrieval_err:
                print(f"[API Key Balancer Fallback] Retrieval also failed: {retrieval_err}")

            formatted_context = self.format_docs(retrieved_docs) if retrieved_docs else "No context retrieved."

            return {
                "question": question,
                "answer": sanitize_no_ipc(f"All configured Groq API keys are currently unavailable (rate-limited, invalid, or exhausted).\n\nDetails of failure: {e}"),
                "retrieved_docs": retrieved_docs,
                "formatted_context": formatted_context,
                "classified_collection": "bns",
            }

    def detect_and_translate_to_english(
        self,
        query: str,
        llm: Optional[Any] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Detects if query is in a non-English language.
        If non-English, translates it to clear English for semantic Qdrant search.
        If English, returns is_english=True with zero changes.
        """
        if not query or len(query.strip()) == 0:
            return {"is_english": True, "original_language": "English", "english_query": query}

        import re
        # Check if text contains non-ASCII characters (Devanagari, Tamil, Telugu, Bengali, Arabic, Cyrillic, CJK, etc.)
        non_ascii_letters = re.findall(r'[^\x00-\x7F]', query)
        is_pure_ascii = len(non_ascii_letters) == 0

        # Fast-path for common ASCII English legal queries to eliminate LLM overhead on pure English queries
        if is_pure_ascii and any(w in query.lower() for w in ["what", "how", "is", "under", "section", "bns", "bnss", "bsa", "bail", "court", "police", "arrest", "the", "for", "ipc"]):
            return {"is_english": True, "original_language": "English", "english_query": query}

        active_llm = llm if llm is not None else (self.llm_pool[0] if self.llm_pool and self.llm_pool[0] else None)
        if not active_llm and not api_key:
            return {"is_english": True, "original_language": "English", "english_query": query}

        system_prompt = (
            "You are a multilingual legal language detector and translator for Indian Criminal Law.\n"
            "Analyze the user's input query below:\n"
            "1. Determine whether the query is written in English or a non-English language (e.g. Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Malayalam, Kannada, Punjabi, Urdu, Spanish, French, German, etc.).\n"
            "2. If it is in English, set \"is_english\": true, \"original_language\": \"English\", and \"english_query\": the exact original query text.\n"
            "3. If it is in a non-English language, translate the question into clear, accurate English legal terminology for semantic vector retrieval in Indian law, and set \"is_english\": false, \"original_language\": name of the detected language (e.g., \"Hindi\"), and \"english_query\": translated English query.\n\n"
            "Respond ONLY with a valid JSON object in this exact format:\n"
            "{\n"
            '  "is_english": boolean,\n'
            '  "original_language": "Language Name",\n'
            '  "english_query": "English translation or original query"\n'
            "}\n"
            "Do not output markdown code blocks or any extraneous text."
        )

        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            response = active_llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"User Input: {query}")
            ])
            content = response.content.strip()
            if content.startswith("```"):
                lines = content.split("\n")
                if lines[0].startswith("```json") or lines[0].startswith("```"):
                    content = "\n".join(lines[1:-1])
            parsed = json.loads(content)
            orig_lang = parsed.get("original_language", "English")
            is_eng = bool(parsed.get("is_english", True))
            eng_q = parsed.get("english_query", query)
            
            if orig_lang.lower() == "english":
                is_eng = True
                eng_q = query

            print(f"[Multilingual] Query Language: {orig_lang} (is_english={is_eng})")
            if not is_eng:
                print(f"[Multilingual] Translated user query into English for semantic RAG search: '{eng_q}'")
            return {
                "is_english": is_eng,
                "original_language": orig_lang,
                "english_query": eng_q,
            }
        except Exception as e:
            print(f"[Multilingual] Language detection failed, proceeding in English: {e}")
            return {"is_english": True, "original_language": "English", "english_query": query}

    def translate_response_to_language(
        self,
        text: str,
        target_language: str,
        llm: Optional[Any] = None,
        api_key: Optional[str] = None
    ) -> str:
        """
        Translates the final generated English legal answer into the user's input language.
        Preserves Markdown formatting, tables, section numbers (BNS, BNSS, BSA), and bold highlights.
        """
        if not text or target_language.lower() in ["english", "en"]:
            return text

        active_llm = llm if llm is not None else (self.llm_pool[0] if self.llm_pool and self.llm_pool[0] else None)
        if not active_llm and not api_key:
            return text

        system_prompt = (
            f"You are an expert legal translator specializing in Indian Criminal Law.\n"
            f"Translate the following legal answer into **{target_language}**.\n\n"
            f"STRICT TRANSLATION RULES:\n"
            f"1. Preserve ALL Markdown structure: headers (#, ##), bold text (**bold**), bullet points, and tables (| col | col |).\n"
            f"2. Keep statutory section citations clear and explicit in {target_language} (e.g. keep BNS, BNSS, BSA section numbers clear like 'Section 103 BNS' or 'भारतीय न्याय संहिता (BNS) की धारा 103').\n"
            f"3. Ensure high legal precision and readability for native {target_language} speakers.\n"
            f"4. Output ONLY the translated legal answer text with no meta comments."
        )

        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            print(f"[Multilingual] Translating final response into {target_language}...")
            response = active_llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=text)
            ])
            translated_text = response.content.strip()
            print(f"[Multilingual] Successfully translated answer into {target_language}.")
            return translated_text
        except Exception as e:
            print(f"[Multilingual] Translation to {target_language} failed, returning English answer: {e}")
            return text

    def _answer_question_internal(
        self,
        question: str,
        top_k: int = 5,
        act_id: Optional[str] = None,
        llm: Optional[Any] = None,
        api_key: Optional[str] = None,
        chain: Optional[Any] = None,
        is_voice: bool = False,
    ) -> Dict[str, Any]:
        """
        Internal implementation of RAG querying utilizing a specific API key instance.
        """
        # 0. Multilingual Step: Detect language and translate non-English query to English for semantic Qdrant search
        lang_info = self.detect_and_translate_to_english(question, llm=llm, api_key=api_key)
        is_english = lang_info.get("is_english", True)
        target_lang = lang_info.get("original_language", "English")
        search_question = lang_info.get("english_query", question)

        # If voice mode is requested, adjust the question prompt for extreme conciseness
        effective_question = search_question
        if is_voice:
            effective_question = (
                f"{search_question}\n\n"
                "[VOICE CHAT MODE INSTRUCTION: Provide a concise, clear legal response in MAXIMUM ONE PARAGRAPH (3 to 4 sentences max). "
                "Do NOT produce tables, bullet lists, or multiple section headings. Be direct and brief.]"
            )

        # 1. Query Understanding & Legal Concept Extraction
        qu_res = self.query_understanding(effective_question, llm=llm, api_key=api_key)
        collections = qu_res.get("collections", ["bns"])
        concepts = qu_res.get("concepts", [])
        keywords = qu_res.get("keywords", [])
        expanded_query = qu_res.get("expanded_query", effective_question)

        print("\n" + "="*50)
        print(f"QUERY UNDERSTANDING DEBUG INFO (Voice={is_voice}, Lang={target_lang}):")
        print(f" - Original Query: {question}")
        print(f" - English Search Query: {search_question}")
        print(f" - Classified Collections: {collections}")
        print(f" - Legal Concepts: {concepts}")
        print(f" - Search Keywords: {keywords}")
        print(f" - Expanded Query: {expanded_query}")
        print("="*50 + "\n")

        # 2. Hybrid Retrieval (Vector + Keyword Search)
        all_vector_results = []
        all_keyword_results = []
        
        print(f"[Retrieval] Using LLM-generated keywords: {keywords}")
        for col in collections:
            # Dense Vector Search
            try:
                print(f"[Retrieval] Dense Vector Search in '{col}'...")
                v_results = self.retriever.search(
                    query=expanded_query,
                    collection_name=col,
                    limit=self.top_k_retrieve,
                    act_id=act_id
                )
                all_vector_results.extend(v_results)
            except Exception as e:
                print(f"[Retrieval] Vector search failed on collection '{col}': {e}")
                
            # Keyword Full-text Search
            try:
                print(f"[Retrieval] Keyword Full-Text Search in '{col}' for keywords {keywords}...")
                k_results = self.retriever.keyword_search(
                    keywords=keywords,
                    collection_name=col,
                    limit=self.top_k_retrieve,
                    act_id=act_id
                )
                all_keyword_results.extend(k_results)
            except Exception as e:
                print(f"[Retrieval] Keyword search failed on collection '{col}': {e}")

        # 3. Reciprocal Rank Fusion (RRF) & Lexical Boosting
        merged_results = self.reciprocal_rank_fusion(all_vector_results, all_keyword_results, keywords)
        print(f"[Retrieval] Retrieved documents: {[doc.get('chunk_id') for doc in merged_results]}")
        
        # Log debugging output for dense, keyword, and merged results
        print("\n" + "="*50)
        print("DENSE VECTOR RESULTS (Top 5):")
        for idx, doc in enumerate(all_vector_results[:5]):
            print(f" - {doc.get('chunk_id')} | Score: {doc.get('score', 0.0):.4f} | Title: {doc.get('section_title')}")
        
        print("\nKEYWORD RESULTS (Top 5):")
        for idx, doc in enumerate(all_keyword_results[:5]):
            print(f" - {doc.get('chunk_id')} | Score: {doc.get('score', 0.0):.4f} | Title: {doc.get('section_title')}")
            
        print("\nMERGED RESULTS (RRF + Lexical Boost - Top 15):")
        for idx, doc in enumerate(merged_results[:15]):
            print(f" - {doc.get('chunk_id')} | Combined Score: {doc.get('combined_score', 0.0):.4f} | Method: {doc.get('retrieval_method')} | Title: {doc.get('section_title')}")
        print("="*50 + "\n")

        # 4. LLM-based Reranking
        candidates = merged_results[:15]
        reranked_results = self.rerank_documents(effective_question, concepts, candidates, limit=self.top_k_final, llm=llm, api_key=api_key)
        print(f"[Reranker] Selected documents: {[doc.get('chunk_id') for doc in reranked_results]}")
        
        # 5. Configurable Related-Section Expansion
        expanded_docs = []
        seen_chunks = {doc["chunk_id"] for doc in reranked_results}
        
        primary_col = collections[0] if collections else "bns"
        if reranked_results:
            primary_col = reranked_results[0].get("act_id", "").split("_")[0].lower()
            if primary_col not in ALL_CRIMINAL_COLLECTIONS:
                primary_col = collections[0] if collections else "bns"

        for doc in reranked_results[:1]:
            point_id = doc.get("point_id")
            if point_id:
                adjacents = self.expand_related_sections(primary_col, point_id, distance=1)
                for adj in adjacents:
                    if adj["chunk_id"] not in seen_chunks:
                        seen_chunks.add(adj["chunk_id"])
                        expanded_docs.append(adj)

        # Merge final reranked results and the expanded related sections
        final_retrieved_docs = reranked_results + expanded_docs
        
        print("\n" + "="*50)
        print("FINAL RETRIEVED AND RERANKED SECTIONS:")
        for idx, doc in enumerate(final_retrieved_docs):
            exp_tag = " [Adjacent Expansion]" if doc.get("is_expansion") else ""
            print(f" - {doc.get('chunk_id')} | Title: {doc.get('section_title')}{exp_tag}")
        print("="*50 + "\n")

        # 6. Retrieval Confidence / Relevance Check
        is_relevant = self.check_retrieval_relevance(reranked_results, keywords)
        
        # 7. Generate Answer
        if is_relevant:
            formatted_context = self.format_docs(final_retrieved_docs)
        else:
            formatted_context = (
                "No specific matching sections found in database context. "
                "Please answer the query using your own authoritative legal knowledge of Indian Criminal Law under the new statutes "
                "(Bharatiya Nyaya Sanhita, 2023 - BNS; Bharatiya Nagarik Suraksha Sanhita, 2023 - BNSS; Bharatiya Sakshya Adhiniyam, 2023 - BSA) "
                "and state the legal position clearly. "
                "CRITICAL MANDATE: The Indian Penal Code (IPC) has been REPEALED and REPLACED by BNS. "
                "You are STRICTLY FORBIDDEN from citing or mentioning IPC. Always cite BNS instead."
            )
        
        if not api_key:
            answer_text = (
                "GROQ_API_KEY is missing. Please set GROQ_API_KEYS or GROQ_API_KEY in your .env file to generate LLM answers.\n\n"
                "Retrieved Legal Sections:\n" + formatted_context
            )
            if is_voice:
                answer_text = format_voice_response(answer_text)
            return {
                "question": question,
                "answer": sanitize_no_ipc(answer_text),
                "retrieved_docs": final_retrieved_docs,
                "formatted_context": formatted_context,
                "classified_collection": collections[0] if collections else "bns",
            }

        concepts_str = ", ".join(concepts)
        
        print(f"[Generation] Generating final answer...")
        if not chain:
            # Fallback direct Groq API call
            try:
                from groq import Groq
                client = Groq(api_key=api_key)
                prompt_text = RAG_PROMPT_TEMPLATE.format(context=formatted_context, question=effective_question, concepts=concepts_str)
                response = client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt_text}],
                    model=self.model_name,
                    temperature=0.2,
                    max_tokens=4096,
                )
                answer = response.choices[0].message.content
                print(f"[Generation] Final answer generated successfully")
            except Exception as e:
                answer = f"Error generating answer with Groq: {e}\n\nRetrieved Context:\n{formatted_context}"
                print(f"[Generation] Failed to generate answer: {e}")
        else:
            try:
                print(f"[RAG Pipeline] Generating LLM response using Groq ({self.model_name})...")
                answer = chain.invoke({
                    "context": formatted_context,
                    "question": effective_question,
                    "concepts": concepts_str,
                })
                print(f"[Generation] Final answer generated successfully")
            except Exception as e:
                print(f"[RAG Pipeline] LangChain Groq invoke failed ({e}), falling back to direct Groq SDK...")
                try:
                    from groq import Groq
                    client = Groq(api_key=api_key)
                    prompt_text = RAG_PROMPT_TEMPLATE.format(context=formatted_context, question=effective_question, concepts=concepts_str)
                    response = client.chat.completions.create(
                        messages=[{"role": "user", "content": prompt_text}],
                        model=self.model_name,
                        temperature=0.2,
                        max_tokens=4096,
                    )
                    answer = response.choices[0].message.content
                    print(f"[Generation] Final answer generated successfully")
                except Exception as inner_e:
                    answer = f"Error generating answer with Groq LLM: {inner_e}"
                    print(f"[Generation] Failed to generate answer: {inner_e}")

        # Post-generation guarantee: Sanitize any remaining IPC/CrPC leakage
        answer = sanitize_no_ipc(answer)
        if is_voice:
            answer = format_voice_response(answer)

        # 8. Multilingual Final Translation: If original user query was non-English, translate output into target_lang
        if not is_english and target_lang.lower() != "english":
            answer = self.translate_response_to_language(answer, target_lang, llm=llm, api_key=api_key)
            if is_voice:
                answer = format_voice_response(answer)

        # Print the final LLM response to the terminal
        print("\n" + "="*50)
        print(f"FINAL LLM ANSWER (Voice={is_voice}, Lang={target_lang}):")
        print(answer)
        print("="*50 + "\n")

        return {
            "question": question,
            "answer": answer,
            "retrieved_docs": final_retrieved_docs,
            "formatted_context": formatted_context,
            "classified_collection": collections[0] if collections else "bns",
        }


def run_query(rag: CriminalLawRAG, query: str):
    res = rag.answer_question(question=query)

    print("\n=========================================")
    print(f"QUESTION: {res['question']}")
    print("=========================================")

    print("\n================ CONTEXT FED TO LLM ================")
    print(res["formatted_context"])
    print("====================================================")

    print("\n================ FINAL LLM ANSWER ================")
    print(res["answer"])
    print("==================================================")

    print("\n================ RETRIEVED SOURCES ================")
    for doc in res["retrieved_docs"]:
        exp_tag = " (Related Adjacent Section)" if doc.get("is_expansion") else ""
        score_val = doc.get("combined_score", doc.get("score", 0.0))
        print(f" - {doc['source_label']}{exp_tag} (Score: {score_val:.4f})")
    print("==================================================")


def main():
    """CLI runner for RAG queries."""
    if len(sys.argv) > 1 and sys.argv[1] == "--test-failover":
        print("\n=== STARTING API KEY FAILOVER TEST ===")
        # Get the actual valid key from the environment
        valid_key = os.getenv("GROQ_API_KEY")
        if not valid_key:
            print("ERROR: GROQ_API_KEY is not set in environment or .env file.")
            sys.exit(1)
            
        print("Initializing CriminalLawRAG with two API keys:")
        print("  Key 1: gsk_invalid_dummy_key_to_simulate_failover_12345 (Invalid)")
        print(f"  Key 2: {valid_key[:10]}...{valid_key[-6:]} (Valid from .env)")
        
        # Create a RAG instance with custom list of keys
        rag = CriminalLawRAG(groq_api_key="gsk_invalid_dummy_key_to_simulate_failover_12345")
        # Overwrite self.api_keys and re-initialize pools
        rag.api_keys = ["gsk_invalid_dummy_key_to_simulate_failover_12345", valid_key]
        
        # Re-initialize pools for the test
        from langchain_groq import ChatGroq
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser
        
        rag.llm_pool = []
        rag.chain_pool = []
        for key in rag.api_keys:
            try:
                llm = ChatGroq(
                    model=rag.model_name,
                    groq_api_key=key,
                    temperature=0.2,
                    max_tokens=4096,
                )
                prompt = ChatPromptTemplate.from_template(RAG_PROMPT_TEMPLATE)
                chain = prompt | llm | StrOutputParser()
                rag.llm_pool.append(llm)
                rag.chain_pool.append(chain)
            except Exception:
                rag.llm_pool.append(None)
                rag.chain_pool.append(None)
                
        rag.current_key_index = 0
        
        print("\nRunning query: 'What is the punishment for murder under BNS?'")
        print("Expect to see Attempt 1 fail, then automatic failover to Key 2 succeed.\n")
        
        try:
            res = rag.answer_question("What is the punishment for murder under BNS?")
            print("\n=== FAILOVER TEST RESULT ===")
            print(f"Status: SUCCESS")
            print(f"Answer snippet: {res['answer'][:150]}...")
            print("===================================\n")
        except Exception as e:
            print("\n=== FAILOVER TEST RESULT ===")
            print(f"Status: FAILED")
            print(f"Error: {e}")
            print("===================================\n")
            
        sys.exit(0)

    elif len(sys.argv) > 1 and sys.argv[1] == "--json":
        original_stdout = sys.stdout
        sys.stdout = sys.stderr
        rag = CriminalLawRAG()
        query = " ".join(sys.argv[2:])
        res = rag.answer_question(question=query)
        sys.stdout = original_stdout
        import json
        print(json.dumps(res, ensure_ascii=False))
    elif len(sys.argv) > 1:
        rag = CriminalLawRAG()
        query = " ".join(sys.argv[1:])
        run_query(rag, query)
    else:
        rag = CriminalLawRAG()
        print("\n========================================================")
        print("  Project Access - Legal RAG AI Assistant (Qdrant + Groq)")
        print("========================================================")
        print("Interactive mode active. Ask any question about Indian Criminal Laws")
        print("(BNS, BNSS, BSA, NDPS, POCSO, Arms Act, PMLA, PCA, UAPA, DV Act, etc.).")
        print("Type 'exit' or 'quit' to close.\n")

        while True:
            try:
                user_input = input("\nLegal Query > ").strip()
                if not user_input:
                    continue
                if user_input.lower() in ("exit", "quit", "q"):
                    print("Exiting Project Access Legal RAG. Goodbye!")
                    break
                run_query(rag, user_input)
            except (KeyboardInterrupt, EOFError):
                print("\nExiting. Goodbye!")
                break


if __name__ == "__main__":
    main()
