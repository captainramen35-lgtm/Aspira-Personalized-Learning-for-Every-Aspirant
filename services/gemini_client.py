# TODO: Initialize Gemini client using GEMINI_API_KEY from .env

import os
from dotenv import load_dotenv

load_dotenv()


def call_gemini(prompt: str) -> str:
    """
    Call the Gemini API with the given prompt.

    Args:
        prompt: The text prompt to send to Gemini.

    Returns:
        The response string from Gemini.
    """
    api_key = os.getenv("GEMINI_API_KEY")

    # TODO: Initialize the Gemini client with api_key and make the actual API call
    # Example (to be implemented):
    #   import google.generativeai as genai
    #   genai.configure(api_key=api_key)
    #   model = genai.GenerativeModel("gemini-pro")
    #   response = model.generate_content(prompt)
    #   return response.text

    return "Gemini response - TODO"
