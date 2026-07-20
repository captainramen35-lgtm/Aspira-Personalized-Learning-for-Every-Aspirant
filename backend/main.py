from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, diagnostic, paper, submit, mastery, teacher, reflection, study_plan
from backend.routers import admin, teacher_onboarding, enrollment, batches

app = FastAPI(
    title="Aspira API",
    description="Backend service for AI-powered JEE/NEET adaptive assessments.",
    version="2.0.0"
)

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routers (existing)
app.include_router(auth.router)
app.include_router(diagnostic.router)
app.include_router(paper.router)
app.include_router(submit.router)
app.include_router(mastery.router)
app.include_router(teacher.router)

# Phase 1: Auth & User Management
app.include_router(admin.router)
app.include_router(teacher_onboarding.router)
app.include_router(enrollment.router)
app.include_router(batches.router)

# Phase 3: Adaptive Testing & Reflections
app.include_router(reflection.router)

# Phase 4: AI Study Plans
app.include_router(study_plan.router)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "version": "2.0.0",
        "message": "Aspira Backend API — Multi-role adaptive learning platform."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
