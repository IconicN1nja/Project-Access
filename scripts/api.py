from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
from typing import List, Dict, Any

# Ensure parent directory is in path to import RAG chain
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
try:
    from scripts.rag_chain import CriminalLawRAG
except ImportError:
    from rag_chain import CriminalLawRAG

app = FastAPI(title="Counselor AI - RAG API")

# Enable CORS for the Next.js development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local testing; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG pipeline
try:
    rag = CriminalLawRAG()
except Exception as e:
    print(f"Error initializing RAG pipeline: {e}")
    rag = None

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    question: str
    answer: str
    classified_collection: str
    retrieved_docs: List[Dict[str, Any]]

@app.post("/api/query", response_model=QueryResponse)
def handle_query(payload: QueryRequest):
    if not rag:
        raise HTTPException(status_code=500, detail="RAG Pipeline not initialized on the server.")
    
    try:
        print(f"\n[API] Received question: {payload.question}")
        res = rag.answer_question(payload.question)
        
        # Extract fields returned by answer_question
        return QueryResponse(
            question=res.get("question", payload.question),
            answer=res.get("answer", ""),
            classified_collection=res.get("classified_collection", "bnss"),
            retrieved_docs=res.get("retrieved_docs", [])
        )
    except Exception as e:
        print(f"[API Error] Exception during RAG query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting Counselor AI RAG API Server...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
