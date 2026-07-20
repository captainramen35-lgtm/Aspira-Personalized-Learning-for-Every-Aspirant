"""
Aspira Admin Seeding Script
============================
Run this ONCE to create the first admin account in Firebase + Firestore.
After running, the admin can log in and start registering teachers.

Usage:
    python seed_admin.py

Requirements:
    - backend/.env must have FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON set
    - Run from the project root: cd /path/to/aspira && python seed_admin.py
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load env
from dotenv import load_dotenv
load_dotenv("backend/.env")

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore
import json

# ─── CONFIG — Edit these before running ───────────────────────────────────────
ADMIN_EMAIL = "admin@aspira.edu"
ADMIN_PASSWORD = "Admin@123456"  # Change this after first login!
ADMIN_NAME = "Aspira Administrator"
# ──────────────────────────────────────────────────────────────────────────────

def main():
    # Initialize Firebase Admin
    creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    creds_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

    if creds_json:
        cred = credentials.Certificate(json.loads(creds_json))
    elif creds_path:
        cred = credentials.Certificate(creds_path)
    else:
        print("ERROR: No Firebase credentials found in environment.")
        sys.exit(1)

    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

    db = firestore.client()

    print(f"\n🔧 Seeding admin account: {ADMIN_EMAIL}")

    # Check if admin already exists
    existing = list(db.collection("users").where("role", "==", "admin").stream())
    if existing:
        print("⚠️  An admin account already exists:")
        for doc in existing:
            data = doc.to_dict()
            print(f"   → {data.get('email')} (uid: {doc.id})")
        print("\nIf you need to reset the admin account, manually delete it in Firebase console first.")
        return

    # Create Firebase Auth user
    try:
        firebase_user = firebase_auth.create_user(
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            display_name=ADMIN_NAME,
            email_verified=True
        )
        uid = firebase_user.uid
        print(f"✅ Firebase Auth user created: {uid}")
    except firebase_auth.EmailAlreadyExistsError:
        # Get existing user
        firebase_user = firebase_auth.get_user_by_email(ADMIN_EMAIL)
        uid = firebase_user.uid
        print(f"ℹ️  Firebase Auth user already exists: {uid}")

    # Create Firestore document
    db.collection("users").document(uid).set({
        "uid": uid,
        "name": ADMIN_NAME,
        "email": ADMIN_EMAIL,
        "role": "admin",
        "status": "active",
        "joined_date": "July 2026",
    })
    print(f"✅ Firestore users/{uid} created with role=admin")

    print(f"""
╔══════════════════════════════════════════════════════════╗
║           ✅ ADMIN ACCOUNT SEEDED SUCCESSFULLY           ║
╠══════════════════════════════════════════════════════════╣
║  Email:    {ADMIN_EMAIL:<46} ║
║  Password: {ADMIN_PASSWORD:<46} ║
╚══════════════════════════════════════════════════════════╝

⚠️  IMPORTANT: Log in and change this password immediately.
   Admin panel: http://localhost:5173/admin
""")

if __name__ == "__main__":
    main()
