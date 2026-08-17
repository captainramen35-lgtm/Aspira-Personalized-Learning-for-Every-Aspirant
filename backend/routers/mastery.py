from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from backend.routers.auth import get_current_user
from backend.firebase_admin_init import db
from backend.models.schemas import MasteryProfileResponse, MasteryTopicDetail
from backend.services.subject_utils import resolve_target_exam, group_chapters_by_subject

router = APIRouter(prefix="/api/mastery", tags=["mastery"])

@router.get("", response_model=MasteryProfileResponse)
async def get_mastery_profile(user: dict = Depends(get_current_user)):
    """
    Returns the student's current Mastery Profile.
    If they haven't taken the diagnostic test yet, returns a default/empty profile.
    """
    student_id = user["uid"]
    
    # 1. Fetch user doc for metadata and batch info
    user_doc = db.collection("users").document(student_id).get()
    name = "Student"
    email = user.get("email", "")
    joined_date = "July 2026"
    assigned_batch_id = None
    assigned_batch_name = "Not Enrolled"
    udata = {}

    if user_doc.exists:
        udata = user_doc.to_dict()
        name = udata.get("name", name)
        email = udata.get("email", email)
        joined_date = udata.get("joined_date", joined_date)
        assigned_batch_id = udata.get("assigned_batch_id")
        
    if assigned_batch_id:
        batch_doc = db.collection("batches").document(assigned_batch_id).get()
        if batch_doc.exists:
            assigned_batch_name = batch_doc.to_dict().get("name", "Active Student")
        
    # 2. Fetch mastery profile doc
    profile_doc = db.collection("mastery_profiles").document(student_id).get()
    
    mastery = {}
    chapters = {}
    chapter_topics = {}
    tests_completed = 0
    
    if profile_doc.exists:
        pdata = profile_doc.to_dict()
        mastery = pdata.get("mastery", {})
        chapters = pdata.get("chapters", {})
        # FIX: this field was already being written to the mastery_profiles
        # doc (teacher.py reads it), but this student-facing endpoint never
        # read/returned it, so the chapter -> topic drill-down on the
        # student's own Mastery Profile page never had anything to expand.
        chapter_topics = pdata.get("chapter_topics", {})
        tests_completed = pdata.get("tests_completed", 0)

    # Cast topics to schema structure
    mastery_response = {}
    for topic, data in mastery.items():
        mastery_response[topic] = MasteryTopicDetail(
            accuracy=float(data.get("accuracy", 0.0)),
            attempts=int(data.get("attempts", 0)),
            avg_time_sec=float(data.get("avg_time_sec", 0.0))
        )

    # Cast chapters to schema structure
    chapters_response = {}
    for chap, data in chapters.items():
        chapters_response[chap] = MasteryTopicDetail(
            accuracy=float(data.get("accuracy", 0.0)),
            attempts=int(data.get("attempts", 0)),
            avg_time_sec=float(data.get("avg_time_sec", 0.0))
        )

    # Keep mastery_response empty if no attempts exist yet

    # 3. Group chapters into their subject (Physics/Chemistry/Mathematics or
    # Physics/Chemistry/Biology), always including every canonical subject
    # for the student's exam track even if it has no attempted chapters yet.
    # This is what powers the "click a subject to see its chapters" UI, and
    # guarantees every student on the same exam track has the same subject
    # keys in their profile.
    target_exam = resolve_target_exam(db, udata)
    subjects_response, exam_subjects = group_chapters_by_subject(chapters_response, target_exam)

    return MasteryProfileResponse(
        student_id=student_id,
        name=name,
        email=email,
        mastery=mastery_response,
        chapters=chapters_response,
        subjects=subjects_response,
        exam_subjects=exam_subjects,
        chapter_topics=chapter_topics,
        assigned_batch_name=assigned_batch_name,
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