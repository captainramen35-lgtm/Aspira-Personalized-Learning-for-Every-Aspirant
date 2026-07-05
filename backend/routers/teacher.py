from fastapi import APIRouter, Depends, HTTPException
from backend.routers.auth import get_current_user
from backend.firebase_admin_init import db
from typing import List, Dict, Any

router = APIRouter(prefix="/api/teacher", tags=["teacher"])

@router.get("/analytics")
async def get_class_analytics(user: dict = Depends(get_current_user)):
    """
    Returns class-wide aggregated analytics and the student roster list.
    Verifies that the requesting user is a teacher.
    """
    # 1. Verify user is a teacher
    uid = user["uid"]
    teacher_doc = db.collection("users").document(uid).get()
    if not teacher_doc.exists or teacher_doc.to_dict().get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Access denied. Only teachers can access this panel.")
        
    try:
        # 2. Fetch all student profiles and users
        students_ref = db.collection("users").where("role", "==", "student").stream()
        student_metadata = {}
        for s in students_ref:
            sdata = s.to_dict()
            student_metadata[s.id] = {
                "name": sdata.get("name", "Unknown Student"),
                "email": sdata.get("email", ""),
                "joined_date": sdata.get("joined_date", "July 2026")
            }

        profiles_ref = db.collection("mastery_profiles").stream()
        student_profiles = {}
        for p in profiles_ref:
            pdata = p.to_dict()
            student_profiles[p.id] = pdata

        # 3. Build Roster
        roster = []
        default_topics = [
            "Mechanics", "Thermodynamics", "Electrochemistry", "Organic Chemistry",
            "Inorganic Chemistry", "Calculus", "Genetics", "Human Physiology"
        ]

        for s_id, meta in student_metadata.items():
            profile = student_profiles.get(s_id, {})
            mastery = profile.get("mastery", {})
            
            # Compute average accuracy across all attempted topics
            accuracies = [m.get("accuracy", 0.0) for m in mastery.values() if m.get("attempts", 0) > 0]
            avg_acc = sum(accuracies) / len(accuracies) if accuracies else 0.0
            
            roster.append({
                "student_id": s_id,
                "name": meta["name"],
                "email": meta["email"],
                "tests_completed": profile.get("tests_completed", 0),
                "avg_accuracy": round(avg_acc * 100, 1)  # Scale to percentage
            })

        # Sort roster alphabetically by name
        roster.sort(key=lambda x: x["name"])

        # 4. Calculate Topic-wise Average Mastery (Class Pulse)
        topic_sums = {topic: [] for topic in default_topics}
        for profile in student_profiles.values():
            mastery = profile.get("mastery", {})
            for topic in default_topics:
                tdata = mastery.get(topic, {})
                if tdata.get("attempts", 0) > 0:
                    topic_sums[topic].append(tdata.get("accuracy", 0.0))

        weakest_topics = []
        for topic in default_topics:
            acc_list = topic_sums[topic]
            avg_val = sum(acc_list) / len(acc_list) if acc_list else 0.50 # Default to 50%
            weakest_topics.append({
                "topic": topic,
                "avg_accuracy": round(avg_val * 100, 1)
            })

        # 5. Weak / Strong distribution
        # Strong: avg accuracy >= 60%. Weak: < 60%
        strong_count = 0
        weak_count = 0
        for item in roster:
            if item["avg_accuracy"] >= 60.0:
                strong_count += 1
            else:
                weak_count += 1
                
        # 6. Flagged students (students with declining trend in 1 or more topics)
        flagged_students = []
        for s_id, profile in student_profiles.items():
            mastery = profile.get("mastery", {})
            declining_topics = []
            for topic, tdata in mastery.items():
                if tdata.get("trend") == "declining":
                    declining_topics.append(topic)
            if declining_topics:
                meta = student_metadata.get(s_id, {"name": "Unknown"})
                flagged_students.append({
                    "student_id": s_id,
                    "name": meta["name"],
                    "declining_topics": declining_topics
                })

        return {
            "roster": roster,
            "weakest_topics": weakest_topics,
            "strong_weak_ratio": {"strong": strong_count, "weak": weak_count},
            "flagged_students": flagged_students
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile teacher analytics: {e}")

@router.get("/student/{student_id}")
async def get_student_details(student_id: str, user: dict = Depends(get_current_user)):
    """
    Returns full details for a selected student, including:
    - Profile metadata
    - Topic-wise mastery bars
    - Response speed analysis
    - Recurring mistake patterns summarized from their incorrect submissions
    """
    # 1. Verify user is a teacher
    uid = user["uid"]
    teacher_doc = db.collection("users").document(uid).get()
    if not teacher_doc.exists or teacher_doc.to_dict().get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Access denied.")

    try:
        # 2. Fetch student user meta
        student_doc = db.collection("users").document(student_id).get()
        if not student_doc.exists:
            raise HTTPException(status_code=404, detail="Student not found.")
        sdata = student_doc.to_dict()

        # 3. Fetch student profile
        profile_doc = db.collection("mastery_profiles").document(student_id).get()
        
        default_topics = [
            "Mechanics", "Thermodynamics", "Electrochemistry", "Organic Chemistry",
            "Inorganic Chemistry", "Calculus", "Genetics", "Human Physiology"
        ]

        if profile_doc.exists:
            pdata = profile_doc.to_dict()
            mastery = pdata.get("mastery", {})
            tests_completed = pdata.get("tests_completed", 0)
        else:
            mastery = {}
            tests_completed = 0

        # Construct topic-wise output
        mastery_response = {}
        total_attempts = 0
        total_time = 0.0
        
        for topic in default_topics:
            tdata = mastery.get(topic, {})
            accuracy = tdata.get("accuracy", 0.0)
            attempts = tdata.get("attempts", 0)
            avg_time = tdata.get("avg_time_sec", 0.0)
            trend = tdata.get("trend", "stable")
            
            total_attempts += attempts
            total_time += (avg_time * attempts)
            
            mastery_response[topic] = {
                "accuracy": round(accuracy * 100, 1),
                "attempts": attempts,
                "avg_time_sec": avg_time,
                "trend": trend
            }

        # Speed analysis
        avg_speed_sec = round(total_time / total_attempts, 1) if total_attempts > 0 else 0.0
        speed_status = "STABLE"
        if avg_speed_sec > 75.0:
            speed_status = "SLOW"
        elif 0 < avg_speed_sec < 45.0:
            speed_status = "FAST"

        # 4. Generate recurring mistake patterns from submission history
        # We look at wrong answers in the submissions collection
        submissions_ref = db.collection("submissions").where("student_id", "==", student_id).stream()
        mistake_counts = {"conceptual": 0, "computational": 0}
        mistake_topics = {}

        for sub in submissions_ref:
            sub_data = sub.to_dict()
            results = sub_data.get("results", [])
            for res in results:
                if not res.get("is_correct", True):
                    t = res.get("topic", "General")
                    m_type = res.get("ai_score_details", {}).get("mistake_type", "conceptual")
                    
                    mistake_counts[m_type] = mistake_counts.get(m_type, 0) + 1
                    mistake_topics[t] = mistake_topics.get(t, 0) + 1

        mistake_patterns = []
        if total_attempts == 0:
            mistake_patterns.append("Student has not completed any tests yet.")
        else:
            total_errors = sum(mistake_counts.values())
            if total_errors == 0:
                mistake_patterns.append("No repeating mistake patterns detected. Keeping up strong progress!")
            else:
                if mistake_counts.get("conceptual", 0) > mistake_counts.get("computational", 0):
                    mistake_patterns.append(f"Primary error style: Conceptual gaps ({mistake_counts.get('conceptual')} flags). Focus on core formula derivations.")
                else:
                    mistake_patterns.append(f"Primary error style: Computational slips ({mistake_counts.get('computational')} flags). Review numerical calculations carefully.")
                
                # Identify weakest topic by errors
                if mistake_topics:
                    weakest_by_error = max(mistake_topics, key=mistake_topics.get)
                    mistake_patterns.append(f"Most errors occurred in {weakest_by_error} ({mistake_topics[weakest_by_error]} wrong responses). Revisit textbook worksheets.")

        return {
            "student_id": student_id,
            "name": sdata.get("name"),
            "email": sdata.get("email"),
            "enrolled": sdata.get("enrolled", "Not Enrolled"),
            "joined_date": sdata.get("joined_date", "July 2026"),
            "tests_completed": tests_completed,
            "mastery": mastery_response,
            "speed": {
                "avg_time_sec": avg_speed_sec,
                "status": speed_status
            },
            "mistake_patterns": mistake_patterns
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch student details: {e}")
