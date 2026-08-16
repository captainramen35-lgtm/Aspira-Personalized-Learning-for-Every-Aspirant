import random
from typing import List
from backend.firebase_admin_init import db
from backend.services.question_bank_loader import question_bank_loader

class PersonalizationEngine:
    @property
    def question_bank(self):
        return question_bank_loader.get_all_questions()

    def generate_paper(
        self,
        student_id: str,
        target_exam: str = "JEE",
        num_questions: int = 150,
        subject: str = None,
        chapter: str = None,
        topic: str = None,
        test_type: str = "personalized"
    ) -> List[dict]:
        print("\n========== GENERATE PAPER FORENSIC ==========")
        print("student_id:", student_id)
        print("target_exam:", target_exam)
        print("num_questions:", num_questions)
        print("subject:", subject)
        print("chapter:", chapter)
        print("topic:", topic)
        print("test_type:", test_type)
        print("==============================================\n")
        """
        Generates a personalized test paper or mini test.
        - Mini Test (subject + chapter [optional topic]): strictly filtered matching questions only.
        - Personalized Test: 150 questions split equally across exam subjects.
        """
        # Case A: Mini Test (subject + chapter, optional topic)
        if subject and chapter:
            print(">>> ENTERED MINI TEST BRANCH")
            filtered = question_bank_loader.get_filtered_questions(
                subject=subject,
                chapter=chapter,
                topic=topic,
                target_exam=target_exam
            )
            # If target_exam strict filter yielded fewer questions, try without target_exam constraint (both/any)
            if not filtered:
                filtered = question_bank_loader.get_filtered_questions(
                    subject=subject,
                    chapter=chapter,
                    topic=topic
                )

            # Mix difficulty (~30% easy, 50% medium, 20% hard)
            easy_pool = [q for q in filtered if q.get("difficulty", "").lower() == "easy"]
            med_pool = [q for q in filtered if q.get("difficulty", "").lower() == "medium"]
            hard_pool = [q for q in filtered if q.get("difficulty", "").lower() == "hard"]

            random.shuffle(easy_pool)
            random.shuffle(med_pool)
            random.shuffle(hard_pool)

            target_n = min(num_questions, len(filtered))
            print(">>> FILTERED COUNT:", len(filtered))
            print(">>> TARGET COUNT:", target_n)
            print(">>> FILTERED SUBJECTS:", set(q.get("subject") for q in filtered))
            print(">>> FILTERED CHAPTERS:", set(q.get("chapter") for q in filtered))
            n_easy = int(target_n * 0.3)
            n_med = int(target_n * 0.5)
            n_hard = target_n - n_easy - n_med

            selected = []
            selected.extend(easy_pool[:n_easy])
            selected.extend(med_pool[:n_med])
            selected.extend(hard_pool[:n_hard])

            if len(selected) < target_n:
                selected_ids = {q["id"] for q in selected}
                leftovers = [q for q in filtered if q["id"] not in selected_ids]
                random.shuffle(leftovers)
                selected.extend(leftovers[:target_n - len(selected)])

            random.shuffle(selected)
            print(">>> MINI TEST RETURN COUNT:", len(selected[:target_n]))
            print(">>> RETURN SUBJECTS:", set(q.get("subject") for q in selected[:target_n]))
            print(">>> RETURN CHAPTERS:", set(q.get("chapter") for q in selected[:target_n]))
            return selected[:target_n]

        # Case B: Subject-specific Personalized Test (150 Qs) or Full-syllabus test
        if subject:
            subjects = [subject]
        elif target_exam == "NEET":
            subjects = ["Physics", "Chemistry", "Biology"]
        else:
            subjects = ["Physics", "Chemistry", "Mathematics"]

        # Calculate exact quotas per subject summing to num_questions (e.g. 150 -> 50, 50, 50)
        base_quota = num_questions // len(subjects)
        remainder = num_questions % len(subjects)
        subject_quotas = {}
        for idx, sub_name in enumerate(subjects):
            subject_quotas[sub_name] = base_quota + (1 if idx < remainder else 0)

        # Fetch student's attempted questions
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

        # Fetch student mastery
        profile_ref = db.collection("mastery_profiles").document(student_id)
        profile_doc = profile_ref.get()
        chapters = {}
        if profile_doc.exists:
            chapters = profile_doc.to_dict().get("chapters", {})

        selected_questions = []

        for sub_name in subjects:
            questions_per_subject = subject_quotas[sub_name]
            subject_questions = question_bank_loader.get_filtered_questions(
                subject=sub_name,
                target_exam=target_exam
            )
            if not subject_questions:
                subject_questions = [q for q in self.question_bank if q["subject"].lower() == sub_name.lower()]

            if not subject_questions:
                continue

            # Identify weak vs strong chapters within this subject
            subject_chapters = list(set(q.get("chapter", "General") for q in subject_questions))
            weak_chapters = []
            strong_chapters = []

            for chap_item in subject_chapters:
                chap_mastery = chapters.get(chap_item, {})
                accuracy = chap_mastery.get("accuracy", 50.0)
                if accuracy < 50.0:
                    weak_chapters.append(chap_item)
                else:
                    strong_chapters.append(chap_item)

            weak_pool = [q for q in subject_questions if q.get("chapter", "General") in weak_chapters and q["id"] not in attempted_qids]
            strong_pool = [q for q in subject_questions if q.get("chapter", "General") in strong_chapters and q["id"] not in attempted_qids]

            if not weak_pool and weak_chapters:
                weak_pool = [q for q in subject_questions if q.get("chapter", "General") in weak_chapters]
            if not strong_pool and strong_chapters:
                strong_pool = [q for q in subject_questions if q.get("chapter", "General") in strong_chapters]

            num_weak_needed = int(questions_per_subject * 0.6)
            num_strong_needed = questions_per_subject - num_weak_needed

            if not weak_chapters:
                num_strong_needed = questions_per_subject
                num_weak_needed = 0
            elif not strong_chapters:
                num_weak_needed = questions_per_subject
                num_strong_needed = 0

            subject_selected = []

            if len(weak_pool) >= num_weak_needed:
                subject_selected.extend(random.sample(weak_pool, num_weak_needed))
            else:
                subject_selected.extend(weak_pool)
                num_strong_needed += (num_weak_needed - len(weak_pool))

            if len(strong_pool) >= num_strong_needed:
                subject_selected.extend(random.sample(strong_pool, num_strong_needed))
            else:
                subject_selected.extend(strong_pool)
                remaining_needed = questions_per_subject - len(subject_selected)
                if remaining_needed > 0:
                    leftovers = [q for q in subject_questions if q not in subject_selected]
                    if len(leftovers) >= remaining_needed:
                        subject_selected.extend(random.sample(leftovers, remaining_needed))
                    else:
                        subject_selected.extend(leftovers)

            random.shuffle(subject_selected)
            selected_questions.extend(subject_selected[:questions_per_subject])

        random.shuffle(selected_questions)
        return selected_questions

personalization_engine = PersonalizationEngine()
