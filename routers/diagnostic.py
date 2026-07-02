# TODO: Serve 8-10 diagnostic questions, collect answers, trigger mastery profile creation

from fastapi import APIRouter

router = APIRouter()


@router.get("/questions")
def get_diagnostic_questions():
    return {"message": "fetch diagnostic questions - TODO"}


@router.post("/submit")
def submit_diagnostic_answers():
    return {"message": "submit diagnostic answers - TODO"}
