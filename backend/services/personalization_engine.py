import json
import random
from typing import List
from backend.firebase_admin_init import db

class PersonalizationEngine:
    def __init__(self):
        # Load seed question bank directly from JSON
        with open("backend/data/question_bank.json", "r") as f:
            self.question_bank = json.load(f)

    def generate_paper(self, student_id: str, num_questions: int = 10) -> List[dict]:
        """
        Generates a personalized test paper of size `num_questions`.
        Weighted sampling: 60% from weak topics (< 50% accuracy), 40% from strong/average topics.
        Avoids repeating questions that the student has already attempted, if possible.
        """
        # 1. Fetch student's attempted questions from their submission history
        attempted_qids = set()
        try:
            submissions_ref = db.collection("submissions").where("student_id", "==", student_id).stream()
            for sub in submissions_ref:
                sub_data = sub.to_dict()
                answers = sub_data.get("answers", {})
                attempted_qids.update(answers.keys())
        except Exception as e:
            # Fail silently or log error, default to empty set
            print(f"Error fetching attempted questions: {e}")

        # 2. Get student's mastery profile
        profile_ref = db.collection("mastery_profiles").document(student_id)
        profile_doc = profile_ref.get()

        # If no profile exists (e.g. before diagnostic), return a balanced set of random questions
        if not profile_doc.exists:
            available_questions = [q for q in self.question_bank if q["id"] not in attempted_qids]
            if len(available_questions) < num_questions:
                available_questions = self.question_bank.copy()
            random.shuffle(available_questions)
            return available_questions[:num_questions]

        profile_data = profile_doc.to_dict()
        mastery = profile_data.get("mastery", {})

        # Define the 8 target topics
        all_topics = [
            "Mechanics", "Thermodynamics", "Electrochemistry", "Organic Chemistry",
            "Inorganic Chemistry", "Calculus", "Genetics", "Human Physiology"
        ]

        weak_topics = []
        strong_topics = []

        for topic in all_topics:
            topic_mastery = mastery.get(topic, {})
            # Default to 0.50 (neutral/average) if the topic has never been attempted
            accuracy = topic_mastery.get("accuracy", 0.5)
            if accuracy < 0.5:
                weak_topics.append(topic)
            else:
                strong_topics.append(topic)

        # 3. Categorize questions into weak and strong pools, filtering out already attempted questions
        weak_pool = [q for q in self.question_bank if q["topic"] in weak_topics and q["id"] not in attempted_qids]
        strong_pool = [q for q in self.question_bank if q["topic"] in strong_topics and q["id"] not in attempted_qids]

        # Fallback: if pools are empty due to student having attempted everything, ignore the attempted filter
        if not weak_pool and weak_topics:
            weak_pool = [q for q in self.question_bank if q["topic"] in weak_topics]
        if not strong_pool and strong_topics:
            strong_pool = [q for q in self.question_bank if q["topic"] in strong_topics]

        # 4. Determine target sizes
        num_weak_needed = int(num_questions * 0.6)
        num_strong_needed = num_questions - num_weak_needed

        # Adjust targets if one of the categories has no topics
        if not weak_topics:
            num_strong_needed = num_questions
            num_weak_needed = 0
        elif not strong_topics:
            num_weak_needed = num_questions
            num_strong_needed = 0

        selected_questions = []

        # Sample from weak pool
        if len(weak_pool) >= num_weak_needed:
            selected_questions.extend(random.sample(weak_pool, num_weak_needed))
        else:
            selected_questions.extend(weak_pool)
            num_strong_needed += (num_weak_needed - len(weak_pool))

        # Sample from strong pool
        if len(strong_pool) >= num_strong_needed:
            selected_questions.extend(random.sample(strong_pool, num_strong_needed))
        else:
            selected_questions.extend(strong_pool)
            # If we are still short, pull from any remaining question in the entire bank
            remaining_needed = num_questions - len(selected_questions)
            if remaining_needed > 0:
                leftovers = [q for q in self.question_bank if q not in selected_questions]
                selected_questions.extend(random.sample(leftovers, min(remaining_needed, len(leftovers))))

        # Shuffle selected questions to mix topics and difficulty levels
        random.shuffle(selected_questions)
        return selected_questions[:num_questions]

personalization_engine = PersonalizationEngine()
