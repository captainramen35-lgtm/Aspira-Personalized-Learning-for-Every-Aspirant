import google.generativeai as genai
import json
import logging
from backend.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiClient:
    def __init__(self):
        # Using gemini-1.5-flash as the standard fast/free model
        self.model_name = "gemini-1.5-flash"
        self.model = genai.GenerativeModel(self.model_name)

    def _call_gemini_json(self, prompt: str) -> dict:
        """Helper to call Gemini and ensure JSON response."""
        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise e

    def get_ai_score(self, question_text: str, options: list, correct_answer: str, student_answer: str) -> dict:
        """Call Gemini to explain the answer and categorize mistakes."""
        prompt = f"""
You are an expert JEE/NEET tutor scoring a student's answer.
Question: {question_text}
Options: {options}
Correct Option: {correct_answer}
Student Option: {student_answer}

Provide your evaluation in JSON format:
{{
  "reasoning": "Explain step-by-step why the student is right or wrong, and what the key concepts are. Mention if their choice is right or wrong.",
  "mistake_type": "conceptual" (if they misunderstood the core formula/physics/chemistry/math principle), "computational" (if they made a basic arithmetic/algebra error but set it up right), or "none" (if correct).
}}
"""
        try:
            return self._call_gemini_json(prompt)
        except Exception:
            # Fallback
            is_correct = (student_answer == correct_answer)
            return {
                "reasoning": f"Student answered {student_answer}. The correct answer is {correct_answer} because: {question_text}.",
                "mistake_type": "none" if is_correct else "conceptual"
            }

    def get_ai_audit(self, question_text: str, options: list, correct_answer: str, student_answer: str) -> dict:
        """Independent second Gemini check to verify correct/incorrect."""
        prompt = f"""
You are an independent academic auditor. Grade this student's response.
Question: {question_text}
Options: {options}
Correct Option: {correct_answer}
Student Option: {student_answer}

Evaluate if the student's selected option is correct. Give your output strictly in JSON:
{{
  "score": 1 (if correct) or 0 (if incorrect)
}}
"""
        try:
            res = self._call_gemini_json(prompt)
            # Ensure score is int 0 or 1
            res["score"] = int(res.get("score", 0))
            return res
        except Exception:
            # Fallback
            return {"score": 1 if student_answer == correct_answer else 0}

    def get_socratic_feedback(self, question_text: str, correct_answer: str, student_answer: str) -> dict:
        """Generate progressive hints and final explanation for wrong answers."""
        prompt = f"""
You are a Socratic JEE/NEET teacher. The student got this question wrong:
Question: {question_text}
Correct Option: {correct_answer}
Student Option: {student_answer}

Generate exactly 3 progressive hints that lead the student toward the correct solution without giving away the direct answer or the final option.
Hint 1: A general leading question focusing on the first step or core concept.
Hint 2: A more specific hint about the equation or relationship they should apply.
Hint 3: An 'almost-there' hint giving them a final push.
Final Explanation: The full worked-out mathematical or logical derivation explaining the solution.

Your response must be in JSON:
{{
  "hint1": "...",
  "hint2": "...",
  "hint3": "...",
  "final_explanation": "..."
}}
"""
        try:
            return self._call_gemini_json(prompt)
        except Exception:
            # Fallback
            return {
                "hint1": "Reread the question and write down the given values.",
                "hint2": "Recall the fundamental formula relating these quantities.",
                "hint3": "Apply the values to the formula and check the options.",
                "final_explanation": f"The correct option is {correct_answer}. Verify the calculation using basic principles."
            }

gemini_client = GeminiClient()
