# TODO: Call Gemini API to score student answers with reasoning and explanation (not just right/wrong)

from fastapi import APIRouter

router = APIRouter()


@router.post("/score")
def score_answers():
    return {"message": "score answers via Gemini - TODO"}
