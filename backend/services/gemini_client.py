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
        # Using gemini-3.5-flash as the standard fast/free model
        self.model_name = "gemini-3.5-flash"
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
  "reasoning": "Detailed explanation following these rules:\n\nMATH FORMATTING RULES:\n- DO NOT use LaTeX formatting or LaTeX math syntax (such as \\eta, \\frac, \\times, \\%, \\approx, \\cdot, \\Delta, \\theta, etc.).\n- Use clean, standard, human-readable plain text formatting:\n  - Write percentage as % (never \\%).\n  - Use / for division (e.g. a / b).\n  - Use * or x for multiplication.\n  - Use standard text Greek names (like eta, theta, pi, delta) instead of LaTeX markup.\n  - Use standard ^ for exponents (e.g. t^2).\n\nCRITICAL RULE: DO NOT restate the question text as your explanation! You must provide a genuine step-by-step mathematical or logical solution.\n\nIF STUDENT IS INCORRECT (student_answer != correct_answer):\n1. State what concept/formula the question is testing.\n2. Show the full step-by-step solution using actual numbers from the question — every calculation step, not just the final answer.\n3. Point out specifically where the student's approach likely went wrong (use their selected wrong option {student_answer} to guess the likely mistake — e.g. if they picked a choice matching a common sign error or wrong formula, name that specific error).\n4. End with a 1-sentence tip on how to avoid this mistake next time.\n\nIF STUDENT IS CORRECT (student_answer == correct_answer):\n1. Briefly state the core concept.\n2. Provide the full step-by-step solution (showing actual calculations, not just 'plug it in').\n3. End with a 1-sentence tip on a faster shortcut or alternative way to solve it (if applicable) or a reinforcing comment.",
  "mistake_type": "conceptual" | "computational" | "none"
}}
"""
        try:
            return self._call_gemini_json(prompt)
        except Exception:
            # Fallback
            is_correct = (student_answer == correct_answer)
            return {
                "reasoning": f"Student answered {student_answer}. The correct answer is {correct_answer}.",
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
Final Explanation: Highly detailed explanation following these rules:

MATH FORMATTING RULES:
- DO NOT use LaTeX formatting or LaTeX math syntax (such as \\eta, \\frac, \\times, \\%, \\approx, \\cdot, \\Delta, \\theta, etc.).
- Use clean, standard, human-readable plain text formatting:
  - Write percentage as % (never \\%).
  - Use / for division (e.g. a / b).
  - Use * or x for multiplication.
  - Use standard text Greek names (like eta, theta, pi, delta) instead of LaTeX markup.
  - Use standard ^ for exponents (e.g. t^2).

CRITICAL RULE: DO NOT restate the question text as your explanation! You must provide a genuine step-by-step mathematical or logical solution.

1. State what concept/formula the question is testing.
2. Show the full step-by-step solution using actual numbers from the question — every calculation step, not just the final answer.
3. Point out specifically where the student's approach likely went wrong (use their selected wrong option {student_answer} to guess the likely mistake — e.g. if they picked a choice matching a common sign error or wrong formula, name that specific error).
4. End with a 1-sentence tip on how to avoid this mistake next time.

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

    async def _call_gemini_json_async(self, prompt: str) -> dict:
        """Helper to call Gemini asynchronously and ensure JSON response."""
        try:
            response = await self.model.generate_content_async(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini Async API error: {e}")
            raise e

    async def get_combined_feedback_async(self, question_text: str, options: list, correct_answer: str, student_answer: str) -> dict:
        """Calls Gemini once asynchronously to grade, audit, and generate Socratic hints."""
        prompt = f"""
You are an expert JEE/NEET tutor and Socratic teacher. Analyze this student's response.
Question: {question_text}
Options: {options}
Correct Option: {correct_answer}
Student Option: {student_answer}

Provide:
1. AI Score details: A highly detailed step-by-step reasoning explaining why the student is right or wrong, and how to solve the question. Categorize the mistake as "conceptual" (misunderstood core formula/principle), "computational" (made a basic arithmetic/algebra error but set it up right), or "none" (if correct).
2. AI Audit check: Determine if the student's selected option is correct. Return a score of 1 (if correct) or 0 (if incorrect).
3. Socratic Feedback: Exactly 3 progressive hints leading to the solution without giving away the direct answer, plus the final worked-out mathematical or logical derivation explaining the solution.

