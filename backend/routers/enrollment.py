from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from firebase_admin import firestore
from backend.routers.auth import get_current_user, require_role
from backend.firebase_admin_init import db
from backend.services.gemini_client import gemini_client
from typing import Optional
import uuid

router = APIRouter(prefix="/api/enrollment", tags=["enrollment"])


class EnrollmentRequestPayload(BaseModel):
    batch_id: str


class EnrollmentDecisionPayload(BaseModel):
    reason: Optional[str] = ""
    target_batch_id: Optional[str] = None  # Only needed for reassign
    incomplete_profile: Optional[bool] = False


@router.post("/request")
async def create_enrollment_request(
    payload: EnrollmentRequestPayload,
    user: dict = Depends(get_current_user)
):
    """
    Student submits an enrollment request for a specific batch.
    Creates an enrollment_requests document in Firestore.
    """
    uid = user["uid"]

    # Verify this is a student
    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found.")
    user_data = user_doc.to_dict()
    if user_data.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can request enrollment.")

    # Check if student already has a pending or approved request
    existing = (
        db.collection("enrollment_requests")
        .where("student_id", "==", uid)
        .where("status", "in", ["pending", "approved"])
        .stream()
    )
    for _ in existing:
        raise HTTPException(
            status_code=409,
            detail="You already have a pending or approved enrollment request."
        )

    # Verify the batch exists
    batch_doc = db.collection("batches").document(payload.batch_id).get()
    if not batch_doc.exists:
        raise HTTPException(status_code=404, detail="Batch not found.")
    batch_data = batch_doc.to_dict()
    if batch_data.get("status") == "archived":
        raise HTTPException(status_code=400, detail="This batch is no longer accepting students.")

    # Fetch student's onboarding survey for the snapshot
    survey_doc = db.collection("students").document(uid).collection("onboarding_survey").document("data").get()
    survey_snapshot = survey_doc.to_dict() if survey_doc.exists else {}

    request_id = str(uuid.uuid4())
    db.collection("enrollment_requests").document(request_id).set({
        "request_id": request_id,
        "student_id": uid,
        "student_name": user_data.get("name", ""),
        "student_email": user_data.get("email", ""),
        "batch_id": payload.batch_id,
        "batch_name": batch_data.get("name", ""),
        "teacher_id": batch_data.get("teacher_id", ""),
        "status": "pending",
        "survey_snapshot": survey_snapshot,
        "requested_at": firestore.SERVER_TIMESTAMP,
        "placement_explanation": None,
        "rejection_reason": None
    })

    # Update student status
    db.collection("users").document(uid).update({"status": "pending_approval"})

    return {
        "status": "success",
        "request_id": request_id,
        "message": "Enrollment request submitted. Waiting for teacher approval."
    }


@router.get("/status")
async def get_enrollment_status(user: dict = Depends(get_current_user)):
    """Student checks the status of their enrollment request."""
    uid = user["uid"]
    requests = (
        db.collection("enrollment_requests")
        .where("student_id", "==", uid)
        .stream()
    )
    results = []
    for doc in requests:
        data = doc.to_dict()
        requested_at = data.get("requested_at")
        if requested_at and hasattr(requested_at, "isoformat"):
            requested_at = requested_at.isoformat()
        results.append({
            "request_id": doc.id,
            "batch_id": data.get("batch_id"),
            "batch_name": data.get("batch_name"),
            "status": data.get("status"),
            "placement_explanation": data.get("placement_explanation"),
            "rejection_reason": data.get("rejection_reason"),
            "requested_at": str(requested_at)
        })

    if not results:
        return {"request": None}
    # Return the most recent request
    results.sort(key=lambda x: x.get("requested_at", ""), reverse=True)
    return {"request": results[0]}


@router.get("/requests")
async def get_pending_requests(user: dict = Depends(require_role(["teacher"]))):
    """
    Teacher gets all enrollment requests for their batches.
    """
    teacher_id = user["uid"]
    requests_ref = (
        db.collection("enrollment_requests")
        .where("teacher_id", "==", teacher_id)
        .stream()
    )
    results = []
    for doc in requests_ref:
        data = doc.to_dict()
        requested_at = data.get("requested_at")
        if requested_at and hasattr(requested_at, "isoformat"):
            requested_at = requested_at.isoformat()
        results.append({
            "request_id": doc.id,
            "student_id": data.get("student_id"),
            "student_name": data.get("student_name"),
            "student_email": data.get("student_email"),
            "batch_id": data.get("batch_id"),
            "batch_name": data.get("batch_name"),
            "status": data.get("status"),
            "survey_snapshot": data.get("survey_snapshot", {}),
            "requested_at": str(requested_at),
            "placement_explanation": data.get("placement_explanation"),
            "rejection_reason": data.get("rejection_reason")
        })
    results.sort(key=lambda x: x.get("requested_at", ""), reverse=True)
    return {"requests": results}


@router.patch("/requests/{request_id}/approve")
async def approve_enrollment(
    request_id: str,
    user: dict = Depends(require_role(["teacher"]))
):
    """Teacher approves an enrollment request."""
    return await _process_enrollment_decision(
        request_id=request_id,
        teacher_id=user["uid"],
        action="approve",
        target_batch_id=None,
        reason="",
        incomplete_profile=False
    )


