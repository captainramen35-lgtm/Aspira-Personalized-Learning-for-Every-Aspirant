# TODO: Generate Socratic hints using Gemini — 3 hints first, then full explanation. No direct answers.

from fastapi import APIRouter

router = APIRouter()


@router.post("/hint")
def generate_hint():
    return {"message": "generate Socratic hint - TODO"}
