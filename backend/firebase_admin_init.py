import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json
from backend.config import settings

# Initialize Firebase Admin SDK if not already initialized
if not firebase_admin._apps:
    firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if firebase_creds_json:
        # Load credentials directly from the raw JSON string (used in Render deployment)
        try:
            creds_dict = json.loads(firebase_creds_json)
            cred = credentials.Certificate(creds_dict)
            print("Firebase Admin SDK successfully initialized using FIREBASE_CREDENTIALS_JSON.")
        except Exception as e:
            print(f"Failed to parse FIREBASE_CREDENTIALS_JSON: {e}. Falling back to file path.")
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
    else:
        # Fallback to local development file path
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        
    firebase_admin.initialize_app(cred)

db = firestore.client()
