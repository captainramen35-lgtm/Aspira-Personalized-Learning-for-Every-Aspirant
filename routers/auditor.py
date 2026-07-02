# TODO: Second Gemini call to audit scorer results. If disagreement > threshold, apply partial credit logic

from fastapi import APIRouter

router = APIRouter()


@router.post("/audit")
def audit_results():
    return {"message": "audit scorer results - TODO"}
