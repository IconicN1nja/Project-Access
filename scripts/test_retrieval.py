import os
import sys
from typing import List, Dict, Any

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

try:
    from scripts.rag_chain import CriminalLawRAG
except ImportError:
    from rag_chain import CriminalLawRAG

def print_results(title: str, results: List[Dict[str, Any]], expected_sections: List[str]):
    print(f"\n=== {title} ===")
    print(f"Expected Sections: {expected_sections}")
    
    found_top5 = []
    found_top10 = []
    
    # We display up to 10 results from the final list
    for idx, res in enumerate(results[:10], start=1):
        sec_num = str(res.get("section_number", "")).strip()
        sec_title = res.get("section_title", "")
        score = res.get("combined_score", res.get("score", 0.0))
        source = res.get("act_id", "")
        is_exp = " [Related Context]" if res.get("is_expansion") else ""
        
        # Check matching by section number (e.g. expected "Section 20" contains "20", match with "20")
        is_expected = False
        for expected in expected_sections:
            expected_num = expected.split()[-1].strip().lower()
            if expected_num == sec_num.lower():
                is_expected = True
                break
        
        marker = "★ [EXPECTED]" if is_expected else ""
        print(f"{idx:2d}. {source} - Section {sec_num:5s} | Score: {score:.4f} | Title: {sec_title} {marker}{is_exp}")
        
        if is_expected:
            if idx <= 5:
                found_top5.append(sec_num)
            found_top10.append(sec_num)
            
    print(f"-> In Top 5:  {'YES' if found_top5 else 'NO'} ({found_top5})")
    print(f"-> In Top 10: {'YES' if found_top10 else 'NO'} ({found_top10})")

def main():
    # Initialize RAG pipeline with top_k_final=10 for evaluation
    rag = CriminalLawRAG(top_k_retrieve=20, top_k_final=3)
    
    # Define the test cases
    tests = [
        {
            "name": "TEST 1: Narrative query about possession/arrest",
            "query": "My friend gave me a white packet and I did not know what it was, but when police found it on me, it was charas. Can I be lawfully arrested?",
            "expected_sections": ["Section 2", "Section 8", "Section 20", "Section 35", "Section 54"]
        },
        {
            "name": "TEST 2: Punishment for possessing cannabis",
            "query": "What is the punishment for possessing cannabis?",
            "expected_sections": ["Section 20"]
        },
        {
            "name": "TEST 3: Definition of charas",
            "query": "What is charas under Indian law?",
            "expected_sections": ["Section 2"]
        },
        {
            "name": "TEST 4: Arrest without warrant",
            "query": "Can police arrest someone without a warrant?",
            "expected_sections": ["Section 35", "Section 43"]
        },
        {
            "name": "TEST 5: Catch with illegal firearm",
            "query": "I was caught with an illegal firearm.",
            "expected_sections": ["Section 3", "Section 25"]
        }
    ]
    
    print("\nRunning test suite using new Hybrid Retrieval + Reranking RAG pipeline...")
    for t in tests:
        try:
            res = rag.answer_question(question=t["query"])
            print_results(t["name"], res["retrieved_docs"], t["expected_sections"])
        except Exception as e:
            print(f"Error running search for test '{t['name']}': {e}")

if __name__ == "__main__":
    main()
