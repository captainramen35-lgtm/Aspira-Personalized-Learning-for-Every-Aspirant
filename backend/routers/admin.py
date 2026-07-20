from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from firebase_admin import auth as firebase_auth
from backend.routers.auth import get_current_user, require_role
from backend.firebase_admin_init import db
from typing import Optional
import secrets
import string

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _generate_temp_password(length: int = 12) -> str:
    """Generate a secure random temporary password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    # Ensure at least one digit and one uppercase
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%"),
    ]
    password += [secrets.choice(alphabet) for _ in range(length - 3)]
    secrets.SystemRandom().shuffle(password)
    return "".join(password)


class RegisterTeacherRequest(BaseModel):
    name: str
    email: str
    specialization: Optional[str] = ""


@router.post("/register-teacher")
async def register_teacher(
    req: RegisterTeacherRequest,
    user: dict = Depends(require_role(["admin"]))
):
    """
    Admin-only: Creates a new teacher Firebase Auth account with a temporary password,
    and a Firestore users/{uid} document with role='teacher', status='pending_first_login'.
    Returns the temp password so the admin can share it with the teacher.
    """
    temp_password = _generate_temp_password()

    try:
        # Create Firebase Auth user
        firebase_user = firebase_auth.create_user(
            email=req.email,
            password=temp_password,
            display_name=req.name,
            email_verified=False
        )
        uid = firebase_user.uid

        # Create Firestore user document
        db.collection("users").document(uid).set({
            "uid": uid,
            "name": req.name,
            "email": req.email,
            "role": "teacher",
            "status": "pending_first_login",
            "specialization": req.specialization,
            "bio": "",
            "qualifications": "",
            "subjects_taught": [],
            "joined_date": "July 2026",
            "created_by_admin": user["uid"]
        })

        return {
            "status": "success",
            "message": f"Teacher account created for {req.name}.",
            "uid": uid,
            "email": req.email,
            "temp_password": temp_password,
            "note": "Share this temporary password with the teacher. They will be required to change it on first login."
        }

    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create teacher account: {e}")


@router.get("/teachers")
async def list_teachers(user: dict = Depends(require_role(["admin"]))):
    """
    Admin-only: Returns all teacher accounts with their status.
    """
    try:
        teachers_ref = db.collection("users").where("role", "==", "teacher").stream()
        teachers = []
        for doc in teachers_ref:
            data = doc.to_dict()
            teachers.append({
                "uid": doc.id,
                "name": data.get("name", ""),
                "email": data.get("email", ""),
                "status": data.get("status", "active"),
                "specialization": data.get("specialization", ""),
                "joined_date": data.get("joined_date", ""),
            })
        teachers.sort(key=lambda x: x["name"])
        return {"teachers": teachers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list teachers: {e}")


@router.patch("/teachers/{uid}/deactivate")
async def deactivate_teacher(uid: str, user: dict = Depends(require_role(["admin"]))):
    """
    Admin-only: Soft-deletes a teacher account (sets status='inactive').
    Does not hard-delete the Firebase Auth user or Firestore document.
    """
    try:
        teacher_doc = db.collection("users").document(uid).get()
        if not teacher_doc.exists:
            raise HTTPException(status_code=404, detail="Teacher not found.")
        if teacher_doc.to_dict().get("role") != "teacher":
            raise HTTPException(status_code=400, detail="User is not a teacher.")

        db.collection("users").document(uid).update({"status": "inactive"})
        # Disable Firebase Auth account so they can't log in
        firebase_auth.update_user(uid, disabled=True)

        return {"status": "success", "message": f"Teacher account {uid} deactivated."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deactivate teacher: {e}")


@router.patch("/teachers/{uid}/reactivate")
async def reactivate_teacher(uid: str, user: dict = Depends(require_role(["admin"]))):
    """Admin-only: Re-activates a previously deactivated teacher."""
    try:
        db.collection("users").document(uid).update({"status": "active"})
        firebase_auth.update_user(uid, disabled=False)
        return {"status": "success", "message": "Teacher account reactivated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reactivate teacher: {e}")
