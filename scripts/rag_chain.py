"""
RAG Pipeline using LangChain, Groq LLM, and Qdrant Vector DB
============================================================
Retrieves Indian criminal law sections from Qdrant DB (Arms, BNSS, Domestic Violence, NDPS, POCSO, UAPA)
and generates answers using Groq LLM.
"""

import os
import sys
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
    # Fallback to direct Groq client if langchain packages are still installing
    ChatGroq = None


DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"

RAG_PROMPT_TEMPLATE = """You are an authoritative legal AI assistant specializing in Indian Criminal Law for Project Access.
Your task is to provide clear, accurate, and structured legal answers strictly based on the provided context retrieved from Indian Criminal Acts (Arms Act, BNSS, Domestic Violence Act, NDPS Act, POCSO Act, UAPA).

--- RETRIEVED LEGAL CONTEXT ---
{context}
-------------------------------

User Question: {question}

Instructions:
1. Answer the question thoroughly based ONLY on the legal sections provided in the context above.
2. Cite the exact Act Name, Chapter, and Section Number(s) (e.g. "Section 482 of Bharatiya Nagarik Suraksha Sanhita, 2023").
3. Organize your answer clearly with markdown bullet points and headings.
4. If the context does not contain enough information to fully answer, state what the context specifies and note any missing details.

Detailed Legal Answer:"""


class CriminalLawRAG:
    """RAG pipeline integrating Qdrant Vector DB with Groq LLM via LangChain."""

    def __init__(self, model_name: str = DEFAULT_GROQ_MODEL, groq_api_key: Optional[str] = None):
        self.groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")
        if not self.groq_api_key:
            print("WARNING: GROQ_API_KEY is not set in environment or .env file.")
            print("Please add GROQ_API_KEY=gsk_... to your .env file.")

        self.retriever = CriminalLawRetriever()
        self.model_name = model_name

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
        categories = ["arms", "bnss", "domestic_violence", "ndps", "pocso", "uapa"]

        system_prompt = (
            "You are a router assistant for Indian Criminal Law queries. Your task is to analyze the user query and decide which category of law it falls under.\n"
            "You must respond with EXACTLY one of the following folder names, and absolutely nothing else:\n"
            "- arms: (for firearms, weapons, ammunition, licensing of arms, weapon possession, arms smuggling)\n"
            "- bnss: (for general criminal procedure, arrests, bail, police, investigation, court trials, general procedural queries, and general offenses)\n"
            "- domestic_violence: (for domestic abuse, violence against women, family/household disputes, protection orders)\n"
            "- ndps: (for narcotics, drugs, drug trafficking, possession of contraband like marijuana/heroin/etc.)\n"
            "- pocso: (for child sexual abuse, protection of children, statutory rape of minors, child exploitation)\n"
            "- uapa: (for terrorism, national security, unlawful activities, threatening sovereignty of India, terrorist organizations)\n\n"
            "Query: {query}\n\n"
            "Output ONLY the lowercased folder name (e.g. 'pocso' or 'arms'). Do not include formatting, punctuation, or any other words. If unsure, output 'bnss'."
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

    def search_all_collections(self, question: str, limit: int = 5, act_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search across all collections and merge results by score."""
        categories = ["arms", "bnss", "domestic_violence", "ndps", "pocso", "uapa"]
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
            chunk_str = (
                f"[Document {idx}]\n"
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
        Retrieve relevant legal documents from Qdrant and generate answer using Groq LLM.

        Args:
            question: Natural language question about criminal law.
            top_k: Number of Qdrant documents to retrieve.
            act_id: Optional filter for specific act (e.g. 'BNSS_2023', 'UAPA_1967').

        Returns:
            Dict containing 'question', 'answer', 'retrieved_docs', and 'formatted_context'.
        """
        # 1. Route query to specific collection via LLM classification
        classified_collection = self.classify_query(question)
        print(f"[RAG Pipeline] LLM classified query category: '{classified_collection}'")

        # 2. Retrieve documents from classified collection
        try:
            print(f"[RAG Pipeline] Querying Qdrant DB collection '{classified_collection}' for: '{question}'...")
            retrieved_docs = self.retriever.search(
                query=question,
                collection_name=classified_collection,
                limit=top_k,
                act_id=act_id
            )
        except Exception as e:
            print(f"[RAG Pipeline] Search failed on collection '{classified_collection}': {e}")
            print(f"[RAG Pipeline] Falling back to searching all collections...")
            retrieved_docs = self.search_all_collections(question, limit=top_k, act_id=act_id)

        if not retrieved_docs:
            return {
                "question": question,
                "answer": "No relevant legal sections were found in any of the Qdrant database collections.",
                "retrieved_docs": [],
                "formatted_context": "",
                "classified_collection": classified_collection,
            }

        print(f"[RAG Pipeline] Retrieved {len(retrieved_docs)} sections from Qdrant DB.")
        formatted_context = self.format_docs(retrieved_docs)

        if not self.groq_api_key:
            return {
                "question": question,
                "answer": (
                    "GROQ_API_KEY is missing. Please set GROQ_API_KEY in your .env file to generate LLM answers.\n\n"
                    "Retrieved Legal Sections from Qdrant DB:\n" + formatted_context
                ),
                "retrieved_docs": retrieved_docs,
                "formatted_context": formatted_context,
                "classified_collection": classified_collection,
            }

        if not self.chain:
            # Fallback direct Groq API call if langchain-groq is not imported
            try:
                from groq import Groq
                client = Groq(api_key=self.groq_api_key)
                prompt_text = RAG_PROMPT_TEMPLATE.format(context=formatted_context, question=question)
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
                })
            except Exception as e:
                print(f"[RAG Pipeline] LangChain Groq invoke failed ({e}), falling back to direct Groq SDK...")
                try:
                    from groq import Groq
                    client = Groq(api_key=self.groq_api_key)
                    prompt_text = RAG_PROMPT_TEMPLATE.format(context=formatted_context, question=question)
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
            "retrieved_docs": retrieved_docs,
            "formatted_context": formatted_context,
            "classified_collection": classified_collection,
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
        print(f" - {doc['source_label']} (Score: {doc['score']:.4f})")
    print("==================================================")


def main():
    """CLI runner for RAG queries."""
    rag = CriminalLawRAG()

    if len(sys.argv) > 1:
        if sys.argv[1] == "--json":
            query = " ".join(sys.argv[2:])
            original_stdout = sys.stdout
            sys.stdout = sys.stderr
            res = rag.answer_question(question=query)
            sys.stdout = original_stdout
            import json
            print(json.dumps(res, ensure_ascii=False))
        else:
            query = " ".join(sys.argv[1:])
            run_query(rag, query)
    else:
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
