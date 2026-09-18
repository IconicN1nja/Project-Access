from qdrant_client import QdrantClient

QDRANT_URL = "YOUR_URL"
QDRANT_API_KEY = "YOUR_KEY"

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    timeout=60,
)

print("Testing Qdrant...")

print(client.get_collections())

print("Testing POCSO...")

print(client.get_collection("pocso"))

print("SUCCESS")