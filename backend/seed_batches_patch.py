import os
import sys
from firebase_admin import firestore

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import backend.firebase_admin_init
from backend.firebase_admin_init import db

def run_patch():
    print("Seeding active demo batches...")
    
    # 1. Create morning_batch_jee
    db.collection("batches").document("morning_batch_jee").set({
        "batch_id": "morning_batch_jee",
        "name": "JEE-2026 Morning Batch",
        "teacher_id": "dummy_teacher",
        "target_exam": "JEE",
        "capacity": 50,
        "current_count": 6,
        "status": "active",
        "syllabus_notes": "Main focus: Calculus, Electrochemistry, and Mechanics.",
        "waitlist": []
    })
    print("Created batch: JEE-2026 Morning Batch")

    # 2. Create morning_batch_neet
    db.collection("batches").document("morning_batch_neet").set({
        "batch_id": "morning_batch_neet",
        "name": "NEET-2026 Morning Batch",
        "teacher_id": "dummy_teacher",
        "target_exam": "NEET",
        "capacity": 50,
        "current_count": 1,
        "status": "active",
        "syllabus_notes": "Main focus: Genetics, Human Physiology, and Organic Chemistry.",
        "waitlist": []
    })
    print("Created batch: NEET-2026 Morning Batch")

    # 3. Update student user profiles
    students = {
        "dummy_student_priya": {"target_exam": "JEE", "batch_id": "morning_batch_jee"},
        "dummy_student_rohan": {"target_exam": "JEE", "batch_id": "morning_batch_jee"},
        "dummy_student_sneha": {"target_exam": "JEE", "batch_id": "morning_batch_jee"},
        "dummy_student_aditya": {"target_exam": "JEE", "batch_id": "morning_batch_jee"},
        "dummy_student_meera": {"target_exam": "NEET", "batch_id": "morning_batch_neet"},
        "dummy_student_kabir": {"target_exam": "JEE", "batch_id": "morning_batch_jee"},
        "dummy_student_ananya": {"target_exam": "JEE", "batch_id": "morning_batch_jee"},
    }

    for s_id, data in students.items():
        db.collection("users").document(s_id).update({
            "status": "active",
            "target_exam": data["target_exam"],
            "assigned_batch_id": data["batch_id"]
        })
        print(f"Updated student {s_id} status to active in {data['batch_id']}")

    print("Seeding patch completed successfully!")

if __name__ == "__main__":
    run_patch()
