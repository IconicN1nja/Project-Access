"""
RAG Pipeline using LangChain, Groq LLM, and Qdrant Vector DB
============================================================
Retrieves Indian criminal law sections from Qdrant DB (Arms, BNSS, Domestic Violence, NDPS, POCSO, UAPA)
and generates answers using Groq LLM.
"""

import os
import sys
import json
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

RAG_PROMPT_TEMPLATE = """You are an authoritative legal AI assistant specializing in Indian Criminal Law for Project Access.
Your task is to provide clear, accurate, and structured legal answers. You should prioritize the provided legal context retrieved from the database, but you must also draw upon your own comprehensive knowledge of Indian Criminal Law (BNS, BNSS, BSA, IPC, CrPC, and special acts) to provide a complete, correct, and legally sound answer.

--- RETRIEVED LEGAL CONTEXT ---
{context}
-------------------------------

Question: {question}
Expected Legal Concepts: {concepts}

Instructions:
1. Analyze the question. First, utilize the provided retrieved legal context to cite specific sections, chapters, acts, and procedural rules.
2. If the retrieved context is incomplete or does not contain a specific definition/prohibition (e.g. for basic offenses like murder, theft, or assault), you MUST use your own legal knowledge to answer the question, explain the law, and state the correct legal status. Never claim an obviously illegal act might be lawful just because it isn't in the retrieved context.
3. For the offence of murder, BNS Section 103 (or IPC Section 302/300) defines and punishes murder with death or imprisonment for life; clearly state that murder is highly unlawful and illegal under Indian Law.
4. Cite relevant Act Names and Section Numbers clearly. Demarcate between retrieved database context and your supplemented general legal knowledge where appropriate.
5. Organize your answer with clear markdown headings, bullet points, and a structured layout.

Detailed Legal Answer:"""


