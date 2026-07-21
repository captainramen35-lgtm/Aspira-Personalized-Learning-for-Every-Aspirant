from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from firebase_admin import firestore
from backend.routers.auth import get_current_user, require_role
from backend.firebase_admin_init import db
from typing import Optional
import uuid

router = APIRouter(prefix="/api/batches", tags=["batches"])


class CreateBatchRequest(BaseModel):
    name: str
    target_exam: str  # "JEE" or "NEET"
    capacity: Optional[int] = 50
    syllabus_notes: Optional[str] = ""


class UpdateBatchRequest(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    syllabus_notes: Optional[str] = None


@router.get("")
async def list_batches(
    exam: Optional[str] = None,
    include_archived: bool = False,
    user: dict = Depends(get_current_user)
):
    """
    Returns active batches (and optionally archived ones).
    - Students: filtered by target_exam (query param).
    - Teachers: returns their own batches.
    """
    uid = user["uid"]
    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found.")
    role = user_doc.to_dict().get("role", "student")

    try:
        if role == "teacher":
            query = db.collection("batches").where("teacher_id", "==", uid)
            if not include_archived:
                query = query.where("status", "==", "active")
        else:
            # Student: filter by exam if provided
            query = db.collection("batches").where("status", "==", "active")
            if exam:
                query = query.where("target_exam", "==", exam)

        batches = []
        for doc in query.stream():
            data = doc.to_dict()
            batches.append({
                "batch_id": doc.id,
                "name": data.get("name", ""),
                "target_exam": data.get("target_exam", ""),
                "capacity": data.get("capacity", 50),
                "current_count": data.get("current_count", 0),
                "status": data.get("status", "active"),
                "syllabus_notes": data.get("syllabus_notes", ""),
                "teacher_id": data.get("teacher_id", ""),
            })
        batches.sort(key=lambda x: x["name"])
        return {"batches": batches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list batches: {e}")


@router.post("")
async def create_batch(
    req: CreateBatchRequest,
    user: dict = Depends(require_role(["teacher"]))
):
    """Teacher creates a new batch."""
    teacher_id = user["uid"]

    if req.target_exam not in ["JEE", "NEET"]:
        raise HTTPException(status_code=400, detail="target_exam must be 'JEE' or 'NEET'.")
    if req.capacity < 1 or req.capacity > 200:
        raise HTTPException(status_code=400, detail="Capacity must be between 1 and 200.")

    batch_id = str(uuid.uuid4())
    try:
        db.collection("batches").document(batch_id).set({
            "batch_id": batch_id,
            "name": req.name,
            "teacher_id": teacher_id,
            "target_exam": req.target_exam,
            "capacity": req.capacity,
            "current_count": 0,
            "status": "active",
            "syllabus_notes": req.syllabus_notes or "",
            "waitlist": [],
            "created_at": firestore.SERVER_TIMESTAMP,
        })
        return {"status": "success", "batch_id": batch_id, "name": req.name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create batch: {e}")


@router.patch("/{batch_id}")
async def update_batch(
    batch_id: str,
    req: UpdateBatchRequest,
    user: dict = Depends(require_role(["teacher"]))
):
    """Teacher updates batch name, capacity, or syllabus notes."""
    teacher_id = user["uid"]
    batch_doc = db.collection("batches").document(batch_id).get()
    if not batch_doc.exists:
        raise HTTPException(status_code=404, detail="Batch not found.")
    if batch_doc.to_dict().get("teacher_id") != teacher_id:
        raise HTTPException(status_code=403, detail="You do not own this batch.")

    updates = {k: v for k, v in req.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    try:
        db.collection("batches").document(batch_id).update(updates)
        return {"status": "success", "message": "Batch updated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update batch: {e}")


@router.patch("/{batch_id}/archive")
async def archive_batch(
    batch_id: str,
    user: dict = Depends(require_role(["teacher"]))
):
    """Teacher archives a completed batch."""
    teacher_id = user["uid"]
    batch_doc = db.collection("batches").document(batch_id).get()
    if not batch_doc.exists:
        raise HTTPException(status_code=404, detail="Batch not found.")
    
    batch_data = batch_doc.to_dict()
    if batch_data.get("teacher_id") != teacher_id:
        raise HTTPException(status_code=403, detail="You do not own this batch.")

    if batch_data.get("current_count", 0) > 0:
        raise HTTPException(
            status_code=400, 
            detail="Cannot archive batch with enrolled students. Please reassign them first."
        )

    try:
        db.collection("batches").document(batch_id).update({"status": "archived"})
        return {"status": "success", "message": "Batch archived."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to archive batch: {e}")


class BulkReassignRequest(BaseModel):
    target_batch_id: str


@router.post("/{batch_id}/bulk-reassign")
async def bulk_reassign_students(
    batch_id: str,
    req: BulkReassignRequest,
    user: dict = Depends(require_role(["teacher"]))
):
    """Reassign all students from one batch to another."""
    teacher_id = user["uid"]
    
    # Verify source batch
    source_doc = db.collection("batches").document(batch_id).get()
    if not source_doc.exists:
        raise HTTPException(status_code=404, detail="Source batch not found.")
    if source_doc.to_dict().get("teacher_id") != teacher_id:
        raise HTTPException(status_code=403, detail="You do not own the source batch.")

    # Verify target batch
    target_doc = db.collection("batches").document(req.target_batch_id).get()
    if not target_doc.exists:
        raise HTTPException(status_code=404, detail="Target batch not found.")
    target_data = target_doc.to_dict()
    if target_data.get("teacher_id") != teacher_id:
        raise HTTPException(status_code=403, detail="You do not own the target batch.")
    if target_data.get("status") == "archived":
        raise HTTPException(status_code=400, detail="Cannot reassign to an archived batch.")

    try:
        # Find all active students in the source batch
        students_ref = db.collection("users").where("assigned_batch_id", "==", batch_id).where("role", "==", "student").stream()
        student_ids = [doc.id for doc in students_ref]
        
        if not student_ids:
            return {"status": "success", "message": "No students to reassign.", "reassigned_count": 0}

        # Use batch write to reassign students and update counts safely
        batch_writer = db.batch()
        
        for sid in student_ids:
            batch_writer.update(db.collection("users").document(sid), {"assigned_batch_id": req.target_batch_id})
            
        # Update enrollment counts
        batch_writer.update(db.collection("batches").document(req.target_batch_id), {
            "current_count": firestore.Increment(len(student_ids))
        })
        batch_writer.update(db.collection("batches").document(batch_id), {
            "current_count": firestore.Increment(-len(student_ids))
        })
        
        batch_writer.commit()

        return {
            "status": "success", 
            "message": f"Successfully reassigned {len(student_ids)} students.",
            "reassigned_count": len(student_ids)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to bulk reassign students: {e}")
