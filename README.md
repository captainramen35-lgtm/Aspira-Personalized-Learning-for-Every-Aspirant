# 🎓 Aspira — AI-Powered Personalized Assessment Platform for JEE/NEET

**Aspira** is an intelligent, personalized test-preparation and assessment platform designed specifically for JEE and NEET aspirants in India. Built for hackathons and competitive learning environments, Aspira replaces the traditional "one-size-fits-all" test model with dynamic, data-driven mastery tracking and interactive Socratic guidance.

---

## 🚨 The Problem
Every student preparing for highly competitive exams like JEE/NEET has a unique learning curve, yet:
* **Static Question Papers**: All students receive the exact same test, regardless of their strengths or weaknesses.
* **Flat Binary Feedback**: Test reviews only display "Correct/Incorrect" answers, leaving students confused about *why* they made a mistake.
* **Lack of Historical Analytics**: Standard test platforms do not retain a memory of a student's weaknesses over time to adapt future practice sessions.
* **Blind Cohort Tracking**: Teachers are forced to manually audit hundreds of exams to identify class-wide conceptual gaps.

---

## ✨ Our Solution
**Aspira** fixes this by building a continuous loop of diagnostics, personalization, and interactive learning:
1. **Dynamic Mastery Profile**: Every student starts with an 8-topic diagnostic test to map out their baseline accuracy, speed, and conceptual trends.
2. **Personalized Test Engine**: Practice papers are automatically compiled using a strict **60/40 rule** — 60% of the questions target their weak topics (accuracy < 50%), and 40% reinforce strong topics, avoiding question repetition.
3. **Double-Verification AI Scorer & Auditor**: Correctness is verified using a FastAPI backend backed by **Google Gemini**. A primary scorer assesses mistakes, and an independent auditor double-checks the grade to catch grading errors.
4. **Socratic Hint System & Study Plans**: Instead of showing the full solution instantly, incorrect questions offer a progressive **3-stage hint system** to guide students to the answer without robbing them of the "aha!" moment. AI also generates actionable daily study plans based on the student's mastery profile.
5. **Class Pulse Teacher Dashboard**: A dual-pane command center mapping student rosters, tracking topic-wise average mastery, highlighting students at risk of falling behind, and aggregating AI-summarized recurring mistake patterns.

---

## 🆕 New Features & Recent Updates
* **Role-Based Workflows**: Segregated dashboards for Students, Teachers, and Admins. Custom intelligent `IndexRoute` handling redirects.
* **Enrollment & Batches**: Teachers can manage distinct batches (e.g., Target JEE 2026, Target NEET 2026) and archive them. Students seamlessly view and enroll in all active batches dynamically during onboarding.
* **Dynamic Onboarding Survey**: Dynamically loads chapter options depending on whether the student is targeting JEE (PCM) or NEET (PCB).
* **Socratic AI Study Plans**: A fully dedicated Study Plan generator that uses the student's active mastery profile to create specific, actionable focus areas.
* **Concurrent Gemini AI Grading**: Test grading speed has been optimized heavily (< 3 seconds) using concurrent asynchronous calls.
* **Detailed Step-by-Step AI Solutions**: AI now provides explicit mathematical breakdowns for *every* question (both correct and incorrect) on all tests (Diagnostic + Personalized) without restating the prompt, ensuring rich actionable feedback.
* **Teacher Dashboard Analytics**: Improved Teacher Dashboard with batch filtering, deduplicated student rosters, and robust batch archive/unarchive capabilities.
* **Bulk Reassignment & Batch Archiving**: Teachers can safely archive completed batches and bulk-reassign active students to new batches to keep their class rosters clean.
* **Enrollment Profile Rejection**: Teachers can reject enrollment requests specifically due to incomplete profiles, instantly routing students back to their onboarding survey to provide the missing learning style or goals data.
* **Strict Onboarding Enforcement**: Hard-gated routes using an advanced `RoleGuard` prevent students from accessing the app until their diagnostic profile and goals survey are fully completed.
* **Chapter-Level Topic Grouping**: Mastery tracking and feedback generation have been upgraded to group subjects into logical chapters (e.g. "Mechanics", "Calculus") for more coherent learning analytics.

---

## 👥 Aspira – Final Team Role Assignment

