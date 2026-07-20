from fastapi import APIRouter, HTTPException, Depends
import json
import uuid
import asyncio
from backend.models.schemas import DiagnosticSubmitRequest, TestQuestionResponse
from backend.routers.auth import get_current_user
from backend.services.mastery_calculator import mastery_calculator
from backend.services.question_bank_loader import question_bank_loader
from backend.services.gemini_client import gemini_client
from firebase_admin import firestore
from typing import List

router = APIRouter(prefix="/api/diagnostic", tags=["diagnostic"])

# 25-Question Diagnostic Test Configurations
JEE_DIAGNOSTIC_IDS = [
    # Physics (8)
    "phy_001", "phy_002", "phy_005", "phy_008", "phy_012", "phy_016", "phy_018", "phy_020",
    # Chemistry (8)
    "chem_001", "chem_003", "chem_006", "chem_009", "chem_010", "chem_014", "chem_015", "chem_023",
    # Mathematics (9)
    "math_001", "math_002", "math_005", "math_008", "math_010", "math_011", "math_015", "math_018", "math_023"
]

NEET_DIAGNOSTIC_IDS = [
    # Physics (6)
    "phy_001", "phy_002", "phy_006", "phy_009", "phy_012", "phy_018",
    # Chemistry (6)
    "chem_001", "chem_002", "chem_004", "chem_007", "chem_012", "chem_021",
    # Biology (13)
    "bio_001", "bio_002", "bio_003", "bio_004", "bio_005", "bio_006", "bio_007", "bio_008", "bio_009", "bio_010", "bio_011", "bio_012", "bio_013"
]

@router.get("/questions", response_model=List[TestQuestionResponse])
async def get_diagnostic_questions(user: dict = Depends(get_current_user)):
    """
    Returns the fixed 25-question diagnostic test based on the student's target exam (JEE or NEET).
    """
    uid = user["uid"]
    try:
        from backend.firebase_admin_init import db
        user_doc = db.collection("users").document(uid).get()
        target_exam = "JEE"
        if user_doc.exists:
            target_exam = user_doc.to_dict().get("target_exam", "JEE")

        question_ids = NEET_DIAGNOSTIC_IDS if target_exam == "NEET" else JEE_DIAGNOSTIC_IDS
        diagnostic_questions = question_bank_loader.get_questions_by_ids(question_ids)
        return diagnostic_questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load diagnostic questions: {e}")

@router.post("/submit")
async def submit_diagnostic(req: DiagnosticSubmitRequest, user: dict = Depends(get_current_user)):
    """
    Evaluates the student's diagnostic test answers, runs concurrent AI scoring + auditing,
    saves the detailed submission to Firestore, and writes the initial Mastery Profile.
    """
    student_id = user["uid"]
    
    try:
        results = []
        gemini_tasks = []
        gemini_indices = []
        score_count = 0

        # 1. Prepare questions grading and queue AI tasks
        for q_id, student_ans in req.answers.items():
            q = question_bank_loader.get_question_by_id(q_id)
            if not q:
                continue
            
            student_ans_clean = student_ans.strip().upper()
            correct_ans = q["correct_answer"].strip().upper()
            is_correct = (student_ans_clean == correct_ans)
            time_spent = req.timestamps.get(q_id, 45.0) if req.timestamps else 45.0
            
            if is_correct:
                score_count += 1
                
            gemini_tasks.append(
                gemini_client.get_combined_feedback_async(
                    question_text=q["question_text"],
                    options=q["options"],
                    correct_answer=correct_ans,
                    student_answer=student_ans_clean
                )
            )
            gemini_indices.append(len(results))

            results.append({
                "q_id": q_id,
                "subject": q["subject"],
                "topic": q["topic"],
                "chapter": q.get("chapter", "General"),
                "difficulty": q["difficulty"],
                "question_text": q["question_text"],
                "options": q["options"],
                "correct_answer": correct_ans,
                "student_answer": student_ans_clean,
                "is_correct": is_correct,
                "time_spent": time_spent,
                "ai_score_details": {},
                "ai_audit_details": {},
                "socratic_feedback": {}
            })
            
        # 2. Run all Gemini evaluations concurrently
        if gemini_tasks:
            gemini_results = await asyncio.gather(*gemini_tasks, return_exceptions=True)
            for idx, gemini_res in zip(gemini_indices, gemini_results):
                is_correct = results[idx]["is_correct"]
                correct_ans = results[idx]["correct_answer"]
                student_ans = results[idx]["student_answer"]
                
                if isinstance(gemini_res, Exception):
                    results[idx]["ai_score_details"] = {
                        "reasoning": f"Correct! The student answered {student_ans}." if is_correct else f"Student answered {student_ans}. The correct answer is {correct_ans}.",
                        "mistake_type": "none" if is_correct else "conceptual"
                    }
                    results[idx]["ai_audit_details"] = {"score": 1 if is_correct else 0}
                    results[idx]["socratic_feedback"] = {}
                else:
                    results[idx]["ai_score_details"] = gemini_res.get("ai_score_details", {})
                    if is_correct:
                        results[idx]["ai_score_details"]["mistake_type"] = "none"
                    results[idx]["ai_audit_details"] = gemini_res.get("ai_audit_details", {})
                    if not is_correct:
                        results[idx]["socratic_feedback"] = gemini_res.get("socratic_feedback", {})
                    else:
                        results[idx]["socratic_feedback"] = {}

        # 3. Initialize/update student's mastery profile
        profile_results = [
            {
                "q_id": r["q_id"],
                "topic": r["topic"],
                "chapter": r["chapter"],
                "is_correct": r["is_correct"],
                "time_spent": r["time_spent"]
            }
            for r in results
        ]
        profile = mastery_calculator.update_profile(student_id, profile_results)
        
        # 4. Save diagnostic test submission details in a standard format
        from backend.firebase_admin_init import db
        submission_id = str(uuid.uuid4())
        db.collection("submissions").document(submission_id).set({
            "submission_id": submission_id,
            "student_id": student_id,
            "test_type": "diagnostic",
            "score": score_count,
            "total_questions": len(results),
            "results": results,
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        return {"status": "success", "submission_id": submission_id, "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnostic submission failed: {e}")
