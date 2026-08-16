import os
import json
from typing import List, Dict, Any, Optional

# Calculate absolute path to the data directory so it works reliably on Render
DEFAULT_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "question_bank")

class QuestionBankLoader:
    def __init__(self, data_dir: str = DEFAULT_DATA_DIR):
        self.data_dir = data_dir
        self._questions: List[Dict[str, Any]] = []
        self._questions_by_id: Dict[str, Dict[str, Any]] = {}
        self.load_all_questions()

    def load_all_questions(self) -> List[Dict[str, Any]]:
        """
        Loads all questions from the subject-specific JSON files in data_dir
        and caches them.
        """
        questions = []
        subjects = ["physics", "chemistry", "mathematics", "biology"]
        
        for subject in subjects:
            file_path = os.path.join(self.data_dir, f"{subject}.json")
            if os.path.exists(file_path):
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        subject_questions = json.load(f)
                        # Add a default explanation field if not present, referencing detailed_solution
                        for q in subject_questions:
                            if "explanation" not in q and "detailed_solution" in q:
                                q["explanation"] = q["detailed_solution"]
                        questions.extend(subject_questions)
                except Exception as e:
                    print(f"Warning: Failed to load question bank for {subject}: {e}")
            else:
                # Fallback check for case differences or path setup
                print(f"Warning: Subject file {file_path} does not exist.")

        self._questions = questions
        self._questions_by_id = {q["id"]: q for q in questions}
        return self._questions

    def get_all_questions(self, force_reload: bool = False) -> List[Dict[str, Any]]:
        """
        Returns all cached questions, reloading if force_reload is True.
        """
        if force_reload or not self._questions:
            return self.load_all_questions()
        return self._questions

    def get_question_by_id(self, q_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a question by its unique ID.
        """
        return self._questions_by_id.get(q_id)

    def get_questions_by_subject(self, subject: str) -> List[Dict[str, Any]]:
        """
        Retrieves all questions for a specific subject (case-insensitive).
        """
        return [q for q in self.get_all_questions() if q["subject"].lower() == subject.lower()]

    def get_questions_by_ids(self, q_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Retrieves a list of questions corresponding to the list of IDs.
        """
        return [self._questions_by_id[q_id] for q_id in q_ids if q_id in self._questions_by_id]

    def get_filtered_questions(
        self,
        subject: Optional[str] = None,
        chapter: Optional[str] = None,
        topic: Optional[str] = None,
        target_exam: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Returns questions matching the subject, chapter, topic, and target_exam constraints.
        """
        all_qs = self.get_all_questions()
        results = []
        for q in all_qs:
            if subject and q["subject"].lower() != subject.lower():
                continue
            if chapter and q.get("chapter", "").lower() != chapter.lower():
                continue
            if topic and q.get("topic", "").lower() != topic.lower():
                continue
            if target_exam and target_exam != "both":
                q_exam = q.get("target_exam", "both")
                if q_exam != "both" and q_exam.upper() != target_exam.upper():
                    continue
            results.append(q)
        return results

# Singleton instance
question_bank_loader = QuestionBankLoader()
