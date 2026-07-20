from fastapi import APIRouter, Depends, HTTPException
import uuid
from firebase_admin import firestore
from backend.routers.auth import get_current_user
from backend.services.personalization_engine import personalization_engine
from backend.firebase_admin_init import db

router = APIRouter(prefix="/api/paper", tags=["paper"])

@router.post("/generate")
async def generate_personalized_paper(user: dict = Depends(get_current_user)):
    """
    Generates a personalized 75-question adaptive test paper matching the student's mastery profile.
    Saves the list of question IDs to Firestore to cross-reference on submission.
    """
    student_id = user["uid"]
    try:
        # Fetch target_exam from user document
        user_doc = db.collection("users").document(student_id).get()
        target_exam = "JEE"
        if user_doc.exists:
            target_exam = user_doc.to_dict().get("target_exam", "JEE")

        # Generate 75 questions using personalization engine
        questions = personalization_engine.generate_paper(student_id, target_exam=target_exam, num_questions=75)
        
        # Save generated paper meta to Firestore
        paper_id = str(uuid.uuid4())
        question_ids = [q["id"] for q in questions]
        
        db.collection("papers").document(paper_id).set({
            "paper_id": paper_id,
            "student_id": student_id,
            "question_ids": question_ids,
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        # Clean response: strip correct answers and explanations
        client_questions = []
        for q in questions:
            client_questions.append({
                "id": q["id"],
                "subject": q["subject"],
                "topic": q["topic"],
                "difficulty": q["difficulty"],
                "question_text": q["question_text"],
                "options": q["options"]
            })
            
        return {
            "paper_id": paper_id,
            "questions": client_questions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate paper: {e}")
