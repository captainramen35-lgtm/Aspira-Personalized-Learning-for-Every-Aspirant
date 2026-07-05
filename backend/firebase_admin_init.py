import firebase_admin
from firebase_admin import credentials, firestore, auth
from backend.config import settings

# Initialize Firebase Admin SDK if not already initialized
if not firebase_admin._apps:
    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()
