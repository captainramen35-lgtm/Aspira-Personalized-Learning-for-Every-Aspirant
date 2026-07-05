import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "aspira-app-f5ff4")
    FIREBASE_CREDENTIALS_PATH: str = os.getenv(
        "FIREBASE_CREDENTIALS_PATH", 
        "/Users/muskanyeshminali/muskan personal/aspira/aspira-app-f5ff4-firebase-adminsdk-fbsvc-e5a26763c3.json"
    )

settings = Settings()
