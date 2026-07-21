from fastapi import APIRouter, Header, HTTPException, Depends
from pydantic import BaseModel
from firebase_admin import auth as firebase_auth
from backend.firebase_admin_init import db
from typing import Optional, List

router = APIRouter(prefix="/api/auth", tags=["auth"])


class UserRegisterRequest(BaseModel):
    uid: str
    name: str
    email: str
    role: str = "student"


class PasswordResetRequest(BaseModel):
    email: str


def get_current_user(authorization: str = Header(None)) -> dict:
    """
    FastAPI dependency to verify the Firebase ID Token in the Authorization header.
    Returns decoded token payload. Use require_role() to enforce role on top of this.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing or invalid format.")

    token = authorization.split(" ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {e}")


def require_role(allowed_roles: list):
    """
    Returns a FastAPI dependency that verifies the user has one of the allowed roles.
    Fetches role from Firestore users/{uid} document.
    Usage: user = Depends(require_role(["admin"]))
    """
    def _check_role(user: dict = Depends(get_current_user)) -> dict:
        uid = user["uid"]
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=403, detail="User profile not found.")
        user_data = user_doc.to_dict()
        role = user_data.get("role", "student")
        status = user_data.get("status", "active")

        if role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role(s): {allowed_roles}. Your role: {role}"
            )
        # Teacher must have completed onboarding (except on the onboarding route itself)
        if role == "teacher" and status == "pending_first_login" and "teacher" in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Teacher account setup not completed. Please complete onboarding first."
            )
        # Return merged user info
        return {**user, "role": role, "status": status, "profile": user_data}
    return _check_role


@router.post("/register")
async def register_user(req: UserRegisterRequest):
    """
    Registers the user's role and details in Firestore.
    Only 'student' role is accepted from client-side self-registration.
    Teachers are created by Admin via /api/admin/register-teacher.
    """
    if req.role != "student":
        raise HTTPException(
            status_code=400,
            detail="Self-registration is only available for students. Teachers are registered by administrators."
        )

    try:
        user_ref = db.collection("users").document(req.uid)
        user_ref.set({
            "uid": req.uid,
            "name": req.name,
            "email": req.email,
            "role": "student",
            "status": "pending_survey",   # pending_survey → pending_batch → pending_approval → active
            "assigned_batch_id": None,
            "target_exam": None,
            "joined_date": "July 2026",
            "email_verified": False
        })
        return {"status": "success", "message": "Student registered successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me")
async def get_my_profile(user: dict = Depends(get_current_user)):
    """
    Returns the current user's full Firestore profile document.
    """
    uid = user["uid"]
    user_doc = db.collection("users").document(uid).get()
    if user_doc.exists:
        data = user_doc.to_dict()
        # Sanitize: don't expose internal fields unnecessarily
        return {
            "uid": uid,
            "name": data.get("name", ""),
            "email": data.get("email", user.get("email", "")),
            "role": data.get("role", "student"),
            "status": data.get("status", "active"),
            "assigned_batch_id": data.get("assigned_batch_id"),
            "target_exam": data.get("target_exam"),
            "bio": data.get("bio"),
            "qualifications": data.get("qualifications"),
            "subjects_taught": data.get("subjects_taught"),
            "joined_date": data.get("joined_date", "July 2026"),
        }
    else:
        # Fallback for edge case (doc not yet created)
        return {
            "uid": uid,
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "role": "student",
            "status": "pending_survey",
            "assigned_batch_id": None,
            "target_exam": None,
        }


@router.patch("/me/email-verified")
async def mark_email_verified(user: dict = Depends(get_current_user)):
    """
    Called by the frontend after the user clicks the verification link and the
    Firebase client SDK confirms emailVerified = true.
    """
    uid = user["uid"]
    try:
        db.collection("users").document(uid).update({"email_verified": True})
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class OnboardingSurveyRequest(BaseModel):
    target_exam: str  # "JEE" or "NEET"
    class_level: Optional[str] = ""
    previous_coaching: Optional[str] = ""
    difficult_subjects: Optional[List[str]] = []
    learning_style: Optional[str] = ""
    academic_goals: Optional[str] = ""
    hours_per_day: Optional[str] = ""


@router.post("/onboarding-survey")
async def save_onboarding_survey(
    req: OnboardingSurveyRequest,
    user: dict = Depends(get_current_user)
):
    """
    Saves the student's onboarding survey to Firestore.
    Also updates the user's target_exam and status to 'pending_batch'.
    """
    uid = user["uid"]
    try:
        # Save survey in sub-collection students/{uid}/onboarding_survey/data
        db.collection("students").document(uid).collection("onboarding_survey").document("data").set({
            "target_exam": req.target_exam,
            "class_level": req.class_level,
            "previous_coaching": req.previous_coaching,
            "difficult_subjects": req.difficult_subjects,
            "learning_style": req.learning_style,
            "academic_goals": req.academic_goals,
            "hours_per_day": req.hours_per_day,
        })

        # Update user doc with target_exam and advance status
        db.collection("users").document(uid).update({
            "target_exam": req.target_exam,
            "status": "pending_batch"
        })

        return {"status": "success", "message": "Survey saved."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save survey: {e}")


@router.get("/onboarding-survey")
async def get_onboarding_survey(user: dict = Depends(get_current_user)):
    """
    Retrieves the student's previously submitted onboarding survey, if it exists.
    """
    uid = user["uid"]
    try:
        survey_doc = db.collection("students").document(uid).collection("onboarding_survey").document("data").get()
        if survey_doc.exists:
            return {"status": "success", "data": survey_doc.to_dict()}
        return {"status": "success", "data": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch survey: {e}")
