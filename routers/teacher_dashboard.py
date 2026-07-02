# TODO: Aggregate student data from Firestore for class-level and student-level analytics

from fastapi import APIRouter

router = APIRouter()


@router.get("/class-analytics")
def get_class_analytics():
    return {"message": "fetch class analytics - TODO"}


@router.get("/student/{student_id}")
def get_student_analytics(student_id: str):
    return {"message": "fetch individual student analytics - TODO"}
