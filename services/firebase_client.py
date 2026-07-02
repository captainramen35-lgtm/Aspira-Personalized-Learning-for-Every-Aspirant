# TODO: Initialize Firebase Admin SDK using service account credentials from .env

import os
from dotenv import load_dotenv

load_dotenv()


def get_firestore_client():
    """
    Initialize and return a Firestore client.

    Returns:
        A Firestore client instance, or None if not yet initialized.
    """
    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

    # TODO: Initialize firebase_admin with the service account credentials and return the Firestore client
    # Example (to be implemented):
    #   import firebase_admin
    #   from firebase_admin import credentials, firestore
    #   if not firebase_admin._apps:
    #       cred = credentials.Certificate(credentials_path)
    #       firebase_admin.initialize_app(cred)
    #   return firestore.client()

    print("Firebase not initialized yet - TODO")
    return None
