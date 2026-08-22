"""
Qdrant Search & RAG Helper for Project Access Criminal Law Data
================================================================
Provides similarity search with payload metadata filters for RAG pipelines.
"""

import os
import sys
from typing import Dict, List, Any, Optional

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchText
from fastembed import TextEmbedding

# Load environment variables
load_dotenv()

# Configuration
DEFAULT_STORAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "qdrant_storage"))
EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"


class CriminalLawRetriever:
    """Retriever class for querying criminal law sections stored in Qdrant DB."""

    def __init__(self, storage_path: str = DEFAULT_STORAGE_PATH):
        qdrant_url = os.getenv("QDRANT_URL")
        api_key = os.getenv("QDRANT_API_KEY")

        if qdrant_url:
            print(f"Connecting to Qdrant Cloud server at: {qdrant_url} with timeout=60")
            self.client = QdrantClient(url=qdrant_url, api_key=api_key, timeout=60)
        else:
            print(f"Using local Qdrant storage at: {storage_path}")
            self.client = QdrantClient(path=storage_path)

        self.embed_model = TextEmbedding(model_name=EMBEDDING_MODEL_NAME)

    def search(
        self,
        query: str,
        collection_name: str,
        limit: int = 5,
        act_id: Optional[str] = None,
        score_threshold: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant criminal law sections matching the query string within a specific collection.

        Args:
            query: User search query or question.
            collection_name: Name of the Qdrant collection to search in.
            limit: Maximum number of results to return.
            act_id: Optional act filter (e.g. 'UAPA_1967', 'POCSO_2012', 'BNSS_2023', 'NDPS_1985', 'ARMS_1959', 'DV_2005').
            score_threshold: Minimum similarity score cutoff.

        Returns:
            List of matching document dicts with score and payload metadata.
        """
        query_vector = list(self.embed_model.embed([query]))[0].tolist()

        query_filter = None
        if act_id:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="act_id",
                        match=MatchValue(value=act_id),
                    )
                ]
            )

        response = self.client.query_points(
            collection_name=collection_name,
            query=query_vector,
            query_filter=query_filter,
            limit=limit,
            score_threshold=score_threshold,
        )

        results = []
        for hit in response.points:
            results.append({
                "score": hit.score,
                "point_id": hit.id,
                "chunk_id": hit.payload.get("chunk_id"),
                "act_id": hit.payload.get("act_id"),
                "act_title": hit.payload.get("act_title"),
                "section_number": hit.payload.get("section_number"),
                "section_title": hit.payload.get("section_title"),
                "chapter": hit.payload.get("chapter"),
                "source_label": hit.payload.get("source_label"),
                "text": hit.payload.get("text"),
            })
        return results

    def keyword_search(
        self,
        keywords: List[str],
        collection_name: str,
        limit: int = 20,
        act_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant criminal law sections matching any of the keyword terms in the payload 'text' field.
        """
        # Construct a Filter using MatchText for each keyword term
        should_conditions = [
            FieldCondition(
                key="text",
                match=MatchText(text=kw),
            )
            for kw in keywords if kw.strip()
        ]

        if not should_conditions:
            return []

        query_filter = Filter(should=should_conditions)
        if act_id:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="act_id",
                        match=MatchValue(value=act_id),
                    )
                ],
                should=should_conditions
            )

        response = self.client.scroll(
            collection_name=collection_name,
            scroll_filter=query_filter,
            limit=limit,
            with_payload=True,
            with_vectors=False,
        )

        points = response[0]

        results = []
        for hit in points:
            # We calculate a simple overlap score based on how many keywords match the text.
            # This helps rank keyword search results before RRF or LLM reranking.
            text_lower = hit.payload.get("text", "").lower()
            overlap_count = sum(1 for kw in keywords if kw.lower() in text_lower)
            score = float(overlap_count) / len(keywords) if keywords else 0.0

            results.append({
                "score": score,
                "point_id": hit.id,
                "chunk_id": hit.payload.get("chunk_id"),
                "act_id": hit.payload.get("act_id"),
                "act_title": hit.payload.get("act_title"),
                "section_number": hit.payload.get("section_number"),
                "section_title": hit.payload.get("section_title"),
                "chapter": hit.payload.get("chapter"),
                "source_label": hit.payload.get("source_label"),
                "text": hit.payload.get("text"),
            })

        # Sort by overlap score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results





def main():
    """CLI tester for search queries."""
    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "punishment for terrorism and unlawful activities"
    print(f"Executing search query: '{query}'\n")

    retriever = CriminalLawRetriever()

    # Search across all known collections by default for testing
    collections = ["arms", "bnss", "domestic_violence", "ndps", "pocso", "uapa"]
    all_results = []

    for col in collections:
        try:
            print(f"Searching collection '{col}'...")
            results = retriever.search(query=query, collection_name=col, limit=3)
            all_results.extend(results)
        except Exception as e:
            print(f"Could not search collection '{col}': {e}")

    # Sort results from all collections by similarity score descending
    all_results.sort(key=lambda x: x["score"], reverse=True)
    top_results = all_results[:3]

    if not top_results:
        print("No matching results found.")
        return

    print("\nTop 3 Similarity Results:")
    for idx, res in enumerate(top_results, start=1):
        print(f"--- Result #{idx} (Score: {res['score']:.4f}) ---")
        print(f"Source : {res['source_label']}")
        print(f"Chapter: {res['chapter']}")
        print(f"Title  : {res['section_title']}")
        print(f"Text Snippet:\n{res['text'][:300]}...\n")


if __name__ == "__main__":
    main()

