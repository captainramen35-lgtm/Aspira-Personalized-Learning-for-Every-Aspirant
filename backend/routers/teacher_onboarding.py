from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.routers.auth import get_current_user
from backend.firebase_admin_init import db
from typing import List, Optional

router = APIRouter(prefix="/api/teacher/onboarding", tags=["teacher_onboarding"])


class TeacherProfileRequest(BaseModel):
    bio: Optional[str] = ""
    qualifications: Optional[str] = ""
    subjects_taught: Optional[List[str]] = []


@router.post("/complete")
async def complete_teacher_onboarding(
    req: TeacherProfileRequest,
    user: dict = Depends(get_current_user)
):
    """
    Called after a teacher changes their temporary password and fills in their profile.
    Updates the Firestore users/{uid} document and sets status to 'active'.
    Note: We use get_current_user (not require_role) here so that pending_first_login
    teachers can still call this endpoint.
    """
    uid = user["uid"]

    # Verify this is a teacher
    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found.")

    user_data = user_doc.to_dict()
    if user_data.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="This endpoint is for teachers only.")

    try:
        db.collection("users").document(uid).update({
            "bio": req.bio,
            "qualifications": req.qualifications,
            "subjects_taught": req.subjects_taught,
            "status": "active"
        })
        return {
            "status": "success",
            "message": "Teacher profile completed. Welcome to Aspira!",
            "redirect": "/teacher"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete onboarding: {e}")


@router.get("/status")
async def get_onboarding_status(user: dict = Depends(get_current_user)):
    """
    Returns the teacher's current onboarding status.
    Used by the frontend to decide whether to show the forced onboarding screen.
    """
    uid = user["uid"]
    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found.")
    data = user_doc.to_dict()
    return {
        "status": data.get("status", "active"),
        "role": data.get("role", "student"),
        "name": data.get("name", "")
    }
