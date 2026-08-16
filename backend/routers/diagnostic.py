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
from typing import List, Optional

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
async def get_diagnostic_questions(subject: Optional[str] = None, user: dict = Depends(get_current_user)):
    """
    Returns a subject-specific 30-question diagnostic test based on broad syllabus coverage.
    If no subject is passed, defaults to Physics.
    """
    uid = user["uid"]
    try:
        from backend.firebase_admin_init import db
        user_doc = db.collection("users").document(uid).get()
        target_exam = "JEE"
        if user_doc.exists:
            target_exam = user_doc.to_dict().get("target_exam", "JEE")

        # Determine target subject
        req_subject = subject.capitalize() if subject else ("Biology" if target_exam == "NEET" else "Physics")

        # Validation: Bio not for JEE, Math not for NEET
        if target_exam == "NEET" and req_subject == "Mathematics":
            raise HTTPException(status_code=400, detail="Mathematics diagnostic is not available for NEET students.")
        if target_exam == "JEE" and req_subject == "Biology":
            raise HTTPException(status_code=400, detail="Biology diagnostic is not available for JEE students.")

        all_subject_qs = question_bank_loader.get_filtered_questions(
            subject=req_subject,
            target_exam=target_exam
        )

        if not all_subject_qs:
            all_subject_qs = question_bank_loader.get_questions_by_subject(req_subject)

        # Categorize by difficulty
        easy_pool = [q for q in all_subject_qs if q.get("difficulty", "").lower() == "easy"]
        medium_pool = [q for q in all_subject_qs if q.get("difficulty", "").lower() == "medium"]
        hard_pool = [q for q in all_subject_qs if q.get("difficulty", "").lower() == "hard"]

        import random
        # Stable seed per user + subject so user gets consistent paper on refresh
        random.seed(f"{uid}_{req_subject}_diag_v2")

        random.shuffle(easy_pool)
        random.shuffle(medium_pool)
        random.shuffle(hard_pool)

        # Target distribution: ~30% Easy (9), ~50% Medium (15), ~20% Hard (6) -> 30 Qs total
        selected_qs = []
        selected_qs.extend(easy_pool[:9])
        selected_qs.extend(medium_pool[:15])
        selected_qs.extend(hard_pool[:6])

        # Top up if any difficulty pool was short
        if len(selected_qs) < 30:
            remaining_needed = 30 - len(selected_qs)
            already_selected_ids = {q["id"] for q in selected_qs}
            leftovers = [q for q in all_subject_qs if q["id"] not in already_selected_ids]
            random.shuffle(leftovers)
            selected_qs.extend(leftovers[:remaining_needed])

        # Final shuffle across the 30 questions
        random.shuffle(selected_qs)
        return selected_qs[:30]
    except HTTPException:
        raise
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
                "difficulty": r["difficulty"],
                "is_correct": r["is_correct"],
                "time_spent": r["time_spent"]
            }
            for r in results
        ]
        profile = mastery_calculator.update_profile(student_id, profile_results, test_type="diagnostic")
        
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