CRITICAL INSTRUCTIONS FOR EXPLANATIONS (to be written in both "reasoning" and "final_explanation"):
Never restate the question back as the explanation. Follow these strict templates:

MATH FORMATTING RULES:
- DO NOT use LaTeX formatting or LaTeX math syntax (such as \\eta, \\frac, \\times, \\%, \\approx, \\cdot, \\Delta, \\theta, etc.).
- Use clean, standard, human-readable plain text formatting:
  - Write percentage as % (never \\%).
  - Use / for division (e.g. a / b).
  - Use * or x for multiplication.
  - Use standard text Greek names (like eta, theta, pi, delta) instead of LaTeX markup.
  - Use standard ^ for exponents (e.g. t^2).

CRITICAL RULE: DO NOT restate the question text as your explanation! You must provide a genuine step-by-step mathematical or logical solution.

IF THE STUDENT IS INCORRECT (student_answer != correct_answer):
The "reasoning" and "final_explanation" fields MUST contain:
1. State what concept/formula the question is testing.
2. Show the full step-by-step solution using actual numbers from the question — every calculation step, not just the final answer.
3. Point out specifically where the student's approach likely went wrong (use their selected wrong option {student_answer} to guess the likely mistake — e.g. if they picked a choice matching a common sign error or wrong formula, name that specific error).
4. End with a 1-sentence tip on how to avoid this mistake next time.

IF THE STUDENT IS CORRECT (student_answer == correct_answer):
The "reasoning" and "final_explanation" fields MUST contain:
1. Briefly state the core concept.
2. Provide the full step-by-step solution (showing actual calculations, not just 'plug it in').
3. End with a 1-sentence tip on a faster shortcut or alternative way to solve it (if applicable) or a reinforcing comment.

Your response must be strictly in JSON format matching this schema:
{{
  "ai_score_details": {{
    "reasoning": "Detailed step-by-step explanation matching the above instructions.",
    "mistake_type": "conceptual" | "computational" | "none"
  }},
  "ai_audit_details": {{
    "score": 1 | 0
  }},
  "socratic_feedback": {{
    "hint1": "Hint 1 text",
    "hint2": "Hint 2 text",
    "hint3": "Hint 3 text",
    "final_explanation": "Detailed step-by-step worked explanation matching the above instructions."
  }}
}}
"""
        try:
            res = await self._call_gemini_json_async(prompt)
            # Ensure safe fallback formatting on elements if API returned partial/weird output
            if not isinstance(res.get("ai_score_details"), dict):
                res["ai_score_details"] = {"reasoning": "Detailed assessment completed.", "mistake_type": "conceptual"}
            if not isinstance(res.get("ai_audit_details"), dict):
                res["ai_audit_details"] = {"score": 0}
            if not isinstance(res.get("socratic_feedback"), dict):
                res["socratic_feedback"] = {
                    "hint1": "Reread the question and write down the given values.",
                    "hint2": "Recall the fundamental formula relating these quantities.",
                    "hint3": "Apply the values to the formula and check the options.",
                    "final_explanation": f"The correct option is {correct_answer}."
                }
            return res
        except Exception:
            is_correct = (student_answer == correct_answer)
            return {
                "ai_score_details": {
                    "reasoning": f"Student answered {student_answer}. The correct answer is {correct_answer}.",
                    "mistake_type": "none" if is_correct else "conceptual"
                },
                "ai_audit_details": {
                    "score": 1 if is_correct else 0
                },
                "socratic_feedback": {
                    "hint1": "Reread the question and write down the given values.",
                    "hint2": "Recall the fundamental formula relating these quantities.",
                    "hint3": "Apply the values to the formula and check the options.",
                    "final_explanation": f"The correct option is {correct_answer}. Verify the calculation using basic principles."
                }
            }

gemini_client = GeminiClient()
