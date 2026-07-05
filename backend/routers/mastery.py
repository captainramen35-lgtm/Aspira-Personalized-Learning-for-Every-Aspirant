from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from backend.routers.auth import get_current_user
from backend.firebase_admin_init import db
from backend.models.schemas import MasteryProfileResponse, MasteryTopicDetail

router = APIRouter(prefix="/api/mastery", tags=["mastery"])

@router.get("", response_model=MasteryProfileResponse)
async def get_mastery_profile(user: dict = Depends(get_current_user)):
    """
    Returns the student's current Mastery Profile.
    If they haven't taken the diagnostic test yet, returns a default/empty profile.
    """
    student_id = user["uid"]
    
    # 1. Fetch user doc for metadata
    user_doc = db.collection("users").document(student_id).get()
    name = "Student"
    email = user.get("email", "")
    joined_date = "July 2026"
    
    if user_doc.exists:
        udata = user_doc.to_dict()
        name = udata.get("name", name)
        email = udata.get("email", email)
        joined_date = udata.get("joined_date", joined_date)
        
    # 2. Fetch mastery profile doc
    profile_doc = db.collection("mastery_profiles").document(student_id).get()
    
    default_topics = [
        "Mechanics", "Thermodynamics", "Electrochemistry", "Organic Chemistry",
        "Inorganic Chemistry", "Calculus", "Genetics", "Human Physiology"
    ]
    
    if profile_doc.exists:
        pdata = profile_doc.to_dict()
        mastery = pdata.get("mastery", {})
        tests_completed = pdata.get("tests_completed", 0)
    else:
        mastery = {}
        tests_completed = 0

    # Ensure all topics exist in the returned dictionary
    mastery_response = {}
    for topic in default_topics:
        if topic in mastery:
            # Cast from Firestore to MasteryTopicDetail schema structure
            mastery_response[topic] = MasteryTopicDetail(
                accuracy=float(mastery[topic].get("accuracy", 0.0)),
                attempts=int(mastery[topic].get("attempts", 0)),
                avg_time_sec=float(mastery[topic].get("avg_time_sec", 0.0))
            )
        else:
            mastery_response[topic] = MasteryTopicDetail(
                accuracy=0.0,
                attempts=0,
                avg_time_sec=0.0
            )

    return MasteryProfileResponse(
        student_id=student_id,
        name=name,
        email=email,
        mastery=mastery_response,
        tests_completed=tests_completed,
        joined_date=joined_date
    )

@router.get("/submissions")
async def get_student_submissions(user: dict = Depends(get_current_user)):
    """
    Returns the student's history of test submissions.
    """
    student_id = user["uid"]
    try:
        submissions_ref = db.collection("submissions").where("student_id", "==", student_id).stream()
        
        subs = []
        for doc in submissions_ref:
            data = doc.to_dict()
            created_at = data.get("created_at")
            if created_at and hasattr(created_at, "isoformat"):
                created_at = created_at.isoformat()
            else:
                created_at = str(created_at)
                
            subs.append({
                "submission_id": data.get("submission_id") or doc.id,
                "test_type": data.get("test_type", "personalized"),
                "score": data.get("score", 0),
                "total_questions": data.get("total_questions", 0),
                "created_at": created_at,
                "results": data.get("results", [])
            })
            
        # Sort manually by created_at descending (since compound index might not exist yet)
        subs.sort(key=lambda x: x["created_at"], reverse=True)
        return subs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch submissions: {e}")
