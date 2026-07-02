# TODO: Implement student and teacher login/signup using Firebase Auth

from fastapi import APIRouter

router = APIRouter()


@router.post("/register")
def register():
    return {"message": "register endpoint - TODO"}


@router.post("/login")
def login():
    return {"message": "login endpoint - TODO"}
