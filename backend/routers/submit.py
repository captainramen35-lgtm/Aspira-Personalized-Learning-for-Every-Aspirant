from fastapi import APIRouter, Depends, HTTPException
import json
import uuid
import asyncio
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

        # 2. Use question_bank_loader to fetch questions
        from backend.services.question_bank_loader import question_bank_loader
        q_map = {q_id: question_bank_loader.get_question_by_id(q_id) for q_id in question_ids if question_bank_loader.get_question_by_id(q_id)}

        # 3. Fetch current mastery profile to pass tier context to Gemini
        profile_ref = db.collection("mastery_profiles").document(student_id)
        profile_doc = profile_ref.get()
        chapters = {}
        mastery = {}
        if profile_doc.exists:
            p_data = profile_doc.to_dict()
            chapters = p_data.get("chapters", {})
            mastery = p_data.get("mastery", {})

        # 4. Grade each question
        submission_results = []
        score_count = 0
        gemini_tasks = []
        gemini_indices = []

        for q_id in question_ids:
            if q_id not in q_map:
                continue

            q = q_map[q_id]
            student_ans = req.answers.get(q_id, "").strip().upper()
            correct_ans = q["correct_answer"].strip().upper()
            time_spent = req.timestamps.get(q_id, 30.0)

            is_correct = (student_ans == correct_ans)

            if is_correct:
                score_count += 1

            # Prepare placeholder structures
            ai_details = {}
            audit_details = {}
            socratic_feedback = {}

            # Determine mastery tier for context
            chap = q.get("chapter", "General")
            topic = q["topic"]
            
            data = chapters.get(chap) or mastery.get(topic)
            mastery_tier = "Moderate"
            reflection_trend = "stable"
            
            if data:
                acc = data.get("accuracy", 50.0)
                if acc < 40.0:
                    mastery_tier = "Weak"
                elif acc > 65.0:
                    mastery_tier = "Strong"
                reflection_trend = data.get("trend", "stable")

            # Queue async concurrent Gemini request for ALL questions!
            gemini_tasks.append(
                gemini_client.get_combined_feedback_async(
                    question_text=q["question_text"],
                    options=q["options"],
                    correct_answer=correct_ans,
                    student_answer=student_ans,
                    mastery_tier=mastery_tier,
                    reflection_trend=reflection_trend
                )
            )
            gemini_indices.append(len(submission_results))

            submission_results.append({
                "q_id": q_id,
                "subject": q["subject"],
                "topic": q["topic"],
                "chapter": q.get("chapter", "General"),
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

        # Process all questions concurrently
        if gemini_tasks:
            gemini_results = await asyncio.gather(*gemini_tasks, return_exceptions=True)
            for idx, gemini_res in zip(gemini_indices, gemini_results):
                is_correct = submission_results[idx]["is_correct"]
                correct_ans = submission_results[idx]["correct_answer"]
                student_ans = submission_results[idx]["student_answer"]
                
                if isinstance(gemini_res, Exception):
                    submission_results[idx]["ai_score_details"] = {
                        "reasoning": f"Correct! The student answered {student_ans}." if is_correct else f"Student answered {student_ans}. The correct answer is {correct_ans}.",
                        "mistake_type": "none" if is_correct else "conceptual"
                    }
                    submission_results[idx]["ai_audit_details"] = {"score": 1 if is_correct else 0}
                    submission_results[idx]["socratic_feedback"] = {}
                else:
                    submission_results[idx]["ai_score_details"] = gemini_res.get("ai_score_details", {})
                    # Ensure mistake_type is 'none' for correct answers
                    if is_correct:
                        submission_results[idx]["ai_score_details"]["mistake_type"] = "none"
                        
                    submission_results[idx]["ai_audit_details"] = gemini_res.get("ai_audit_details", {})
                    
                    # Only include Socratic feedback hints if the answer was incorrect
                    if not is_correct:
                        submission_results[idx]["socratic_feedback"] = gemini_res.get("socratic_feedback", {})
                    else:
                        submission_results[idx]["socratic_feedback"] = {}

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
                "chapter": r.get("chapter", "General"),
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
