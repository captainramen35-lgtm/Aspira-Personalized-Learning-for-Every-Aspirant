# TODO: Use weighting_engine to generate personalized question paper based on mastery profile

from fastapi import APIRouter

router = APIRouter()


@router.post("/generate")
def generate_paper():
    return {"message": "generate personalized paper - TODO"}