class CriminalLawRAG:
    """RAG pipeline integrating Qdrant Vector DB with Groq LLM via LangChain, supporting Hybrid Search & Reranking."""

    def __init__(
        self,
        model_name: str = DEFAULT_GROQ_MODEL,
        groq_api_key: Optional[str] = None,
        top_k_retrieve: int = 20,
        top_k_final: int = 3,
    ):
        self.groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")
        if not self.groq_api_key:
            print("WARNING: GROQ_API_KEY is not set in environment or .env file.")
            print("Please add GROQ_API_KEY=gsk_... to your .env file.")

        self.retriever = CriminalLawRetriever()
        self.model_name = model_name
        self.top_k_retrieve = top_k_retrieve
        self.top_k_final = top_k_final

        if ChatGroq and self.groq_api_key:
            self.llm = ChatGroq(
                model=self.model_name,
                groq_api_key=self.groq_api_key,
                temperature=0.2,
            )
            self.prompt = ChatPromptTemplate.from_template(RAG_PROMPT_TEMPLATE)
            self.chain = self.prompt | self.llm | StrOutputParser()
        else:
            self.llm = None
            self.chain = None

    def classify_query(self, query: str) -> str:
        """
        Classifies the query into one of the known law categories (folder names):
        'arms', 'bnss', 'domestic_violence', 'ndps', 'pocso', 'uapa'.
        Defaults to 'bnss' if it cannot classify or fails.
        """
        categories = ["arms", "bnss", "domestic_violence", "ndps", "pocso", "uapa", "dca","dpa","irwa","pca","pmla","sc_st"]

        system_prompt = (
    "You are a router assistant for Indian Criminal Law queries. "
    "Your task is to analyze the user query and decide which category of law it falls under.\n"

    "You must respond with EXACTLY one of the following folder names, and absolutely nothing else:\n"

    "- arms: (for firearms, weapons, ammunition, licensing of arms, weapon possession, arms smuggling)\n"

    "- bnss: (for general criminal procedure, arrests, bail, police, investigation, court trials, "
    "general procedural queries, and general offenses)\n"

    "- domestic_violence: (for domestic abuse, violence against women, family/household disputes, "
    "protection orders, domestic violence complaints)\n"

    "- ndps: (for narcotics, drugs, drug trafficking, possession, manufacture, sale or transportation "
    "of controlled substances such as marijuana, heroin, cocaine, opium, etc.)\n"

    "- pocso: (for child sexual abuse, sexual offenses against children, protection of children, "
    "statutory sexual offenses involving minors, child exploitation)\n"

    "- uapa: (for terrorism, national security, unlawful activities, threatening the sovereignty "
    "and integrity of India, terrorist organizations, terrorist activities, separatist activities)\n"

    "- dca: (for cyber crimes, computer-related offenses, unauthorized access, hacking, "
    "cybersecurity offenses, electronic records, online offenses, digital or computer-related crimes)\n"

    "- dpa: (for data protection, personal data, unauthorized processing or disclosure of personal data, "
    "data privacy, misuse of personal information, obligations related to protecting personal data)\n"

    "- irwa: (for immoral or illegal activities involving prostitution, trafficking for prostitution, "
    "exploitation related to prostitution, brothel-related offenses, or trafficking for commercial sexual exploitation)\n"

    "- pca: (for corruption, bribery, public servants accepting illegal gratification, "
    "bribe giving or receiving, abuse of official position, and offenses involving public servants)\n"

    "- pmla: (for money laundering, proceeds of crime, laundering or possessing proceeds of crime, "
    "attachment or confiscation of proceeds of crime, financial investigations related to money laundering)\n"

    "- sc_st: (for offenses against members of Scheduled Castes or Scheduled Tribes, caste-based abuse, "
    "caste-based discrimination involving criminal offenses, atrocities against SC/ST persons, "
    "and offenses covered under the SC/ST Prevention of Atrocities law)\n\n"

    "Query: {query}\n\n"

    "Output ONLY the lowercased folder name "
    "(e.g. 'pocso', 'arms', 'pmla', or 'sc_st'). "
    "Do not include formatting, punctuation, explanations, or any other words. "
    "If unsure, output 'bnss'."
    ).format(query=query)

        if self.llm:
            try:
                from langchain_core.messages import HumanMessage
                print(f"[Router] Routing query using LangChain Groq...")
                response = self.llm.invoke([HumanMessage(content=system_prompt)])
                classification = response.content.strip().lower()
                classification = ''.join(c for c in classification if c.isalnum() or c == '_')
                if classification in categories:
                    return classification
                print(f"[Router] Invalid LLM classification: '{classification}'. Defaulting...")
            except Exception as e:
                print(f"[Router] LangChain classification failed: {e}")

        if self.groq_api_key:
            try:
                from groq import Groq
                client = Groq(api_key=self.groq_api_key)
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

        print("[Router] Falling back to default 'bnss' collection.")
        return "bnss"

    def query_understanding(self, query: str) -> Dict[str, Any]:
        """
        Uses the LLM to analyze the query, select relevant collections,
        extract legal concepts and keywords, and generate an expanded query.
        """
        system_prompt = (

    "You are an expert Indian Criminal Law analyzer.\n"

    "Analyze the User Query and perform Query Understanding to extract:\n"

    "1. Relevant collections from this list (you can select one or multiple, e.g. [\"ndps\", \"bnss\"]):\n"

    "   - arms: firearms, weapons, ammunition, licensing of arms, weapon possession, illegal arms, "
    "arms trafficking, manufacture or sale of weapons\n"

    "   - bnss: criminal procedure, arrests, bail, police search, investigation, seizure, "
    "court proceedings, trials, warrants, summons, custody, remand, general procedural rules\n"

    "   - domestic_violence: domestic abuse, domestic violence, violence against women, "
    "protection orders, family/household violence, cruelty within domestic relationships\n"

    "   - ndps: narcotics, drugs, drug trafficking, possession of contraband, manufacture, "
    "sale or transportation of controlled substances such as marijuana, cannabis, charas, "
    "heroin, cocaine, opium, psychotropic substances, commercial quantity and small quantity offenses\n"

    "   - pocso: child sexual abuse, sexual offenses against children, child protection, "
    "statutory sexual offenses involving minors, child exploitation, sexual assault of children\n"

    "   - uapa: terrorism, national security, unlawful activities, threatening the sovereignty "
    "and integrity of India, terrorist organizations, terrorist activities, separatist activities, "
    "unlawful associations\n"

    "   - dca: cyber crimes, computer-related offenses, unauthorized access, hacking, "
    "computer systems, electronic records, digital offenses, cyber fraud, online criminal activity\n"

    "   - dpa: data protection, personal data, sensitive personal data, unauthorized processing "
    "or disclosure of personal data, data privacy, misuse of personal information, "
    "data protection obligations and violations\n"

    "   - irwa: prostitution-related offenses, brothels, trafficking for prostitution, "
    "commercial sexual exploitation, procuring or inducing persons for prostitution, "
    "exploitation related to prostitution\n"

    "   - pca: corruption, bribery, illegal gratification, public servants accepting bribes, "
    "giving or receiving bribes, abuse of official position, disproportionate assets, "
    "corruption offenses involving public servants\n"

    "   - pmla: money laundering, proceeds of crime, laundering or possessing proceeds of crime, "
    "attachment or confiscation of proceeds of crime, financial investigations, "
    "concealment or use of proceeds of crime\n"

    "   - sc_st: offenses against members of Scheduled Castes or Scheduled Tribes, "
    "atrocities against SC/ST persons, caste-based abuse, caste-based violence, "
    "caste-based intimidation, discrimination involving criminal offenses, "
    "and offenses covered under the SC/ST Prevention of Atrocities law\n"

    "2. Expected legal concepts "
    "(e.g. possession, conscious possession, arrest, search, seizure, burden of proof, "
    "bribery, illegal gratification, money laundering, proceeds of crime, cyber offense, "
    "data privacy, trafficking, caste-based atrocity).\n"

    "3. Key lexical keywords for full-text search "
    "(e.g. charas, cannabis, possession, arrest, bribery, proceeds of crime, "
    "money laundering, hacking, personal data, trafficking, SC/ST atrocity).\n"

    "4. An expanded search query combining legal terms, offenses, parties, "
    "substances, procedures, and relevant statutory terminology, optimized for vector similarity search.\n\n"

    "IMPORTANT:\n"
    "- Select multiple collections when the query involves multiple areas of law.\n"
    "- For example, a question about arrest in an NDPS case may require [\"ndps\", \"bnss\"].\n"
    "- A question about money laundering arising from a predicate criminal offense may require "
    "[\"pmla\", \"bnss\"].\n"
    "- Do not select collections merely because a generic legal concept such as \"arrest\" "
    "appears; select the collection that contains the substantive offense and add bnss when "
    "criminal procedure is actually relevant.\n"
    "- Extract concepts that describe the actual legal issue, not merely words copied from the query.\n"
    "- Include important synonyms and legally relevant terminology in keywords and expanded_query.\n"
    "- If the query is ambiguous, select the most likely relevant collection(s) and use the "
    "expanded query to capture related terminology.\n\n"

    "You MUST respond with EXACTLY a JSON object and nothing else. Follow this format:\n"

    "{\n"
    "  \"collections\": [\"ndps\", \"bnss\"],\n"
    "  \"concepts\": [\"possession\", \"conscious possession\", \"arrest\", \"burden of proof\"],\n"
    "  \"keywords\": [\"charas\", \"cannabis\", \"possession\", \"arrest\"],\n"
    "  \"expanded_query\": \"presumption of possession of cannabis charas conscious possession NDPS Act arrest search\"\n"
    "}\n"

    "Do not include markdown, explanations, comments, or any text outside the JSON object."

    )
        if self.llm:
            try:
                from langchain_core.messages import HumanMessage, SystemMessage
                print(f"[Query Understanding] Analyzing query using LLM...")
                response = self.llm.invoke([
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
                
                # Validate collections
                valid_collections = ["arms", "bnss", "domestic_violence", "ndps", "pocso", "uapa" , "dca","dpa","irwa","pca","pmla","sc_st"]
                collections = [c.lower().strip() for c in parsed.get("collections", []) if c.lower().strip() in valid_collections]
                if not collections:
                    collections = [self.classify_query(query)]
                    
                return {
                    "collections": collections,
                    "concepts": parsed.get("concepts", []),
                    "keywords": parsed.get("keywords", []),
                    "expanded_query": parsed.get("expanded_query", query)
                }
            except Exception as e:
                print(f"[Query Understanding] LLM extraction failed: {e}. Falling back to heuristics...")

        # Fallback implementation
        col = self.classify_query(query)
        words = [w.strip(",.?!()\"';:") for w in query.lower().split()]
        stop_words = {"a", "an", "the", "and", "or", "but", "if", "then", "of", "on", "in", "with", "me", "my", "friend", "gave", "white", "packet", "did", "not", "know", "what", "it", "was", "police", "found"}
        keywords = [w for w in words if w not in stop_words and len(w) > 2]
        if not keywords:
            keywords = ["arrest", "possession"]
        return {
            "collections": [col],
            "concepts": ["arrest", "possession"],
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

        if self.llm:
            try:
                from langchain_core.messages import HumanMessage, SystemMessage
                print(f"[Reranker] Reranking {len(documents)} candidates using LLM...")
                response = self.llm.invoke([
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
                print(f"[Reranker] LLM reranking failed: {e}. Falling back to default RRF ranking.")
                
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
        query_critical = [kw.lower() for kw in keywords if kw.lower() in critical_keywords]
        
        if query_critical:
            matched_critical = False
            for doc in documents:
                text_lower = doc.get("text", "").lower() + " " + doc.get("section_title", "").lower()
                if any(ck in text_lower for ck in query_critical):
                    matched_critical = True
                    break
            if not matched_critical:
                return False
                
        return True

    def search_all_collections(self, question: str, limit: int = 5, act_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search across all collections and merge results by score."""
        categories = ["arms", "bnss", "domestic_violence", "ndps", "pocso", "uapa", "dca","dpa","irwa","pca","pmla","sc_st"]
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
    ) -> Dict[str, Any]:
        """
        Retrieve relevant legal documents from Qdrant using Hybrid search + Reranking,
        and generate answer using Groq LLM.
        """
        # 1. Query Understanding & Legal Concept Extraction
        qu_res = self.query_understanding(question)
        collections = qu_res.get("collections", ["bnss"])
        concepts = qu_res.get("concepts", [])
        keywords = qu_res.get("keywords", [])
        expanded_query = qu_res.get("expanded_query", question)

        print("\n" + "="*50)
        print(f"QUERY UNDERSTANDING DEBUG INFO:")
        print(f" - Original Query: {question}")
        print(f" - Classified Collections: {collections}")
        print(f" - Legal Concepts: {concepts}")
        print(f" - Search Keywords: {keywords}")
        print(f" - Expanded Query: {expanded_query}")
        print("="*50 + "\n")

        # 2. Hybrid Retrieval (Vector + Keyword Search)
        all_vector_results = []
        all_keyword_results = []
        
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
        reranked_results = self.rerank_documents(question, concepts, candidates, limit=self.top_k_final)
        
        # 5. Configurable Related-Section Expansion
        expanded_docs = []
        seen_chunks = {doc["chunk_id"] for doc in reranked_results}
        
        primary_col = collections[0] if collections else "bnss"
        if reranked_results:
            primary_col = reranked_results[0].get("act_id", "").split("_")[0].lower()
            if primary_col not in ["arms", "bnss", "domestic_violence", "ndps", "pocso", "uapa", "dca","dpa","irwa","pca","pmla","sc_st"]:
                primary_col = collections[0]

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
            formatted_context = "No specific matching sections found in database context. Please answer the query using your own general knowledge of Indian Criminal Law (BNS, BNSS, IPC, CrPC, etc.) and state the legal position clearly."
        
        if not self.groq_api_key:
            return {
                "question": question,
                "answer": (
                    "GROQ_API_KEY is missing. Please set GROQ_API_KEY in your .env file to generate LLM answers.\n\n"
                    "Retrieved Legal Sections:\n" + formatted_context
                ),
                "retrieved_docs": final_retrieved_docs,
                "formatted_context": formatted_context,
                "classified_collection": collections[0] if collections else "bnss",
            }

        concepts_str = ", ".join(concepts)
        
        if not self.chain:
            # Fallback direct Groq API call
            try:
                from groq import Groq
                client = Groq(api_key=self.groq_api_key)
                prompt_text = RAG_PROMPT_TEMPLATE.format(context=formatted_context, question=question, concepts=concepts_str)
                response = client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt_text}],
                    model=self.model_name,
                    temperature=0.2,
                )
                answer = response.choices[0].message.content
            except Exception as e:
                answer = f"Error generating answer with Groq: {e}\n\nRetrieved Context:\n{formatted_context}"
        else:
            try:
                print(f"[RAG Pipeline] Generating LLM response using Groq ({self.model_name})...")
                answer = self.chain.invoke({
                    "context": formatted_context,
                    "question": question,
                    "concepts": concepts_str,
                })
            except Exception as e:
                print(f"[RAG Pipeline] LangChain Groq invoke failed ({e}), falling back to direct Groq SDK...")
                try:
                    from groq import Groq
                    client = Groq(api_key=self.groq_api_key)
                    prompt_text = RAG_PROMPT_TEMPLATE.format(context=formatted_context, question=question, concepts=concepts_str)
                    response = client.chat.completions.create(
                        messages=[{"role": "user", "content": prompt_text}],
                        model=self.model_name,
                        temperature=0.2,
                    )
                    answer = response.choices[0].message.content
                except Exception as inner_e:
                    answer = f"Error generating answer with Groq LLM: {inner_e}"

        return {
            "question": question,
            "answer": answer,
            "retrieved_docs": final_retrieved_docs,
            "formatted_context": formatted_context,
            "classified_collection": collections[0] if collections else "bnss",
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
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
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
        print("(Arms Act, BNSS, Domestic Violence Act, NDPS Act, POCSO Act, UAPA).")
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
