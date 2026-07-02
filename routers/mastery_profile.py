# TODO: Read and update student mastery profile in Firestore after each test

from fastapi import APIRouter

router = APIRouter()


@router.get("/{student_id}")
def get_mastery_profile(student_id: str):
    return {"message": "fetch mastery profile - TODO"}


@router.post("/update")
def update_mastery_profile():
    return {"message": "update mastery profile - TODO"}
