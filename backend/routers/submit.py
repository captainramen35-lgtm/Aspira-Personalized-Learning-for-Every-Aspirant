from fastapi import APIRouter, Depends, HTTPException
import json
import uuid
from firebase_admin import firestore
from backend.models.schemas import TestSubmitRequest
from backend.routers.auth import get_current_user
from backend.services.gemini_client import gemini_client
from backend.services.mastery_calculator import mastery_calculator
from backend.firebase_admin_init import db

router = APIRouter(prefix="/api/submit", tags=["submit"])

@router.post("")
async def submit_test(req: TestSubmitRequest, user: dict = Depends(get_current_user)):
    """
    Submits a custom personalized test.
    Grades answers, runs AI Scorer + Auditor + Socratic hint generator, and updates the student's mastery profile.
    """
    student_id = user["uid"]
    
    try:
        # 1. Fetch generated paper metadata to verify question IDs
        paper_ref = db.collection("papers").document(req.paper_id)
        paper_doc = paper_ref.get()
        if not paper_doc.exists:
            raise HTTPException(status_code=404, detail="Paper not found.")
        
        paper_data = paper_doc.to_dict()
        if paper_data.get("student_id") != student_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this paper.")

        question_ids = paper_data.get("question_ids", [])

        # 2. Load the question bank
        with open("backend/data/question_bank.json", "r") as f:
            question_bank = json.load(f)
            
        q_map = {q["id"]: q for q in question_bank}

        # 3. Grade each question
        submission_results = []
        score_count = 0

        for q_id in question_ids:
            if q_id not in q_map:
                continue

            q = q_map[q_id]
            student_ans = req.answers.get(q_id, "").strip().upper()
            correct_ans = q["correct_answer"].strip().upper()
            time_spent = req.timestamps.get(q_id, 30.0)

            is_correct = (student_ans == correct_ans)

            ai_details = {}
            audit_details = {}
            socratic_feedback = {}

            if is_correct:
                score_count += 1
                ai_details = {
                    "reasoning": "Correct! The student's answer matches the correct option.",
                    "mistake_type": "none"
                }
                audit_details = {"score": 1}
            else:
                # Retrieve AI evaluation for incorrect answers
                ai_details = gemini_client.get_ai_score(
                    question_text=q["question_text"],
                    options=q["options"],
                    correct_answer=correct_ans,
                    student_answer=student_ans
                )
                
                # Retrieve independent AI Auditor check
                audit_details = gemini_client.get_ai_audit(
                    question_text=q["question_text"],
                    options=q["options"],
                    correct_answer=correct_ans,
                    student_answer=student_ans
                )

                # Reconcile scorer vs auditor (Trust & fairness check)
                # If auditor thinks it is correct (score=1) but scorer said wrong, reconcile to correct.
                # Since this is an MCQ, if student_ans != correct_ans, it is mathematically wrong.
                # However, if they disagree on the score, we flag it or align it.
                if audit_details.get("score") == 1 and not is_correct:
                    # Auditor false positive or close answer, we stick to MCQ correctness but log reconciliation
                    audit_details["reconciliation"] = "MCQ key mismatch resolved to incorrect; auditor override ignored."
                    audit_details["score"] = 0

                # Generate 3 Socratic hints and worked solution
                socratic_feedback = gemini_client.get_socratic_feedback(
                    question_text=q["question_text"],
                    correct_answer=correct_ans,
                    student_answer=student_ans
                )

            submission_results.append({
                "q_id": q_id,
                "subject": q["subject"],
                "topic": q["topic"],
                "difficulty": q["difficulty"],
                "question_text": q["question_text"],
                "options": q["options"],
                "correct_answer": correct_ans,
                "student_answer": student_ans,
                "is_correct": is_correct,
                "time_spent": time_spent,
                "ai_score_details": ai_details,
                "ai_audit_details": audit_details,
                "socratic_feedback": socratic_feedback
            })

        # 4. Save results to Firestore
        submission_id = str(uuid.uuid4())
        db.collection("submissions").document(submission_id).set({
            "submission_id": submission_id,
            "student_id": student_id,
            "paper_id": req.paper_id,
            "score": score_count,
            "total_questions": len(question_ids),
            "results": submission_results,
            "test_type": "personalized",
            "created_at": firestore.SERVER_TIMESTAMP
        })

        # 5. Update student's mastery profile
        profile_results = [
            {
                "q_id": r["q_id"],
                "topic": r["topic"],
                "is_correct": r["is_correct"],
                "time_spent": r["time_spent"]
            }
            for r in submission_results
        ]
        mastery_profile = mastery_calculator.update_profile(student_id, profile_results)

        return {
            "submission_id": submission_id,
            "score": score_count,
            "total_questions": len(question_ids),
            "results": submission_results,
            "mastery_profile": mastery_profile
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Submission failed: {e}")
