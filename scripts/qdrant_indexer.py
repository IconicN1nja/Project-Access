"""
Qdrant Indexer for Project Access Criminal Law Data
===================================================
Scans all `*_flattened.json` files inside `data/criminal/` subdirectories
and indexes section text and metadata into Qdrant vector database.
"""

import glob
import json
import os
import sys
from typing import Dict, List, Any

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from fastembed import TextEmbedding

# Load environment variables
load_dotenv()

# Configuration
COLLECTION_NAME = "criminal_laws"
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "criminal"))
DEFAULT_STORAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "qdrant_storage"))
EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"


def get_qdrant_client(storage_path: str = DEFAULT_STORAGE_PATH) -> QdrantClient:
    """Initialize Qdrant client (supports local disk or remote URL)."""
    qdrant_url = os.getenv("QDRANT_URL")
    api_key = os.getenv("QDRANT_API_KEY")

    if qdrant_url:
        print(f"Connecting to Qdrant Cloud server at: {qdrant_url}")
        return QdrantClient(url=qdrant_url, api_key=api_key)
    else:
        print(f"Using local Qdrant storage at: {storage_path}")
        os.makedirs(storage_path, exist_ok=True)
        return QdrantClient(path=storage_path)


def find_flattened_files(base_dir: str) -> List[str]:
    """Find all *_flattened.json files in subdirectories of base_dir."""
    pattern = os.path.join(base_dir, "**", "*_flattened.json")
    files = glob.glob(pattern, recursive=True)
    return files


def load_flattened_json(filepath: str) -> Dict[str, Any]:
    """Load and parse a single flattened JSON file."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def prepare_documents(flattened_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract section objects with formatted text for embedding."""
    act_id = flattened_data.get("act_id", "UNKNOWN_ACT")
    act_title = flattened_data.get("act_title", "Unknown Act")
    sections = flattened_data.get("sections", [])

    documents = []
    for sec in sections:
        sec_num = str(sec.get("section_number", ""))
        sec_title = sec.get("section_title", "")
        chapter = sec.get("chapter", "")
        text = sec.get("text", "")
        source_label = sec.get("source_label", f"Section {sec_num}, {act_title}")
        chunk_id = sec.get("chunk_id", f"{act_id}_{sec_num}")

        # Combine section title, chapter, and text for rich embedding context
        embed_content = f"{source_label}\nChapter: {chapter}\nTitle: {sec_title}\n\n{text}".strip()

        documents.append({
            "chunk_id": chunk_id,
            "act_id": act_id,
            "act_title": act_title,
            "section_number": sec_num,
            "section_title": sec_title,
            "chapter": chapter,
            "source_label": source_label,
            "text": text,
            "embed_content": embed_content,
        })
    return documents


def index_criminal_data():
    """Main indexing pipeline."""
    print("=========================================")
    print("Project Access - Qdrant Criminal Data Indexer")
    print("=========================================\n")

    flattened_files = find_flattened_files(DATA_DIR)
    if not flattened_files:
        print(f"ERROR: No '*_flattened.json' files found in {DATA_DIR}")
        sys.exit(1)

    print(f"Found {len(flattened_files)} flattened JSON files:")
    for f in flattened_files:
        print(f" - {os.path.relpath(f, DATA_DIR)}")
    print()

    # Initialize Embedding Model
    print(f"\nLoading FastEmbed model ({EMBEDDING_MODEL_NAME})...")
    embed_model = TextEmbedding(model_name=EMBEDDING_MODEL_NAME)

    # Initialize Qdrant Client
    client = get_qdrant_client()

    # Determine vector dimension
    print("Generating sample embedding to check dimensions...")
    sample_vec = list(embed_model.embed(["test query"]))[0]
    vector_dim = len(sample_vec)
    print(f"Vector dimension: {vector_dim}")

    # Remove the old collection if it exists
    print(f"\nChecking for old collection '{COLLECTION_NAME}'...")
    if client.collection_exists(COLLECTION_NAME):
        print(f"Deleting old collection '{COLLECTION_NAME}' to remove old data...")
        client.delete_collection(COLLECTION_NAME)
        print(f"Successfully deleted collection '{COLLECTION_NAME}'.")
    else:
        print(f"Old collection '{COLLECTION_NAME}' does not exist.")

    # Process each flattened file into its own collection
    for filepath in flattened_files:
        # Determine the collection name from the parent directory's folder name
        folder_name = os.path.basename(os.path.dirname(filepath))
        collection_name = folder_name.lower().strip()

        print(f"\n--------------------------------------------------")
        print(f"Processing: {os.path.basename(filepath)}")
        print(f"Target Collection: '{collection_name}'")
        print(f"--------------------------------------------------")

        # Load file data
        data = load_flattened_json(filepath)
        docs = prepare_documents(data)
        print(f"Loaded {len(docs)} sections.")

        # Create/recreate target collection
        if client.collection_exists(collection_name):
            print(f"Collection '{collection_name}' already exists. Deleting to start fresh...")
            client.delete_collection(collection_name)

        print(f"Creating collection '{collection_name}'...")
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_dim, distance=Distance.COSINE),
        )

        # Batch upsert points
        batch_size = 64
        point_id = 1
        print(f"Generating embeddings and upserting points in batches of {batch_size}...")

        for i in range(0, len(docs), batch_size):
            batch_docs = docs[i : i + batch_size]
            texts_to_embed = [doc["embed_content"] for doc in batch_docs]

            embeddings = list(embed_model.embed(texts_to_embed))

            batch_points = []
            for doc, emb in zip(batch_docs, embeddings):
                payload = {
                    "chunk_id": doc["chunk_id"],
                    "act_id": doc["act_id"],
                    "act_title": doc["act_title"],
                    "section_number": doc["section_number"],
                    "section_title": doc["section_title"],
                    "chapter": doc["chapter"],
                    "source_label": doc["source_label"],
                    "text": doc["text"],
                }
                batch_points.append(
                    PointStruct(
                        id=point_id,
                        vector=emb.tolist(),
                        payload=payload,
                    )
                )
                point_id += 1

            client.upsert(collection_name=collection_name, points=batch_points)
            print(f"  Indexed {min(i + batch_size, len(docs))}/{len(docs)} sections...", flush=True)

        collection_info = client.get_collection(collection_name)
        print(f"SUCCESS: Collection '{collection_name}' indexed with {collection_info.points_count} points!")

    print("\n=========================================", flush=True)
    print("SUCCESS: All Collections Indexed Successfully!", flush=True)
    print("=========================================", flush=True)


if __name__ == "__main__":
    index_criminal_data()

