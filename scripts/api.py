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

app = FastAPI(title="Project Access")

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

from typing import List, Dict, Any, Optional

class QueryMessage(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    question: str
    is_voice: Optional[bool] = False
    messages: Optional[List[QueryMessage]] = None
    response_language: Optional[str] = "English"

class QueryResponse(BaseModel):
    question: str
    answer: str
    classified_collection: str
    retrieved_docs: List[Dict[str, Any]]

@app.post("/api/query", response_model=QueryResponse)
def handle_query(payload: QueryRequest):
    if not rag:
        return QueryResponse(
            question=payload.question,
            answer="Something went wrong. Please try again.",
            classified_collection="bns",
            retrieved_docs=[]
        )
    
    try:
        print(f"\n[API] Received question (is_voice={payload.is_voice}, lang={payload.response_language}, history_len={len(payload.messages) if payload.messages else 0}): {payload.question}")
        history = [m.model_dump() for m in payload.messages] if payload.messages else None
        res = rag.answer_question(
            payload.question,
            is_voice=bool(payload.is_voice),
            chat_history=history,
            response_language=payload.response_language,
        )
        
        # Extract fields returned by answer_question
        return QueryResponse(
            question=res.get("question", payload.question),
            answer=res.get("answer", "Something went wrong. Please try again."),
            classified_collection=res.get("classified_collection", "bns"),
            retrieved_docs=res.get("retrieved_docs", [])
        )
    except Exception as e:
        print(f"[API Error] Exception during RAG query: {e}")
        return QueryResponse(
            question=payload.question,
            answer="Something went wrong. Please try again.",
            classified_collection="bns",
            retrieved_docs=[]
        )

if __name__ == "__main__":
    import uvicorn
    print("Starting Project Access Server...")
    uvicorn.run(app,host="0.0.0.0",port=int(os.environ.get("PORT", 8000)))
