from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from firebase_admin import firestore
from backend.routers.auth import get_current_user
from backend.firebase_admin_init import db
from backend.services.gemini_client import gemini_client
import json

router = APIRouter(prefix="/api/study-plan", tags=["study-plan"])

@router.post("/generate")
async def generate_study_plan(user: dict = Depends(get_current_user)):
    """
    Generates a personalized 2-week daily study plan using Gemini.
    Uses the student's current rolling mastery profile.
    """
    student_id = user["uid"]
    
    try:
        # 1. Fetch student's profile & metadata
        profile_ref = db.collection("mastery_profiles").document(student_id)
        profile_doc = profile_ref.get()
        
        user_doc = db.collection("users").document(student_id).get()
        target_exam = "JEE"
        student_name = "Student"
        if user_doc.exists:
            udata = user_doc.to_dict()
            target_exam = udata.get("target_exam", "JEE")
            student_name = udata.get("name", "Student")
            
        chapters = {}
        if profile_doc.exists:
            chapters = profile_doc.to_dict().get("chapters", {})
            
        # 2. Extract weak, moderate, and strong areas
        weak_chapters = []
        moderate_chapters = []
        strong_chapters = []
        
        for chap, data in chapters.items():
            acc = data.get("accuracy", 0.0)
            attempts = data.get("attempts", 0)
            if attempts == 0:
                continue
            if acc < 40.0:
                weak_chapters.append(f"{chap} (accuracy: {acc}%)")
            elif acc < 65.0:
                moderate_chapters.append(f"{chap} (accuracy: {acc}%)")
            else:
                strong_chapters.append(f"{chap} (accuracy: {acc}%)")
                
        # If no profile data exists, provide fallback chapters based on exam pathway
        if not weak_chapters and not moderate_chapters and not strong_chapters:
            if target_exam == "NEET":
                weak_chapters = ["Cell Biology", "Genetics", "Human Physiology"]
            else:
                weak_chapters = ["Calculus", "Algebra", "Kinematics"]
        
        # 3. Create Gemini prompt
        prompt = f"""
You are a senior academic coach designing a personalized 2-week daily study plan for a student named "{student_name}".
Target Exam: {target_exam}

Student's Rolling Mastery Data:
- Weak Chapters (Needs highest priority): {", ".join(weak_chapters) if weak_chapters else "None detected yet"}
- Moderate Chapters (Needs solid practice): {", ".join(moderate_chapters) if moderate_chapters else "None detected yet"}
- Strong Chapters (Needs brief maintenance): {", ".join(strong_chapters) if strong_chapters else "None detected yet"}

Design a daily study plan for 14 days (2 weeks of 7 days each).
Ensure the schedule allocates:
- 60% of the focus to Weak Chapters (especially in Week 1).
- 30% of the focus to Moderate Chapters.
- 10% of the focus to maintenance of Strong Chapters (e.g. quick practice/recaps in Week 2).

You must return a valid JSON object matching this schema:
{{
  "title": "2-Week Custom Study Roadmap",
  "overview": "A warm, encouraging paragraph outlining the rationale behind this study roadmap.",
  "focus_areas": ["Weakest chapter A", "Moderate chapter B"],
  "weeks": [
    {{
      "week_number": 1,
      "days": [
        {{
          "day_number": 1,
          "topic": "Chapter Name",
          "tasks": [
            "Specific task 1 (e.g. review formulas)",
            "Specific task 2 (e.g. solve 10 practice questions)"
          ],
          "estimated_hours": 3.0
        }},
        ... (up to day 7)
      ]
    }},
    {{
      "week_number": 2,
      "days": [
        ... (day 8 to 14)
      ]
    }}
  ]
}}
Return ONLY the raw JSON string, nothing else.
"""
        response = gemini_client.model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean potential markdown wrapping
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        plan_data = json.loads(text)
        
        # Save study plan in Firestore
        db.collection("study_plans").document(student_id).set({
            "student_id": student_id,
            "plan": plan_data,
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        return {"status": "success", "plan": plan_data}
    except Exception as e:
        print(f"Failed to generate study plan: {e}")
        # Return a fallback plan if generation fails
        fallback_plan = {
            "title": "2-Week Custom Study Roadmap",
            "overview": "Let's work through your core syllabus over the next two weeks to build your confidence and accuracy.",
            "focus_areas": ["Kinematics", "Laws of Motion", "Chemical Bonding"],
            "weeks": [
                {
                  "week_number": 1,
                  "days": [
                    {
                      "day_number": i,
                      "topic": "Core Subject Revision",
                      "tasks": ["Revise key concepts", "Solve 5 practice problems"],
                      "estimated_hours": 2.0
                    } for i in range(1, 8)
                  ]
                },
                {
                  "week_number": 2,
                  "days": [
                    {
                      "day_number": i,
                      "topic": "Advanced Concept Application",
                      "tasks": ["Review formulas", "Analyze common mistakes"],
                      "estimated_hours": 2.5
                    } for i in range(8, 15)
                  ]
                }
            ]
        }
        return {"status": "success", "plan": fallback_plan}

@router.get("/current")
async def get_current_study_plan(user: dict = Depends(get_current_user)):
    """Retrieves the student's active study plan."""
    student_id = user["uid"]
    
    try:
        plan_doc = db.collection("study_plans").document(student_id).get()
        if plan_doc.exists:
            return {"plan": plan_doc.to_dict().get("plan")}
        return {"plan": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch study plan: {e}")
