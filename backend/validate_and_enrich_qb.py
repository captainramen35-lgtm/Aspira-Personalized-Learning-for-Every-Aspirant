import os
import json
import random

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "question_bank")

def enrich_ai_explanation(q):
    if "ai_explanation" not in q or not q["ai_explanation"]:
        q["ai_explanation"] = {
            "concept": q.get("formula_or_concept", "Fundamental Concept"),
            "step_by_step": [
                q.get("detailed_solution", "Refer to standard solution.")
            ],
            "why_this_works": q.get("ai_explanation_seed", "Direct application of principles."),
            "option_analysis": {
                "A": f"Option A evaluation based on problem parameters.",
                "B": f"Option B evaluation based on problem parameters.",
                "C": f"Option C evaluation based on problem parameters.",
                "D": f"Option D evaluation based on problem parameters."
            },
            "key_takeaway": f"Focus on understanding {q.get('topic', 'the key topic')} thoroughly.",
            "common_mistake_warning": q["common_mistakes"][0] if q.get("common_mistakes") else "Avoid calculation and formula substitution errors."
        }
    return q

def validate_question_bank():
    subjects = ["physics", "chemistry", "biology", "mathematics"]
    report = {}

    for s in subjects:
        file_path = os.path.join(DATA_DIR, f"{s}.json")
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        ids = set()
        diff_count = {"easy": 0, "medium": 0, "hard": 0}
        exam_count = {}
        chapters = set()
        topics = set()
        errors = []

        for i, q in enumerate(data):
            # 1. ID check
            q_id = q.get("id")
            if not q_id:
                errors.append(f"Q[{i}] missing ID")
            elif q_id in ids:
                errors.append(f"Duplicate ID: {q_id}")
            else:
                ids.add(q_id)

            # 2. Subject check
            if q.get("subject", "").lower() != s.lower():
                errors.append(f"Q[{q_id}] subject mismatch: expected {s}, got {q.get('subject')}")

            # 3. Exam restriction check
            exam = q.get("target_exam")
            if s == "mathematics" and exam not in ["JEE"]:
                errors.append(f"Math Q[{q_id}] has invalid target_exam: {exam} (must be JEE)")
            elif s == "biology" and exam not in ["NEET"]:
                errors.append(f"Bio Q[{q_id}] has invalid target_exam: {exam} (must be NEET)")

            # 4. Answer & Options check
            opts = q.get("options", [])
            corr = q.get("correct_answer")
            if len(opts) != 4:
                errors.append(f"Q[{q_id}] options count is {len(opts)} (must be 4)")
            opt_keys = [opt[0] for opt in opts if len(opt) >= 1]
            if corr not in opt_keys and corr not in ["A", "B", "C", "D"]:
                errors.append(f"Q[{q_id}] correct_answer '{corr}' not in options")

            # 5. Enrich AI explanation if missing
            enrich_ai_explanation(q)

            diff = q.get("difficulty", "medium").lower()
            diff_count[diff] = diff_count.get(diff, 0) + 1
            exam_count[exam] = exam_count.get(exam, 0) + 1
            chapters.add(q.get("chapter"))
            topics.add(q.get("topic"))

        report[s] = {
            "total_questions": len(data),
            "difficulties": diff_count,
            "target_exams": exam_count,
            "unique_chapters": len(chapters),
            "unique_topics": len(topics),
            "errors": errors
        }

        # Save back enriched data
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    return report

if __name__ == "__main__":
    report = validate_question_bank()
    print(json.dumps(report, indent=2))
