from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from firebase_admin import firestore
from backend.routers.auth import get_current_user
from backend.firebase_admin_init import db
from backend.services.gemini_client import gemini_client
import json

router = APIRouter(prefix="/api/reflection", tags=["reflection"])

class ReflectionSubmitRequest(BaseModel):
    submission_id: str
    q_id: str
    student_reflection: str

@router.post("/submit")
async def submit_reflection(req: ReflectionSubmitRequest, user: dict = Depends(get_current_user)):
    """
    Submits a student's Socratic reflection on an incorrect question from a previous test.
    Uses Gemini to evaluate their understanding of the mistake and return feedback.
    """
    student_id = user["uid"]
    
    try:
        # 1. Fetch the submission from Firestore
        sub_ref = db.collection("submissions").document(req.submission_id)
        sub_doc = sub_ref.get()
        if not sub_doc.exists:
            raise HTTPException(status_code=404, detail="Submission not found.")
        
        sub_data = sub_doc.to_dict()
        if sub_data.get("student_id") != student_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this submission.")
        
        # 2. Find the question in the submission results
        results = sub_data.get("results", [])
        q_result = None
        for r in results:
            if r["q_id"] == req.q_id:
                q_result = r
                break
                
        if not q_result:
            raise HTTPException(status_code=404, detail="Question not found in this submission.")
            
        if q_result.get("is_correct"):
            raise HTTPException(status_code=400, detail="You only need to reflect on incorrect answers.")
            
        # 3. Analyze the reflection with Gemini
        prompt = f"""
You are a Socratic tutor analyzing a student's reflection on their mistake.

Question:
{q_result.get('question_text')}

Options:
{q_result.get('options')}

Correct Answer: {q_result.get('correct_answer')}
Student's Selected Answer: {q_result.get('student_answer')}

Detailed Solution:
{q_result.get('socratic_feedback', {}).get('worked_solution', 'N/A')}

Student's Reflection on why they got it wrong and how to fix it:
"{req.student_reflection}"

Provide a structured assessment of the student's reflection.
You must return a valid JSON object matching this schema:
{{
  "conceptual_understanding": "Yes" | "No" | "Partial",
  "error_diagnosis": "Explain if the student correctly diagnosed their error (e.g. calculation mistake, concept gap).",
  "socratic_nudge": "Write a warm, 2-3 sentence response. If they got it right, praise their insight. If they missed the concept, ask a helpful question to guide them without giving the direct answer away.",
  "status": "approved" | "needs_work"
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
        
        analysis = json.loads(text)
        
        # 4. Save reflection to Firestore
        reflection_doc_id = f"{req.submission_id}_{req.q_id}"
        db.collection("reflections").document(reflection_doc_id).set({
            "student_id": student_id,
            "submission_id": req.submission_id,
            "q_id": req.q_id,
            "question_text": q_result.get("question_text"),
            "correct_answer": q_result.get("correct_answer"),
            "student_answer": q_result.get("student_answer"),
            "student_reflection": req.student_reflection,
            "analysis": analysis,
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        return {
            "status": "success",
            "analysis": analysis
        }
        
    except json.JSONDecodeError as jde:
        print(f"Gemini output parsing failed: {jde}. Raw text: {text}")
        # Return a fallback JSON response on parsing failure
        fallback_analysis = {
            "conceptual_understanding": "Partial",
            "error_diagnosis": "Reflection received and under review.",
            "socratic_nudge": "Thank you for reflecting on your mistake. Review the detailed solution to check your steps.",
            "status": "approved"
        }
        return {"status": "success", "analysis": fallback_analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit reflection: {e}")
