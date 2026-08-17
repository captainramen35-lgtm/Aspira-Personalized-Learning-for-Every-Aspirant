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


class DeleteBatchRequest(BaseModel):
    target_batch_id: Optional[str] = None  # if set, students are moved here instead of deleted


class StudentReassignRequest(BaseModel):
    target_batch_id: str


@router.get("")
async def list_batches(
    exam: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """
    Returns batches.
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
        else:
            query = db.collection("batches")
            if exam:
                query = query.where("target_exam", "==", exam)

        batches = []
        for doc in query.stream():
            data = doc.to_dict()
            # FIX (issue 5): `current_count` on the batch doc is a counter that
            # gets manually incremented/decremented across several endpoints
            # (create, reassign, delete, clear, enrollment approval). Any
            # partial write or edit outside those code paths lets it drift
            # from reality - which is exactly why Batch Management could show
            # "3 / 50" while Class Pulse (which always counts live from the
            # `users` collection) showed "2 / 50" for the same batch. Counting
            # live here, the same way teacher.py's Class Pulse endpoint does,
            # makes both sections agree by construction.
            live_count = len(list(
                db.collection("users")
                .where("assigned_batch_id", "==", doc.id)
                .where("role", "==", "student")
                .stream()
            ))
            batches.append({
                "batch_id": doc.id,
                "name": data.get("name", ""),
                "target_exam": data.get("target_exam", ""),
                "capacity": data.get("capacity", 50),
                "current_count": live_count,
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


@router.get("/{batch_id}/students")
async def list_batch_students(
    batch_id: str,
    user: dict = Depends(require_role(["teacher"]))
):
    """
    Returns the list of students currently enrolled in a batch.
    Used by the Edit Batch dialog so a teacher can remove or reassign
    individual students without deleting the whole batch.
    """
    teacher_id = user["uid"]
    batch_doc = db.collection("batches").document(batch_id).get()
    if not batch_doc.exists:
        raise HTTPException(status_code=404, detail="Batch not found.")
    if batch_doc.to_dict().get("teacher_id") != teacher_id:
        raise HTTPException(status_code=403, detail="You do not own this batch.")

    try:
        students_ref = (
            db.collection("users")
            .where("assigned_batch_id", "==", batch_id)
            .where("role", "==", "student")
            .stream()
        )
        students = []
        for doc in students_ref:
            data = doc.to_dict()
            students.append({
                "student_id": doc.id,
                "name": data.get("name", ""),
                "email": data.get("email", ""),
                "enrolled_year": _extract_enrollment_year(data),
            })
        students.sort(key=lambda s: s["name"])
        return {"batch_id": batch_id, "students": students, "count": len(students)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load student list: {e}")


@router.patch("/{batch_id}/students/{student_id}")
async def reassign_student(
    batch_id: str,
    student_id: str,
    req: StudentReassignRequest,
    user: dict = Depends(require_role(["teacher"]))
):
    """Reassigns a single student from this batch to another batch owned by the same teacher."""
    teacher_id = user["uid"]

    batch_doc = db.collection("batches").document(batch_id).get()
    if not batch_doc.exists:
        raise HTTPException(status_code=404, detail="Batch not found.")
    if batch_doc.to_dict().get("teacher_id") != teacher_id:
        raise HTTPException(status_code=403, detail="You do not own this batch.")

    student_doc = db.collection("users").document(student_id).get()
    if not student_doc.exists:
        raise HTTPException(status_code=404, detail="Student not found.")
    student_data = student_doc.to_dict()
    if student_data.get("assigned_batch_id") != batch_id:
        raise HTTPException(status_code=400, detail="This student is not enrolled in this batch.")

    if not req.target_batch_id:
        raise HTTPException(status_code=400, detail="target_batch_id is required.")
    if req.target_batch_id == batch_id:
        raise HTTPException(status_code=400, detail="Student is already in this batch.")

    target_doc = db.collection("batches").document(req.target_batch_id).get()
    if not target_doc.exists:
        raise HTTPException(status_code=404, detail="Target batch not found.")
    target_data = target_doc.to_dict()
    if target_data.get("teacher_id") != teacher_id:
        raise HTTPException(status_code=403, detail="You do not own the target batch.")

    try:
        writer = db.batch()
        writer.update(db.collection("users").document(student_id), {
            "assigned_batch_id": req.target_batch_id,
            "assigned_batch_name": target_data.get("name", ""),
        })
        writer.update(db.collection("batches").document(batch_id), {
            "current_count": firestore.Increment(-1)
        })
        writer.update(db.collection("batches").document(req.target_batch_id), {
            "current_count": firestore.Increment(1)
        })
        writer.commit()

        return {
            "status": "success",
            "message": f"Student moved to \"{target_data.get('name', 'the new batch')}\".",
            "action": "reassigned",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reassign student: {e}")


@router.delete("/{batch_id}/students/{student_id}")
async def delete_student_from_batch(
    batch_id: str,
    student_id: str,
    user: dict = Depends(require_role(["teacher"]))
):
    """
    Permanently deletes a single student from a batch: their user profile and
    any enrollment requests are removed entirely. The batch itself is untouched.

    NOTE: this only removes Firestore data. It does not delete the student's
    Firebase Authentication account — do that separately if you want the
    login itself gone.
    """
    teacher_id = user["uid"]

    batch_doc = db.collection("batches").document(batch_id).get()
    if not batch_doc.exists:
        raise HTTPException(status_code=404, detail="Batch not found.")
    if batch_doc.to_dict().get("teacher_id") != teacher_id:
        raise HTTPException(status_code=403, detail="You do not own this batch.")

    student_doc = db.collection("users").document(student_id).get()
    if not student_doc.exists:
        raise HTTPException(status_code=404, detail="Student not found.")
    student_data = student_doc.to_dict()
    if student_data.get("assigned_batch_id") != batch_id:
        raise HTTPException(status_code=400, detail="This student is not enrolled in this batch.")

    try:
        writer = db.batch()
        writer.delete(db.collection("users").document(student_id))

        req_docs = db.collection("enrollment_requests").where("student_id", "==", student_id).stream()
        for rdoc in req_docs:
            writer.delete(db.collection("enrollment_requests").document(rdoc.id))

        writer.update(db.collection("batches").document(batch_id), {
            "current_count": firestore.Increment(-1)
        })
        writer.commit()

        return {
            "status": "success",
            "message": f"{student_data.get('name', 'Student')} was permanently deleted from the batch.",
            "action": "deleted",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete student: {e}")


@router.delete("/{batch_id}/students")
async def clear_all_students(
    batch_id: str,
    user: dict = Depends(require_role(["teacher"]))
):
    """
    Permanently deletes every student currently enrolled in this batch
    (profiles + their enrollment requests). The batch document itself is
    kept, just emptied out (current_count reset to 0).

    NOTE: this only removes Firestore data. It does not delete students'
    Firebase Authentication accounts — do that separately if you want the
    logins themselves gone.
    """
    teacher_id = user["uid"]
    batch_doc = db.collection("batches").document(batch_id).get()
    if not batch_doc.exists:
        raise HTTPException(status_code=404, detail="Batch not found.")
    if batch_doc.to_dict().get("teacher_id") != teacher_id:
        raise HTTPException(status_code=403, detail="You do not own this batch.")

    try:
        students_ref = (
            db.collection("users")
            .where("assigned_batch_id", "==", batch_id)
            .where("role", "==", "student")
            .stream()
        )
        student_ids = [doc.id for doc in students_ref]

        writer = db.batch()
        for sid in student_ids:
            writer.delete(db.collection("users").document(sid))
            req_docs = db.collection("enrollment_requests").where("student_id", "==", sid).stream()
            for rdoc in req_docs:
                writer.delete(db.collection("enrollment_requests").document(rdoc.id))

        writer.update(db.collection("batches").document(batch_id), {"current_count": 0})
        writer.commit()

        return {
            "status": "success",
            "message": f"{len(student_ids)} student(s) permanently deleted. The batch is now empty.",
            "deleted_count": len(student_ids),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear students from batch: {e}")


def _extract_enrollment_year(user_data: dict) -> str:
    """Best-effort extraction of the year a student joined this batch."""
    for field in ("enrolled_at", "joined_date", "created_at"):
        val = user_data.get(field)
        if val is None:
            continue
        if hasattr(val, "year"):
            return str(val.year)
        if isinstance(val, str) and len(val) >= 4:
            return val[:4]
    return "Unknown"


@router.get("/{batch_id}/delete-preview")
async def delete_preview(
    batch_id: str,
    user: dict = Depends(require_role(["teacher"]))
):
    """
    Returns the list of students currently enrolled in a batch, with the
    year they enrolled, so the teacher can decide whether to reassign them
    before deleting the batch.
    """
    teacher_id = user["uid"]
    batch_doc = db.collection("batches").document(batch_id).get()
    if not batch_doc.exists:
        raise HTTPException(status_code=404, detail="Batch not found.")
    if batch_doc.to_dict().get("teacher_id") != teacher_id:
        raise HTTPException(status_code=403, detail="You do not own this batch.")

    try:
        students_ref = (
            db.collection("users")
            .where("assigned_batch_id", "==", batch_id)
            .where("role", "==", "student")
            .stream()
        )
        students = []
        for doc in students_ref:
            data = doc.to_dict()
            students.append({
                "student_id": doc.id,
                "name": data.get("name", ""),
                "email": data.get("email", ""),
                "enrolled_year": _extract_enrollment_year(data),
            })
        students.sort(key=lambda s: s["name"])
        return {"batch_name": batch_doc.to_dict().get("name", ""), "students": students, "count": len(students)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load student list: {e}")


@router.delete("/{batch_id}")
async def delete_batch(
    batch_id: str,
    req: DeleteBatchRequest,
    user: dict = Depends(require_role(["teacher"]))
):
    """
    Deletes a batch.
    - If target_batch_id is provided: all enrolled students are moved there first.
    - If not provided: all enrolled students' profiles (and their enrollment
      requests) are permanently deleted along with the batch.

    NOTE: this only removes Firestore data. It does not delete the student's
    Firebase Authentication account — do that separately if you want the
    login itself gone.
    """
    teacher_id = user["uid"]
    batch_doc = db.collection("batches").document(batch_id).get()
    if not batch_doc.exists:
        raise HTTPException(status_code=404, detail="Batch not found.")
    batch_data = batch_doc.to_dict()
    if batch_data.get("teacher_id") != teacher_id:
        raise HTTPException(status_code=403, detail="You do not own this batch.")

    try:
        students_ref = (
            db.collection("users")
            .where("assigned_batch_id", "==", batch_id)
            .where("role", "==", "student")
            .stream()
        )
        student_ids = [doc.id for doc in students_ref]

        if req.target_batch_id:
            # --- Move students to another batch, then delete this one ---
            target_doc = db.collection("batches").document(req.target_batch_id).get()
            if not target_doc.exists:
                raise HTTPException(status_code=404, detail="Target batch not found.")
            if target_doc.to_dict().get("teacher_id") != teacher_id:
                raise HTTPException(status_code=403, detail="You do not own the target batch.")

            writer = db.batch()
            for sid in student_ids:
                writer.update(db.collection("users").document(sid), {"assigned_batch_id": req.target_batch_id})
            if student_ids:
                writer.update(db.collection("batches").document(req.target_batch_id), {
                    "current_count": firestore.Increment(len(student_ids))
                })
            writer.delete(db.collection("batches").document(batch_id))
            writer.commit()

            return {
                "status": "success",
                "message": f"Batch deleted. {len(student_ids)} student(s) moved to the new batch.",
                "moved_count": len(student_ids),
                "deleted_count": 0
            }
        else:
            # --- Hard delete: batch + every enrolled student's profile ---
            writer = db.batch()

            for sid in student_ids:
                writer.delete(db.collection("users").document(sid))
                # Clean up any enrollment_requests tied to this student
                req_docs = db.collection("enrollment_requests").where("student_id", "==", sid).stream()
                for rdoc in req_docs:
                    writer.delete(db.collection("enrollment_requests").document(rdoc.id))

            writer.delete(db.collection("batches").document(batch_id))
            writer.commit()

            return {
                "status": "success",
                "message": f"Batch deleted permanently along with {len(student_ids)} student record(s).",
                "moved_count": 0,
                "deleted_count": len(student_ids)
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete batch: {e}")