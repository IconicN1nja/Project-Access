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
        self.qdrant_url = os.getenv("QDRANT_URL")
        self.api_key = os.getenv("QDRANT_API_KEY")
        self.use_cloud = bool(self.qdrant_url)

        if self.use_cloud:
            self.qdrant_url = self.qdrant_url.rstrip("/")
            print(f"Connecting to Qdrant Cloud server via REST API at: {self.qdrant_url}")
            self.client = None
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
        """
        query_vector = list(self.embed_model.embed([query]))[0].tolist()

        if self.use_cloud:
            payload = {
                "query": query_vector,
                "limit": limit,
                "with_payload": True,
                "with_vectors": False
            }
            if score_threshold is not None:
                payload["score_threshold"] = score_threshold
            
            if act_id:
                payload["filter"] = {
                    "must": [
                        {
                            "key": "act_id",
                            "match": {
                                "value": act_id
                            }
                        }
                    ]
                }
                
            headers = {
                "api-key": self.api_key,
                "Content-Type": "application/json",
            }
            
            import requests
            import time
            last_error = None
            points = []
            for attempt in range(3):
                try:
                    r = requests.post(
                        f"{self.qdrant_url}/collections/{collection_name}/points/query",
                        headers=headers,
                        json=payload,
                        timeout=15,
                    )
                    if r.status_code == 200:
                        res = r.json()
                        points = res.get("result", {}).get("points", [])
                        break
                    else:
                        raise RuntimeError(f"Qdrant query returned status {r.status_code}: {r.text}")
                except Exception as e:
                    last_error = e
                    print(f"[Qdrant Search Request] Attempt {attempt + 1} failed: {e}. Retrying in 1s...")
                    time.sleep(1)
            else:
                if last_error:
                    raise last_error
                raise RuntimeError("Qdrant search failed")
                
            results = []
            for hit in points:
                payload_data = hit.get("payload", {})
                results.append({
                    "score": hit.get("score", 0.0),
                    "point_id": hit.get("id"),
                    "chunk_id": payload_data.get("chunk_id"),
                    "act_id": payload_data.get("act_id"),
                    "act_title": payload_data.get("act_title"),
                    "section_number": payload_data.get("section_number"),
                    "section_title": payload_data.get("section_title"),
                    "chapter": payload_data.get("chapter"),
                    "source_label": payload_data.get("source_label"),
                    "text": payload_data.get("text"),
                })
            return results
        else:
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

            import time
            last_error = None
            response = None
            for attempt in range(3):
                try:
                    response = self.client.query_points(
                        collection_name=collection_name,
                        query=query_vector,
                        query_filter=query_filter,
                        limit=limit,
                        score_threshold=score_threshold,
                    )
                    break
                except Exception as e:
                    last_error = e
                    print(f"[Qdrant Search] Attempt {attempt + 1} failed: {e}. Retrying in 1s...")
                    time.sleep(1)
            else:
                if last_error is not None:
                    raise last_error
                raise RuntimeError("Qdrant search failed without an exception")

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
        should_conditions = [
            {
                "key": "text",
                "match": {
                    "text": kw
                }
            }
            for kw in keywords if kw.strip()
        ]

        if not should_conditions:
            return []

        if self.use_cloud:
            filter_payload = {
                "should": should_conditions
            }
            if act_id:
                filter_payload["must"] = [
                    {
                        "key": "act_id",
                        "match": {
                            "value": act_id
                        }
                    }
                ]
                
            payload = {
                "filter": filter_payload,
                "limit": limit,
                "with_payload": True,
                "with_vectors": False
            }
            
            headers = {
                "api-key": self.api_key,
                "Content-Type": "application/json",
            }
            
            import requests
            import time
            last_error = None
            points = []
            for attempt in range(3):
                try:
                    r = requests.post(
                        f"{self.qdrant_url}/collections/{collection_name}/points/scroll",
                        headers=headers,
                        json=payload,
                        timeout=15,
                    )
                    if r.status_code == 200:
                        res = r.json()
                        points = res.get("result", {}).get("points", [])
                        break
                    else:
                        raise RuntimeError(f"Qdrant scroll returned status {r.status_code}: {r.text}")
                except Exception as e:
                    last_error = e
                    print(f"[Qdrant Scroll Request] Attempt {attempt + 1} failed: {e}. Retrying in 1s...")
                    time.sleep(1)
            else:
                if last_error:
                    raise last_error
                raise RuntimeError("Qdrant scroll failed")
                
            results = []
            for hit in points:
                payload_data = hit.get("payload", {})
                text_lower = payload_data.get("text", "").lower()
                overlap_count = sum(1 for kw in keywords if kw.lower() in text_lower)
                score = float(overlap_count) / len(keywords) if keywords else 0.0

                results.append({
                    "score": score,
                    "point_id": hit.get("id"),
                    "chunk_id": payload_data.get("chunk_id"),
                    "act_id": payload_data.get("act_id"),
                    "act_title": payload_data.get("act_title"),
                    "section_number": payload_data.get("section_number"),
                    "section_title": payload_data.get("section_title"),
                    "chapter": payload_data.get("chapter"),
                    "source_label": payload_data.get("source_label"),
                    "text": payload_data.get("text"),
                })
            results.sort(key=lambda x: x["score"], reverse=True)
            return results
        else:
            should_conditions_obj = [
                FieldCondition(
                    key="text",
                    match=MatchText(text=kw),
                )
                for kw in keywords if kw.strip()
            ]
            query_filter = Filter(should=should_conditions_obj)
            if act_id:
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key="act_id",
                            match=MatchValue(value=act_id),
                        )
                    ],
                    should=should_conditions_obj
                )

            import time
            last_error = None
            response = None
            for attempt in range(3):
                try:
                    response = self.client.scroll(
                        collection_name=collection_name,
                        scroll_filter=query_filter,
                        limit=limit,
                        with_payload=True,
                        with_vectors=False,
                    )
                    break
                except Exception as e:
                    last_error = e
                    print(f"[Qdrant Scroll] Attempt {attempt + 1} failed: {e}. Retrying in 1s...")
                    time.sleep(1)
            else:
                if last_error is not None:
                    raise last_error
                raise RuntimeError("Qdrant search failed without an exception")

            points = response[0]

            results = []
            for hit in points:
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



if __name__ == "__main__":
    main()