@router.patch("/requests/{request_id}/reassign")
async def reassign_enrollment(
    request_id: str,
    payload: EnrollmentDecisionPayload,
    user: dict = Depends(require_role(["teacher"]))
):
    """Teacher reassigns a student to a different batch."""
    if not payload.target_batch_id:
        raise HTTPException(status_code=400, detail="target_batch_id is required for reassignment.")
    return await _process_enrollment_decision(
        request_id=request_id,
        teacher_id=user["uid"],
        action="reassign",
        target_batch_id=payload.target_batch_id,
        reason=payload.reason or "",
        incomplete_profile=False
    )


@router.patch("/requests/{request_id}/reject")
async def reject_enrollment(
    request_id: str,
    payload: EnrollmentDecisionPayload,
    user: dict = Depends(require_role(["teacher"]))
):
    """Teacher rejects an enrollment request."""
    return await _process_enrollment_decision(
        request_id=request_id,
        teacher_id=user["uid"],
        action="reject",
        target_batch_id=None,
        reason=payload.reason or "",
        incomplete_profile=payload.incomplete_profile
    )


async def _process_enrollment_decision(
    request_id: str,
    teacher_id: str,
    action: str,
    target_batch_id: Optional[str],
    reason: str,
    incomplete_profile: bool
):
    """Shared logic for approve / reassign / reject."""
    req_doc = db.collection("enrollment_requests").document(request_id).get()
    if not req_doc.exists:
        raise HTTPException(status_code=404, detail="Enrollment request not found.")

    req_data = req_doc.to_dict()
    if req_data.get("teacher_id") != teacher_id:
        raise HTTPException(status_code=403, detail="This request is not for your batch.")
    if req_data.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Request has already been processed.")

    student_id = req_data["student_id"]
    original_batch_id = req_data["batch_id"]
    survey = req_data.get("survey_snapshot", {})

    if action == "reject":
        db.collection("enrollment_requests").document(request_id).update({
            "status": "rejected",
            "rejection_reason": reason
        })
        new_status = "incomplete_profile_rejected" if incomplete_profile else "pending_batch"
        db.collection("users").document(student_id).update({"status": new_status})
        return {"status": "success", "message": "Student enrollment rejected."}

    # Approve or Reassign
    final_batch_id = target_batch_id if action == "reassign" else original_batch_id

    # Verify target batch exists
    batch_doc = db.collection("batches").document(final_batch_id).get()
    if not batch_doc.exists:
        raise HTTPException(status_code=404, detail="Target batch not found.")
    batch_data = batch_doc.to_dict()

    # Generate AI placement explanation
    action_label = "approved" if action == "approve" else "reassigned to a different batch"
    placement_explanation = _generate_placement_explanation(
        action=action_label,
        student_name=req_data.get("student_name", "the student"),
        batch_name=batch_data.get("name", "your assigned batch"),
        survey=survey,
        reason=reason,
        original_batch=req_data.get("batch_name", ""),
        reassigned_batch=batch_data.get("name", "") if action == "reassign" else ""
    )

    # Update enrollment request
    db.collection("enrollment_requests").document(request_id).update({
        "status": "approved" if action == "approve" else "reassigned",
        "final_batch_id": final_batch_id,
        "placement_explanation": placement_explanation
    })

    # Update student's assigned_batch_id and status
    db.collection("users").document(student_id).update({
        "assigned_batch_id": final_batch_id,
        "status": "active"
    })

    # Increment batch enrollment count
    db.collection("batches").document(final_batch_id).update({
        "current_count": firestore.Increment(1)
    })

    return {
        "status": "success",
        "message": f"Student {action_label}.",
        "placement_explanation": placement_explanation
    }


def _generate_placement_explanation(
    action: str,
    student_name: str,
    batch_name: str,
    survey: dict,
    reason: str,
    original_batch: str,
    reassigned_batch: str
) -> str:
    """
    Uses Gemini to generate a friendly, student-facing placement explanation.
    Falls back to a template string on failure.
    """
    try:
        target_exam = survey.get("target_exam", "JEE/NEET")
        difficult_subjects = survey.get("difficult_subjects", [])
        academic_goals = survey.get("academic_goals", "")

        prompt = f"""
You are an Aspira enrollment coordinator writing a warm, encouraging message to a student.

The student "{student_name}" applied for enrollment and was {action} into batch "{batch_name}".
{"They originally requested batch '" + original_batch + "' but have been moved to '" + reassigned_batch + "'." if reassigned_batch else ""}
Teacher's note: {reason or "No specific note."}

Student context from their survey:
- Target exam: {target_exam}
- Subjects they find difficult: {", ".join(difficult_subjects) if difficult_subjects else "Not specified"}
- Academic goal: {academic_goals or "Not specified"}

Write a short (3-4 sentences), warm, and encouraging message explaining their placement.
{"Specifically explain why the new batch is actually a better fit for their current level and goals." if reassigned_batch else "Congratulate them on their acceptance and tell them what to expect next."}
Be specific, friendly, and supportive. Do NOT use generic filler phrases.
Return only the message text, no JSON.
"""
        response = gemini_client.model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        if reassigned_batch:
            return (
                f"You've been placed in '{batch_name}', which is a great fit for your current level "
                f"and will help you build the foundation you need. We're excited to have you!"
            )
        return (
            f"Congratulations! You've been approved for batch '{batch_name}'. "
            f"Your teacher has reviewed your profile and is looking forward to working with you. "
            f"You can now start your diagnostic test to personalize your learning journey."
        )
