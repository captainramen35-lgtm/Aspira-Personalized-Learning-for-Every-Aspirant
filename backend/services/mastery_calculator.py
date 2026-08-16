from typing import List, Dict, Any
from firebase_admin import firestore
from backend.firebase_admin_init import db

class MasteryCalculator:
    def update_profile(self, student_id: str, submission_results: List[Dict[str, Any]], test_type: str = "personalized") -> Dict[str, Any]:
        """
        Updates the student's mastery profile in Firestore.
        submission_results: List of dicts, e.g. [{"q_id": "q001", "topic": "Mechanics", "chapter": "Kinematics", "is_correct": True, "time_spent": 45.0}]
        """
        # Fetch existing profile
        profile_ref = db.collection("mastery_profiles").document(student_id)
        profile_doc = profile_ref.get()

        if profile_doc.exists:
            profile_data = profile_doc.to_dict()
            mastery = profile_data.get("mastery", {})
            chapters = profile_data.get("chapters", {})
            chapter_topics = profile_data.get("chapter_topics", {})
            tests_completed = profile_data.get("tests_completed", 0) + 1
        else:
            mastery = {}
            chapters = {}
            chapter_topics = {}
            tests_completed = 1

        # Helper to update a category level (either topic or chapter)
        def update_metrics(category_dict: dict, results_key: str, results_list: List[Dict[str, Any]]):
            category_results = {}
            for res in results_list:
                cat = res.get(results_key)
                if not cat:
                    continue
                if cat not in category_results:
                    category_results[cat] = {"correct_points": 0, "total_points": 0, "attempts": 0, "total_time": 0.0}
                
                category_results[cat]["attempts"] += 1
                
                diff = res.get("difficulty", "Medium")
                weight = 1 if diff == "Easy" else 3 if diff == "Hard" else 2
                
                category_results[cat]["total_points"] += weight
                if res["is_correct"]:
                    category_results[cat]["correct_points"] += weight
                category_results[cat]["total_time"] += res.get("time_spent", 0.0)

            for cat, current in category_results.items():
                past = category_dict.get(cat, {"accuracy": 0.0, "attempts": 0, "avg_time_sec": 0.0, "trend": "stable"})
                
                past_attempts = past.get("attempts", 0)
                past_accuracy = past.get("accuracy", 0.0)
                past_avg_time = past.get("avg_time_sec", 0.0)

                total_attempts = past_attempts + current["attempts"]
                
                current_accuracy = (current["correct_points"] / current["total_points"]) if current["total_points"] > 0 else 0.0
                
                # Weighting: Diagnostic acts as baseline, Mini & Personalized reflect current active mastery
                new_accuracy = ((past_accuracy * past_attempts) + (current_accuracy * current["attempts"])) / total_attempts if total_attempts > 0 else 0.0
                new_avg_time = ((past_avg_time * past_attempts) + current["total_time"]) / total_attempts if total_attempts > 0 else 0.0

                trend = "stable"
                if past_attempts > 0:
                    if current_accuracy < past_accuracy - 0.15:
                        trend = "declining"
                    elif current_accuracy > past_accuracy + 0.15:
                        trend = "improving"

                category_dict[cat] = {
                    "accuracy": round(new_accuracy, 2),
                    "attempts": total_attempts,
                    "avg_time_sec": round(new_avg_time, 1),
                    "trend": trend
                }

        # Update both topic-level (mastery) and chapter-level (chapters)
        update_metrics(mastery, "topic", submission_results)
        update_metrics(chapters, "chapter", submission_results)

        # Update chapter_topics mapping
        for res in submission_results:
            ch = res.get("chapter")
            top = res.get("topic")
            if ch and top:
                if ch not in chapter_topics:
                    chapter_topics[ch] = []
                if top not in chapter_topics[ch]:
                    chapter_topics[ch].append(top)

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
            "chapters": chapters,
            "chapter_topics": chapter_topics,
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
