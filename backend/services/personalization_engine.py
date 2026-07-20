import random
from typing import List
from backend.firebase_admin_init import db
from backend.services.question_bank_loader import question_bank_loader

class PersonalizationEngine:
    @property
    def question_bank(self):
        return question_bank_loader.get_all_questions()

    def generate_paper(self, student_id: str, target_exam: str = "JEE", num_questions: int = 75) -> List[dict]:
        """
        Generates a personalized adaptive test paper.
        Usually 75 questions: 25 per subject depending on target_exam:
        - JEE: Physics (25), Chemistry (25), Mathematics (25)
        - NEET: Physics (25), Chemistry (25), Biology (25)
        
        Within each subject:
        - 60% from weak topics (< 50% accuracy), 40% from strong/average topics.
        - Avoids repeating questions that the student has already attempted.
        """
        # 1. Determine subjects and questions per subject
        if target_exam == "NEET":
            subjects = ["Physics", "Chemistry", "Biology"]
        else:
            subjects = ["Physics", "Chemistry", "Mathematics"]

        questions_per_subject = num_questions // len(subjects)

        # 2. Fetch student's attempted questions from their submission history
        attempted_qids = set()
        try:
            submissions_ref = db.collection("submissions").where("student_id", "==", student_id).stream()
            for sub in submissions_ref:
                sub_data = sub.to_dict()
                answers = sub_data.get("answers")
                if isinstance(answers, dict):
                    attempted_qids.update(answers.keys())
                elif sub_data.get("results"):
                    attempted_qids.update(r["q_id"] for r in sub_data["results"])
        except Exception as e:
            print(f"Error fetching attempted questions: {e}")

        # 3. Get student's mastery profile
        profile_ref = db.collection("mastery_profiles").document(student_id)
        profile_doc = profile_ref.get()
        mastery = {}
        if profile_doc.exists:
            mastery = profile_doc.to_dict().get("mastery", {})

        selected_questions = []

        # 4. Sample per subject
        for subject in subjects:
            subject_questions = [q for q in self.question_bank if q["subject"].lower() == subject.lower()]
            if not subject_questions:
                continue

            # Identify weak vs strong topics within this subject
            subject_topics = list(set(q["topic"] for q in subject_questions))
            weak_topics = []
            strong_topics = []

            for topic in subject_topics:
                topic_mastery = mastery.get(topic, {})
                accuracy = topic_mastery.get("accuracy", 0.5)
                if accuracy < 0.5:
                    weak_topics.append(topic)
                else:
                    strong_topics.append(topic)

            # Categorize subject questions into weak and strong pools, filtering out attempted
            weak_pool = [q for q in subject_questions if q["topic"] in weak_topics and q["id"] not in attempted_qids]
            strong_pool = [q for q in subject_questions if q["topic"] in strong_topics and q["id"] not in attempted_qids]

            # Fallbacks: if pools are empty due to student having attempted everything, ignore the attempted filter
            if not weak_pool and weak_topics:
                weak_pool = [q for q in subject_questions if q["topic"] in weak_topics]
            if not strong_pool and strong_topics:
                strong_pool = [q for q in subject_questions if q["topic"] in strong_topics]

            # Target sizes for this subject
            num_weak_needed = int(questions_per_subject * 0.6)
            num_strong_needed = questions_per_subject - num_weak_needed

            if not weak_topics:
                num_strong_needed = questions_per_subject
                num_weak_needed = 0
            elif not strong_topics:
                num_weak_needed = questions_per_subject
                num_strong_needed = 0

            subject_selected = []

            # Sample from weak pool
            if len(weak_pool) >= num_weak_needed:
                subject_selected.extend(random.sample(weak_pool, num_weak_needed))
            else:
                subject_selected.extend(weak_pool)
                num_strong_needed += (num_weak_needed - len(weak_pool))

            # Sample from strong pool
            if len(strong_pool) >= num_strong_needed:
                subject_selected.extend(random.sample(strong_pool, num_strong_needed))
            else:
                subject_selected.extend(strong_pool)
                # If still short, pull from any remaining question in this subject
                remaining_needed = questions_per_subject - len(subject_selected)
                if remaining_needed > 0:
                    leftovers = [q for q in subject_questions if q not in subject_selected]
                    subject_selected.extend(random.sample(leftovers, min(remaining_needed, len(leftovers))))

            # Shuffle individual subject questions to mix topics/difficulty
            random.shuffle(subject_selected)
            selected_questions.extend(subject_selected[:questions_per_subject])

        # Final shuffle across subjects to mix them nicely
        random.shuffle(selected_questions)
        return selected_questions

personalization_engine = PersonalizationEngine()
