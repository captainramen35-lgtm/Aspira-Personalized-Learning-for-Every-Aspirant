from fastapi import APIRouter, Depends
from backend.routers.auth import get_current_user
from backend.firebase_admin_init import db
from backend.question_generator_definitions import (
    PHYSICS_CURRICULUM,
    CHEMISTRY_CURRICULUM,
    BIOLOGY_CURRICULUM,
    MATHEMATICS_CURRICULUM
)
from backend.services.question_bank_loader import question_bank_loader

router = APIRouter(prefix="/api/syllabus", tags=["syllabus"])

@router.get("")
async def get_syllabus(user: dict = Depends(get_current_user)):
    """
    Returns the authoritative exam syllabus (JEE vs NEET) with topic & question counts.
    """
    student_id = user["uid"]
    target_exam = "JEE"
    user_doc = db.collection("users").document(student_id).get()
    if user_doc.exists:
        target_exam = user_doc.to_dict().get("target_exam", "JEE")

    if target_exam == "NEET":
        curriculums = {
            "Physics": PHYSICS_CURRICULUM,
            "Chemistry": CHEMISTRY_CURRICULUM,
            "Biology": BIOLOGY_CURRICULUM
        }
    else:
        curriculums = {
            "Physics": PHYSICS_CURRICULUM,
            "Chemistry": CHEMISTRY_CURRICULUM,
            "Mathematics": MATHEMATICS_CURRICULUM
        }

    all_questions = question_bank_loader.get_all_questions()

    result = {
        "target_exam": target_exam,
        "subjects": {}
    }

    for subject_name, curr_dict in curriculums.items():
        sub_questions = [q for q in all_questions if q.get("subject", "").lower() == subject_name.lower()]
        
        chapters = []
        total_topics_count = 0

        for chapter_name, topics in curr_dict.items():
            chap_questions = [q for q in sub_questions if q.get("chapter", "").lower() == chapter_name.lower()]
            total_topics_count += len(topics)

            topic_details = []
            for topic_name in topics:
                top_q_count = len([q for q in chap_questions if q.get("topic", "").lower() == topic_name.lower()])
                topic_details.append({
                    "name": topic_name,
                    "question_count": top_q_count
                })

            chapters.append({
                "name": chapter_name,
                "topic_count": len(topics),
                "question_count": len(chap_questions),
                "topics": topic_details
            })

        result["subjects"][subject_name] = {
            "chapter_count": len(curr_dict),
            "topic_count": total_topics_count,
            "question_count": len(sub_questions),
            "chapters": chapters
        }

    return result
