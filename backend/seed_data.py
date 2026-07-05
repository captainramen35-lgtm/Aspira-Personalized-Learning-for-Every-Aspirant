import firebase_admin
from firebase_admin import auth as firebase_auth, firestore
import os
import sys

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Initialize Admin SDK
import backend.firebase_admin_init
from backend.firebase_admin_init import db

def seed():
    print("Starting data seed for Aspira demo...")
    
    # 1. Create dummy users (passwords: 'password123')
    dummy_users = [
        {
            "uid": "dummy_student_priya", 
            "email": "priya@aspira.com", 
            "name": "Priya Kulkarni", 
            "role": "student", 
            "enrolled": "JEE/NEET Morning Batch"
        },
        {
            "uid": "dummy_student_rohan", 
            "email": "rohan@aspira.com", 
            "name": "Rohan Mehta", 
            "role": "student", 
            "enrolled": "JEE/NEET Morning Batch"
        },
        {
            "uid": "dummy_student_sneha", 
            "email": "sneha@aspira.com", 
            "name": "Sneha Reddy", 
            "role": "student", 
            "enrolled": "JEE/NEET Morning Batch"
        },
        {
            "uid": "dummy_student_aditya", 
            "email": "aditya@aspira.com", 
            "name": "Aditya Sharma", 
            "role": "student", 
            "enrolled": "JEE/NEET Morning Batch"
        },
        {
            "uid": "dummy_student_meera", 
            "email": "meera@aspira.com", 
            "name": "Meera Nair", 
            "role": "student", 
            "enrolled": "JEE/NEET Morning Batch"
        },
        {
            "uid": "dummy_student_kabir", 
            "email": "kabir@aspira.com", 
            "name": "Kabir Verma", 
            "role": "student", 
            "enrolled": "JEE/NEET Morning Batch"
        },
        {
            "uid": "dummy_student_ananya", 
            "email": "ananya@aspira.com", 
            "name": "Ananya Das", 
            "role": "student", 
            "enrolled": "JEE/NEET Morning Batch"
        },
        {
            "uid": "dummy_teacher", 
            "email": "teacher@aspira.com", 
            "name": "Prof. Piyush Jha", 
            "role": "teacher", 
            "enrolled": "JEE/NEET Morning Batch"
        }
    ]
    
    for u in dummy_users:
        try:
            # Create user in Firebase Auth
            firebase_auth.create_user(
                uid=u["uid"],
                email=u["email"],
                password="password123",
                display_name=u["name"]
            )
            print(f"Created Auth User: {u['email']}")
        except Exception as e:
            # If user already exists in auth, we just log and proceed
            print(f"Auth user exists or skipped: {u['email']}")
            
        # Set database values in Firestore
        db.collection("users").document(u["uid"]).set({
            "uid": u["uid"],
            "name": u["name"],
            "email": u["email"],
            "role": u["role"],
            "enrolled": u["enrolled"],
            "joined_date": "July 2026"
        }, merge=True)
        print(f"Configured Firestore User doc for: {u['name']}")

    # 2. Seed Mastery Profiles
    
    # Priya Kulkarni: High stats, declining in Electrochemistry
    db.collection("mastery_profiles").document("dummy_student_priya").set({
        "student_id": "dummy_student_priya",
        "name": "Priya Kulkarni",
        "email": "priya@aspira.com",
        "role": "student",
        "tests_completed": 50,
        "last_active": firestore.SERVER_TIMESTAMP,
        "mastery": {
            "Mechanics": {"accuracy": 0.82, "attempts": 20, "avg_time_sec": 42.0, "trend": "improving"},
            "Thermodynamics": {"accuracy": 0.78, "attempts": 15, "avg_time_sec": 48.0, "trend": "stable"},
            "Electrochemistry": {"accuracy": 0.38, "attempts": 10, "avg_time_sec": 84.0, "trend": "declining"},
            "Organic Chemistry": {"accuracy": 0.72, "attempts": 12, "avg_time_sec": 55.0, "trend": "stable"},
            "Inorganic Chemistry": {"accuracy": 0.65, "attempts": 8, "avg_time_sec": 60.0, "trend": "stable"},
            "Calculus": {"accuracy": 0.70, "attempts": 18, "avg_time_sec": 70.0, "trend": "stable"},
            "Genetics": {"accuracy": 0.85, "attempts": 10, "avg_time_sec": 40.0, "trend": "stable"},
            "Human Physiology": {"accuracy": 0.80, "attempts": 12, "avg_time_sec": 45.0, "trend": "stable"}
        }
    })

    # Rohan Mehta: Low stats, declining in Calculus and Organic Chemistry
    db.collection("mastery_profiles").document("dummy_student_rohan").set({
        "student_id": "dummy_student_rohan",
        "name": "Rohan Mehta",
        "email": "rohan@aspira.com",
        "role": "student",
        "tests_completed": 31,
        "last_active": firestore.SERVER_TIMESTAMP,
        "mastery": {
            "Mechanics": {"accuracy": 0.45, "attempts": 12, "avg_time_sec": 72.0, "trend": "stable"},
            "Thermodynamics": {"accuracy": 0.40, "attempts": 10, "avg_time_sec": 68.0, "trend": "stable"},
            "Electrochemistry": {"accuracy": 0.32, "attempts": 8, "avg_time_sec": 95.0, "trend": "stable"},
            "Organic Chemistry": {"accuracy": 0.30, "attempts": 15, "avg_time_sec": 88.0, "trend": "declining"},
            "Inorganic Chemistry": {"accuracy": 0.38, "attempts": 10, "avg_time_sec": 70.0, "trend": "stable"},
            "Calculus": {"accuracy": 0.28, "attempts": 16, "avg_time_sec": 110.0, "trend": "declining"},
            "Genetics": {"accuracy": 0.42, "attempts": 10, "avg_time_sec": 65.0, "trend": "stable"},
            "Human Physiology": {"accuracy": 0.45, "attempts": 8, "avg_time_sec": 58.0, "trend": "stable"}
        }
    })

    # Sneha Reddy: Outstanding stats
    db.collection("mastery_profiles").document("dummy_student_sneha").set({
        "student_id": "dummy_student_sneha",
        "name": "Sneha Reddy",
        "email": "sneha@aspira.com",
        "role": "student",
        "tests_completed": 44,
        "last_active": firestore.SERVER_TIMESTAMP,
        "mastery": {
            "Mechanics": {"accuracy": 0.74, "attempts": 15, "avg_time_sec": 52.0, "trend": "stable"},
            "Thermodynamics": {"accuracy": 0.70, "attempts": 10, "avg_time_sec": 54.0, "trend": "stable"},
            "Electrochemistry": {"accuracy": 0.72, "attempts": 12, "avg_time_sec": 68.0, "trend": "stable"},
            "Organic Chemistry": {"accuracy": 0.76, "attempts": 14, "avg_time_sec": 56.0, "trend": "stable"},
            "Inorganic Chemistry": {"accuracy": 0.70, "attempts": 10, "avg_time_sec": 62.0, "trend": "stable"},
            "Calculus": {"accuracy": 0.68, "attempts": 12, "avg_time_sec": 78.0, "trend": "stable"},
            "Genetics": {"accuracy": 0.94, "attempts": 20, "avg_time_sec": 32.0, "trend": "improving"},
            "Human Physiology": {"accuracy": 0.90, "attempts": 16, "avg_time_sec": 38.0, "trend": "stable"}
        }
    })

    # Aditya Sharma: Good in math/mechanics, struggling in organic/inorganic
    db.collection("mastery_profiles").document("dummy_student_aditya").set({
        "student_id": "dummy_student_aditya",
        "name": "Aditya Sharma",
        "email": "aditya@aspira.com",
        "role": "student",
        "tests_completed": 18,
        "last_active": firestore.SERVER_TIMESTAMP,
        "mastery": {
            "Mechanics": {"accuracy": 0.85, "attempts": 8, "avg_time_sec": 35.0, "trend": "stable"},
            "Thermodynamics": {"accuracy": 0.60, "attempts": 6, "avg_time_sec": 50.0, "trend": "stable"},
            "Electrochemistry": {"accuracy": 0.55, "attempts": 5, "avg_time_sec": 70.0, "trend": "stable"},
            "Organic Chemistry": {"accuracy": 0.35, "attempts": 10, "avg_time_sec": 85.0, "trend": "declining"},
            "Inorganic Chemistry": {"accuracy": 0.28, "attempts": 8, "avg_time_sec": 90.0, "trend": "declining"},
            "Calculus": {"accuracy": 0.92, "attempts": 12, "avg_time_sec": 28.0, "trend": "improving"},
            "Genetics": {"accuracy": 0.50, "attempts": 4, "avg_time_sec": 55.0, "trend": "stable"},
            "Human Physiology": {"accuracy": 0.58, "attempts": 6, "avg_time_sec": 48.0, "trend": "stable"}
        }
    })

    # Meera Nair: Weak in physiology and genetics, strong in electrochemistry
    db.collection("mastery_profiles").document("dummy_student_meera").set({
        "student_id": "dummy_student_meera",
        "name": "Meera Nair",
        "email": "meera@aspira.com",
        "role": "student",
        "tests_completed": 25,
        "last_active": firestore.SERVER_TIMESTAMP,
        "mastery": {
            "Mechanics": {"accuracy": 0.52, "attempts": 8, "avg_time_sec": 58.0, "trend": "stable"},
            "Thermodynamics": {"accuracy": 0.48, "attempts": 6, "avg_time_sec": 62.0, "trend": "stable"},
            "Electrochemistry": {"accuracy": 0.88, "attempts": 12, "avg_time_sec": 40.0, "trend": "improving"},
            "Organic Chemistry": {"accuracy": 0.50, "attempts": 8, "avg_time_sec": 65.0, "trend": "stable"},
            "Inorganic Chemistry": {"accuracy": 0.55, "attempts": 6, "avg_time_sec": 60.0, "trend": "stable"},
            "Calculus": {"accuracy": 0.45, "attempts": 10, "avg_time_sec": 82.0, "trend": "stable"},
            "Genetics": {"accuracy": 0.35, "attempts": 9, "avg_time_sec": 75.0, "trend": "declining"},
            "Human Physiology": {"accuracy": 0.24, "attempts": 10, "avg_time_sec": 88.0, "trend": "declining"}
        }
    })

    # Kabir Verma: Outstanding profile
    db.collection("mastery_profiles").document("dummy_student_kabir").set({
        "student_id": "dummy_student_kabir",
        "name": "Kabir Verma",
        "email": "kabir@aspira.com",
        "role": "student",
        "tests_completed": 60,
        "last_active": firestore.SERVER_TIMESTAMP,
        "mastery": {
            "Mechanics": {"accuracy": 0.94, "attempts": 15, "avg_time_sec": 30.0, "trend": "stable"},
            "Thermodynamics": {"accuracy": 0.88, "attempts": 12, "avg_time_sec": 38.0, "trend": "stable"},
            "Electrochemistry": {"accuracy": 0.91, "attempts": 14, "avg_time_sec": 35.0, "trend": "improving"},
            "Organic Chemistry": {"accuracy": 0.85, "attempts": 16, "avg_time_sec": 45.0, "trend": "stable"},
            "Inorganic Chemistry": {"accuracy": 0.82, "attempts": 10, "avg_time_sec": 42.0, "trend": "stable"},
            "Calculus": {"accuracy": 0.96, "attempts": 20, "avg_time_sec": 25.0, "trend": "improving"},
            "Genetics": {"accuracy": 0.89, "attempts": 12, "avg_time_sec": 36.0, "trend": "stable"},
            "Human Physiology": {"accuracy": 0.92, "attempts": 14, "avg_time_sec": 32.0, "trend": "stable"}
        }
    })

    # Ananya Das: Struggling overall
    db.collection("mastery_profiles").document("dummy_student_ananya").set({
        "student_id": "dummy_student_ananya",
        "name": "Ananya Das",
        "email": "ananya@aspira.com",
        "role": "student",
        "tests_completed": 12,
        "last_active": firestore.SERVER_TIMESTAMP,
        "mastery": {
            "Mechanics": {"accuracy": 0.35, "attempts": 5, "avg_time_sec": 84.0, "trend": "stable"},
            "Thermodynamics": {"accuracy": 0.30, "attempts": 4, "avg_time_sec": 92.0, "trend": "stable"},
            "Electrochemistry": {"accuracy": 0.40, "attempts": 6, "avg_time_sec": 78.0, "trend": "stable"},
            "Organic Chemistry": {"accuracy": 0.32, "attempts": 8, "avg_time_sec": 95.0, "trend": "declining"},
            "Inorganic Chemistry": {"accuracy": 0.28, "attempts": 5, "avg_time_sec": 88.0, "trend": "stable"},
            "Calculus": {"accuracy": 0.38, "attempts": 7, "avg_time_sec": 100.0, "trend": "stable"},
            "Genetics": {"accuracy": 0.30, "attempts": 4, "avg_time_sec": 82.0, "trend": "stable"},
            "Human Physiology": {"accuracy": 0.36, "attempts": 6, "avg_time_sec": 75.0, "trend": "stable"}
        }
    })
    
    print("Firestore Mastery Profiles seeded.")

    # 3. Seed historical test submissions for Rohan Mehta (helps test mistake pattern categorization)
    db.collection("submissions").document("dummy_submission_rohan_1").set({
        "submission_id": "dummy_submission_rohan_1",
        "student_id": "dummy_student_rohan",
        "test_type": "personalized",
        "score": 4,
        "total_questions": 10,
        "created_at": firestore.SERVER_TIMESTAMP,
        "results": [
            {
                "q_id": "q043",
                "topic": "Calculus",
                "is_correct": False,
                "student_answer": "C",
                "correct_answer": "A",
                "time_spent": 120.0,
                "ai_score_details": {
                    "reasoning": "The student used the standard power rule. However, since the base and power both vary, logarithmic differentiation is required. This represents a conceptual error.",
                    "mistake_type": "conceptual"
                }
            },
            {
                "q_id": "q019",
                "topic": "Electrochemistry",
                "is_correct": False,
                "student_answer": "B",
                "correct_answer": "C",
                "time_spent": 90.0,
                "ai_score_details": {
                    "reasoning": "The student forgot to divide the Nernst log modifier by n = 2 for the copper ion charge. This is a computational oversight.",
                    "mistake_type": "computational"
                }
            }
        ]
    })

    # Seed historical test submissions for Aditya Sharma
    db.collection("submissions").document("dummy_submission_aditya_1").set({
        "submission_id": "dummy_submission_aditya_1",
        "student_id": "dummy_student_aditya",
        "test_type": "personalized",
        "score": 5,
        "total_questions": 10,
        "created_at": firestore.SERVER_TIMESTAMP,
        "results": [
            {
                "q_id": "q029",
                "topic": "Organic Chemistry",
                "is_correct": False,
                "student_answer": "C",
                "correct_answer": "A",
                "time_spent": 110.0,
                "ai_score_details": {
                    "reasoning": "The student predicted a substitution reaction (SN2) instead of elimination (E2) when heating a secondary alkyl halide with a bulky base. This shows a conceptual misunderstanding of base kinetics.",
                    "mistake_type": "conceptual"
                }
            }
        ]
    })
    
    print("Demo submission logs seeded.")
    print("Demo data seed finished successfully!")

if __name__ == "__main__":
    seed()