### 👩💻 1. Muskan Yeshmin Ali
**Tech Lead • Backend Architect • DevOps**
* **Responsibilities**:
  * Project architecture & repository structure
  * GitHub repository management (branches, PR reviews, merge approvals)
  * FastAPI backend setup (all routers)
  * Gemini API integration — Scorer + Auditor logic
  * Disagreement-handling rules (Scorer vs. Auditor)
  * Firebase project configuration (Firestore + Authentication)
  * Final integration of frontend ↔ backend communication
  * Deployment configurations (Render for backend, Vercel for frontend)
  * Resolving merge conflicts, final demo build
* **Deliverables**:
  * Working FastAPI backend & router endpoints
  * Scorer + Auditor verification pipeline
  * Firebase Web SDK/Admin SDK configuration
  * Deployed live staging environment

---

### 👩 2. Sakshi Jha (Leader)
**Project Lead • Personalization Logic • Demo Owner**
* **Responsibilities**:
  * Overall project coordination, timeline tracking, and blocker resolution
  * Mastery Profile schema design (Firestore document structures)
  * Personalized Paper Generation logic (60% weak / 40% strong weighting rules)
  * Diagnostic Test scoring and profile initialization parameters
  * Demo storytelling — choreographing the presentation and judging flows
  * Cross-team liaison ensuring seamless API integrations
* **Deliverables**:
  * Personalization engine algorithms
  * Mastery Profile database schemas
  * Diagnostic grading policies
  * Demo script & presenter guidelines

---

### 💻 3. Piyush Jha
**Frontend Developer — Student Flow**
* **Responsibilities**:
  * Diagnostic test interactive interface
  * Personalized test-taking screens with dynamic timer & progress bars
  * Socratic feedback page containing the progressive hint unlock system
  * Dark-themed authentication (login, registration, and role selection) screens
  * Frontend API integration for all student-facing endpoints
  * Mobile-first responsive UI styling
* **Deliverables**:
  * Student-facing client modules
  * Firebase Authentication hooks
  * Question, timer, and Socratic hint interfaces

---

### 🧠 4. Soham Bishnu
**Frontend + Data/QA Engineer — Teacher Side**
* **Responsibilities**:
  * Teacher dashboard interfaces utilizing Tailwind CSS and Chart.js
  * Cohort analytics panels mapping average mastery, risk statuses, and mistake frequencies
  * Seeding high-fidelity mockup data (5-10 fake students with historical tests) for live judging
  * End-to-end testing of full student/teacher user journeys
  * QA bug-fixing and edge-case handling (tolerances, empty states, loader spinners)
* **Deliverables**:
  * Class analytics panel with interactive mastery bar and pie charts
  * Cohort database seeding scripts
  * QA validation report & user journey walkthroughs

---

## 🛠️ Technology Stack
* **Frontend**: React (Vite), Tailwind CSS v4, Lucide React, Chart.js, Axios, Firebase Client SDK.
* **Backend**: FastAPI, Uvicorn, Firebase Admin SDK, Google Generative AI (Gemini).
* **Database & Auth**: Google Firebase Auth & Cloud Firestore.
* **Version Control**: Git & GitHub.

---

## 🚀 Setup & Execution Guide

### 1. Prerequisite Environments
Create a `.env` file in both the `frontend/` and `backend/` directories. You can copy the provided `.env.example` templates to start:

**Frontend (`frontend/.env`):**
```env
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID
VITE_BACKEND_URL=http://localhost:8000
```

**Backend (`backend/.env`):**
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
FIREBASE_CREDENTIALS_PATH=/absolute/path/to/firebase-adminsdk-private-key.json
```

---

### 2. Launch the Backend Server
```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. .venv/bin/python backend/main.py
```
*The server will boot on `http://localhost:8000`*

---

### 3. Launch the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*The React app will open on `http://localhost:5173/`*

---

### 4. Database Seeding (Optional)
To populate the dashboard with 7 demo student accounts (including history and mistake logs):
```bash
cd backend
.venv/bin/python seed_data.py
```
*Demo Login credentials:*
* **Teacher**: `teacher@aspira.com` (password: `password123`)
* **Student (Struggling)**: `rohan@aspira.com` (password: `password123`)
* **Student (High Performer)**: `sneha@aspira.com` (password: `password123`)
