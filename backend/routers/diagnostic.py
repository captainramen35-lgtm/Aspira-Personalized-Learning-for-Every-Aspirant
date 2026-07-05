from fastapi import APIRouter, HTTPException, Depends
import json
from backend.models.schemas import DiagnosticSubmitRequest, TestQuestionResponse
from backend.routers.auth import get_current_user
from backend.services.mastery_calculator import mastery_calculator
from firebase_admin import firestore
from typing import List

router = APIRouter(prefix="/api/diagnostic", tags=["diagnostic"])

# Seed list of question IDs to use as the fixed diagnostic test
DIAGNOSTIC_QUESTION_IDS = [
    "q002",  # Mechanics
    "q010",  # Thermodynamics
    "q018",  # Electrochemistry
    "q026",  # Organic Chemistry
    "q034",  # Inorganic Chemistry
    "q042",  # Calculus
    "q050",  # Genetics
    "q058"   # Human Physiology
]

@router.get("/questions", response_model=List[TestQuestionResponse])
async def get_diagnostic_questions():
    """
    Returns the fixed 8-question diagnostic test covering all core topics.
    """
    try:
        with open("backend/data/question_bank.json", "r") as f:
            question_bank = json.load(f)
            
        diagnostic_questions = [q for q in question_bank if q["id"] in DIAGNOSTIC_QUESTION_IDS]
        return diagnostic_questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load diagnostic questions: {e}")

@router.post("/submit")
async def submit_diagnostic(req: DiagnosticSubmitRequest, user: dict = Depends(get_current_user)):
    """
    Evaluates the student's diagnostic test answers and writes the initial Mastery Profile to Firestore.
    """
    student_id = user["uid"]
    
    try:
        with open("backend/data/question_bank.json", "r") as f:
            question_bank = json.load(f)
        
        q_map = {q["id"]: q for q in question_bank}
        
        results = []
        for q_id, student_ans in req.answers.items():
            if q_id not in q_map:
                continue
            
            q = q_map[q_id]
            is_correct = (student_ans.strip().upper() == q["correct_answer"].strip().upper())
            time_spent = req.timestamps.get(q_id, 45.0) if req.timestamps else 45.0
            
            results.append({
                "q_id": q_id,
                "topic": q["topic"],
                "is_correct": is_correct,
                "time_spent": time_spent
            })
            
        # Initialize the mastery profile (note: tests_completed starts at 1 representing the diagnostic test)
        profile = mastery_calculator.update_profile(student_id, results)
        
        # Save diagnostic test submission details for reference
        from backend.firebase_admin_init import db
        db.collection("submissions").add({
            "student_id": student_id,
            "test_type": "diagnostic",
            "answers": req.answers,
            "timestamps": req.timestamps or {},
            "score": sum(1 for r in results if r["is_correct"]),
            "total_questions": len(results),
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        return {"status": "success", "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnostic submission failed: {e}")
