from fastapi import APIRouter, Header, HTTPException, Depends
from pydantic import BaseModel
from firebase_admin import auth as firebase_auth
from backend.firebase_admin_init import db

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserRegisterRequest(BaseModel):
    uid: str
    name: str
    email: str
    role: str  # "student" or "teacher"

@router.post("/register")
async def register_user(req: UserRegisterRequest):
    """
    Registers the user's role and details in Firestore.
    Runs after the user successfully registers via the Firebase client SDK.
    """
    if req.role not in ["student", "teacher"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'student' or 'teacher'.")
    
    try:
        user_ref = db.collection("users").document(req.uid)
        user_ref.set({
            "uid": req.uid,
            "name": req.name,
            "email": req.email,
            "role": req.role,
            "enrolled": "Not Enrolled" if req.role == "student" else "JEE/NEET Morning Batch",
            "joined_date": "July 2026"
        })
        return {"status": "success", "message": "User registered successfully in database."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_current_user(authorization: str = Header(None)) -> dict:
    """
    FastAPI dependency to verify the Firebase ID Token in the Authorization header.
    Expects format: "Bearer <token>"
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing or format invalid.")
    
    token = authorization.split(" ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {e}")

@router.get("/me")
async def get_my_profile(user: dict = Depends(get_current_user)):
    """
    Returns the current user's Firestore document (caching name, email, and role).
    """
    uid = user["uid"]
    user_doc = db.collection("users").document(uid).get()
    if user_doc.exists:
        return user_doc.to_dict()
    else:
        # Fallback in case document was not created yet
        return {
            "uid": uid,
            "name": user.get("name", "Student"),
            "email": user.get("email", ""),
            "role": "student"
        }
