from fastapi import APIRouter, Depends, HTTPException
import uuid
from pydantic import BaseModel
from typing import Optional
from firebase_admin import firestore
from backend.routers.auth import get_current_user
from backend.services.personalization_engine import personalization_engine
from backend.firebase_admin_init import db

router = APIRouter(prefix="/api/paper", tags=["paper"])

class GeneratePaperRequest(BaseModel):
    subject: Optional[str] = None
    chapter: Optional[str] = None
    topic: Optional[str] = None
    num_questions: int = 150
    test_type: str = "personalized"

@router.post("/generate")
async def generate_personalized_paper(
    request: GeneratePaperRequest,
    user: dict = Depends(get_current_user)
):
    """
    Generates a personalized test paper or mini test matching the student's mastery profile.
    Saves the list of question IDs to Firestore to cross-reference on submission.
    """
    student_id = user["uid"]
    try:
        user_doc = db.collection("users").document(student_id).get()
        target_exam = "JEE"
        if user_doc.exists:
            target_exam = user_doc.to_dict().get("target_exam", "JEE")

        # Extract from request body
        subject = request.subject
        chapter = request.chapter
        topic = request.topic
        num_questions = request.num_questions
        test_type = request.test_type

        # Set default count: 25 for Mini Test (chapter/topic provided), 150 for Subject Personalized Test
        if chapter or test_type == "mini":
            num_questions = 25
            test_type = "mini"

        questions = personalization_engine.generate_paper(
            student_id=student_id,
            target_exam=target_exam,
            num_questions=num_questions,
            subject=subject,
            chapter=chapter,
            topic=topic,
            test_type=test_type
        )
        
        paper_id = str(uuid.uuid4())
        question_ids = [q["id"] for q in questions]
        
        db.collection("papers").document(paper_id).set({
            "paper_id": paper_id,
            "student_id": student_id,
            "question_ids": question_ids,
            "test_type": test_type,
            "subject": subject,
            "chapter": chapter,
            "topic": topic,
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        client_questions = []
        for q in questions:
            client_questions.append({
                "id": q["id"],
                "subject": q["subject"],
                "chapter": q.get("chapter", "General"),
                "topic": q["topic"],
                "difficulty": q["difficulty"],
                "target_exam": q.get("target_exam", "both"),
                "estimated_solving_time_sec": q.get("estimated_solving_time_sec", 60),
                "question_text": q["question_text"],
                "options": q["options"]
            })
            
        return {
            "paper_id": paper_id,
            "test_type": test_type,
            "subject": subject,
            "chapter": chapter,
            "topic": topic,
            "questions": client_questions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate paper: {e}")
