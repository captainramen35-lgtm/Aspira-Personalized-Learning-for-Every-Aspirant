import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env explicitly
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "aspira-app-f5ff4")
    FIREBASE_CREDENTIALS_PATH: str = os.getenv(
        "FIREBASE_CREDENTIALS_PATH", 
        "/Users/muskanyeshminali/muskan personal/aspira/aspira-app-f5ff4-firebase-adminsdk-fbsvc-e5a26763c3.json"
    )

settings = Settings()
