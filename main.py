from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, diagnostic, paper_generation, scorer, auditor, feedback, mastery_profile, teacher_dashboard

app = FastAPI(
    title="Aspira API",
    version="1.0.0",
    description="AI-powered adaptive assessment platform for NEET/JEE students"
)

# CORS middleware — allow all origins for now, restrict later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with their respective prefixes
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(diagnostic.router, prefix="/diagnostic", tags=["Diagnostic"])
app.include_router(paper_generation.router, prefix="/paper", tags=["Paper Generation"])
app.include_router(scorer.router, prefix="/scorer", tags=["Scorer"])
app.include_router(auditor.router, prefix="/auditor", tags=["Auditor"])
app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])
app.include_router(mastery_profile.router, prefix="/mastery", tags=["Mastery Profile"])
app.include_router(teacher_dashboard.router, prefix="/teacher", tags=["Teacher Dashboard"])


@app.get("/")
def root():
    return {"status": "Aspira API is running"}
