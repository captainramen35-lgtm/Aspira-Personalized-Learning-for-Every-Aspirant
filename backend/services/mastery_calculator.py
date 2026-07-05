from typing import List, Dict, Any
from firebase_admin import firestore
from backend.firebase_admin_init import db

class MasteryCalculator:
    def update_profile(self, student_id: str, submission_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Updates the student's mastery profile in Firestore.
        submission_results: List of dicts, e.g. [{"q_id": "q001", "topic": "Mechanics", "is_correct": True, "time_spent": 45.0}]
        """
        # Fetch existing profile
        profile_ref = db.collection("mastery_profiles").document(student_id)
        profile_doc = profile_ref.get()

        if profile_doc.exists:
            profile_data = profile_doc.to_dict()
            mastery = profile_data.get("mastery", {})
            tests_completed = profile_data.get("tests_completed", 0) + 1
        else:
            mastery = {}
            tests_completed = 1

        # Group current test results by topic
        topic_results = {}
        for res in submission_results:
            topic = res["topic"]
            if topic not in topic_results:
                topic_results[topic] = {"correct": 0, "attempts": 0, "total_time": 0.0}
            topic_results[topic]["attempts"] += 1
            if res["is_correct"]:
                topic_results[topic]["correct"] += 1
            topic_results[topic]["total_time"] += res.get("time_spent", 0.0)

        # Recalculate metrics for each topic
        for topic, current in topic_results.items():
            past = mastery.get(topic, {"accuracy": 0.0, "attempts": 0, "avg_time_sec": 0.0, "trend": "stable"})
            
            past_attempts = past.get("attempts", 0)
            past_accuracy = past.get("accuracy", 0.0)
            past_avg_time = past.get("avg_time_sec", 0.0)

            total_attempts = past_attempts + current["attempts"]
            
            # Weighted average calculation
            new_accuracy = ((past_accuracy * past_attempts) + current["correct"]) / total_attempts
            new_avg_time = ((past_avg_time * past_attempts) + current["total_time"]) / total_attempts

            # Trend detection
            current_accuracy = current["correct"] / current["attempts"]
            trend = "stable"
            if past_attempts > 0:
                if current_accuracy < past_accuracy - 0.15:
                    trend = "declining"
                elif current_accuracy > past_accuracy + 0.15:
                    trend = "improving"

            mastery[topic] = {
                "accuracy": round(new_accuracy, 2),
                "attempts": total_attempts,
                "avg_time_sec": round(new_avg_time, 1),
                "trend": trend
            }

        # Fetch student metadata from users collection if available
        student_doc = db.collection("users").document(student_id).get()
        name = "Student"
        email = ""
        role = "student"
        if student_doc.exists:
            student_data = student_doc.to_dict()
            name = student_data.get("name", "Student")
            email = student_data.get("email", "")
            role = student_data.get("role", "student")

        # Prepare updated profile fields
        updated_profile = {
            "student_id": student_id,
            "name": name,
            "email": email,
            "role": role,
            "mastery": mastery,
            "tests_completed": tests_completed,
            "last_active": firestore.SERVER_TIMESTAMP
        }

        # Write/merge into Firestore
        profile_ref.set(updated_profile, merge=True)
        
        # Return a JSON-serializable copy for FastAPI router responses
        from datetime import datetime
        serializable_profile = updated_profile.copy()
        serializable_profile["last_active"] = datetime.utcnow().isoformat() + "Z"
        return serializable_profile

mastery_calculator = MasteryCalculator()
