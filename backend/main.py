from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, diagnostic, paper, submit, mastery, teacher

app = FastAPI(
    title="Aspira API",
    description="Backend service for AI-powered JEE/NEET adaptive assessments.",
    version="1.0.0"
)

# CORS middleware setup (allows connection from React client)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for MVP simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all endpoint routers
app.include_router(auth.router)
app.include_router(diagnostic.router)
app.include_router(paper.router)
app.include_router(submit.router)
app.include_router(mastery.router)
app.include_router(teacher.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to Aspira Backend API. System online, connected to Firestore + Gemini."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
