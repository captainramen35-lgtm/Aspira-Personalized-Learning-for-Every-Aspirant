> If you are an AI agent:
> Read this file completely before changing code.
> Never assume project structure.
> Verify everything against actual files.
> Do not rename files unless instructed.
> Run the project's build/tests after changes.
> Update this BRAIN.md whenever architecture or features change.
> Report what you changed, what you skipped, and why.

# 🎓 Aspira — Project Knowledge Base (BRAIN)

## 1. Project Overview
- **Project Name:** Aspira
- **Purpose:** An intelligent, personalized test-preparation and assessment platform designed for JEE and NEET aspirants in India.
- **Problem it solves:** Standardized testing provides "one-size-fits-all" question papers, flat binary (correct/incorrect) feedback, and lacks memory of a student's historical weaknesses. Aspira uses AI to generate customized papers targeting weak areas and provides Socratic hints instead of direct answers.
- **Target users:** Students preparing for JEE (PCM) and NEET (PCB), and Teachers managing batches of students.
- **Current development status:** Deployed prototype with active role-based routing, full mastery tracking, concurrent AI grading, and batch management workflows.
- **Major features:** Diagnostic testing, dynamic personalized test generation (60/40 weak/strong ratio), Socratic AI feedback pipeline, AI-generated study plans, Teacher command center (batch management, analytics).
- **Future roadmap:** Unknown - requires investigation.

---

## 2. Tech Stack
- **Frontend:** React 19 (Vite build system)
- **Backend:** Python FastAPI (Uvicorn server)
- **Database:** Firebase Cloud Firestore (NoSQL)
- **Authentication:** Firebase Auth
- **AI/LLM:** Google Generative AI (Gemini)
- **APIs:** RESTful endpoints provided by FastAPI, called via Axios on the frontend.
- **Deployment:** Vercel (Frontend), Render (Backend)
- **Styling:** Tailwind CSS v4, Lucide React (Icons)
- **State management:** React Context API (`AuthContext`), React Hooks (`useState`, `useEffect`)
- **Testing:** Unknown – no formal testing suites (Jest/PyTest) found.

---

## 3. How to Run

### Required Software
- Node.js (v18+)
- Python 3.11+
- A Firebase Project (with Firestore and Auth enabled)
- A Google Gemini API Key

### Environment Variables
**Frontend (`frontend/.env`)**
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_BACKEND_URL=http://localhost:8000
```

**Backend (`backend/.env`)**
```env
GEMINI_API_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_CREDENTIALS_PATH=/absolute/path/to/firebase-adminsdk.json
```

### Installation & Development Commands
**Backend:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python backend/main.py
# Or run with Uvicorn: python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Vite dev server runs on port 5173
```

### Production Build (Frontend)
```bash
cd frontend
npm run build
```

---

## 4. Complete Project Structure

```text
aspira/
├── backend/                  # Python FastAPI Backend
│   ├── .env                  # Backend environment secrets
│   ├── config.py             # Loads environment variables via dotenv
│   ├── main.py               # FastAPI application entry point, mounts all routers
│   ├── requirements.txt      # Python dependencies
│   ├── firebase_admin_init.py# Initializes the Firebase Admin SDK
│   ├── seed_data.py          # Script to populate Firestore with dummy cohorts
│   ├── patch_*.py            # Various scripts used to patch/modify database schema historically
│   ├── routers/              # FastAPI Route Controllers
│   │   ├── auth.py           # User creation, onboarding surveys, roles
│   │   ├── batches.py        # Teacher batch CRUD, archiving, bulk-reassignment
│   │   ├── diagnostic.py     # Generates the baseline diagnostic test
│   │   ├── enrollment.py     # Student enrollment requests and Teacher approvals/rejections
│   │   ├── mastery.py        # Retrieves and manipulates student mastery profiles
│   │   ├── paper.py          # Generates dynamic personalized practice papers
│   │   ├── reflection.py     # Socratic 3-stage hint progression endpoints
│   │   ├── study_plan.py     # Generates AI study plans based on mastery
│   │   ├── submit.py         # Test grading pipeline (Scorer + Auditor)
│   │   ├── teacher.py        # Class Pulse metrics, aggregating class data
│   │   ├── teacher_onboarding.py
│   │   └── admin.py          # Admin endpoints (e.g. promoting teachers)
│   ├── services/             # Core Business and AI Logic
│   │   ├── gemini_client.py  # Interacts with Gemini API (grading, reflections, study plans)
│   │   ├── mastery_calculator.py # Math for calculating rolling averages and accuracy trends
│   │   ├── personalization_engine.py # Core algorithm (60% weak / 40% strong topic generation)
│   │   └── question_bank_loader.py # Loads questions dynamically
│   └── models/               # Pydantic Schemas
│       └── schemas.py        # Data validation schemas for requests/responses
└── frontend/                 # React Vite Frontend
    ├── package.json          # Node dependencies
    ├── vite.config.js        # Vite configuration
    ├── src/
    │   ├── main.jsx          # React DOM render entry point
    │   ├── App.jsx           # Main routing table (React Router)
    │   ├── index.css         # Tailwind base CSS and custom theme variables
    │   ├── api.js            # Axios interceptor for appending Firebase Auth tokens
    │   ├── firebase.js       # Firebase Client SDK initialization
    │   ├── context/
    │   │   └── AuthContext.jsx # Global context for user profile, authentication, and token management
    │   ├── components/       # Reusable UI components
    │   │   ├── RoleGuard.jsx # Critical security component wrapping routes by role/onboarding status
    │   │   ├── Navbar.jsx    # Top navigation
    │   │   ├── HintReveal.jsx# Socratic hint UI component
    │   │   ├── QuestionCard.jsx # Renders test questions
    │   │   ├── StudentTable.jsx # Renders tables for teacher dashboard
    │   │   └── TopicBar.jsx  # Renders progress bars for mastery
    │   └── pages/            # Full Route Pages
    │       ├── Login.jsx, Register.jsx # Auth pages
    │       ├── OnboardingSurvey.jsx # Strict onboarding form to gather target_exam and learning styles
    │       ├── BatchSelection.jsx # Students pick a batch to enroll in
    │       ├── EnrollmentStatus.jsx # Displays pending/rejected enrollment state
    │       ├── StudentDashboard.jsx # Student hub (Start tests, view mastery, study plans)
    │       ├── TeacherDashboard.jsx # Teacher command center (Pulse, Batches, Requests)
    │       ├── DiagnosticTest.jsx, TestPage.jsx # Test taking interfaces
    │       ├── ResultPage.jsx # Post-test score report and AI reasoning
    │       ├── Feedback.jsx # Detailed question-by-question review with Socratic hints
    │       ├── MasteryProfile.jsx # Detailed student mastery breakdown
    │       ├── StudyPlan.jsx # AI generated action plan view
    │       ├── TeacherOnboarding.jsx # Teacher initial setup
    │       └── AdminDashboard.jsx # Platform admin overview
```

---

## 5. Architecture

- **Frontend Architecture:** React Single Page Application (SPA). Uses `react-router-dom` for client-side routing. Routes are heavily protected using a `RoleGuard` component that checks Firebase Auth state, Custom Firestore Roles (`student`, `teacher`, `admin`), and Onboarding Status (`requireSurveyComplete`).
- **Backend Architecture:** FastAPI microservice. Highly modularized using `APIRouter`. Uses Pydantic for request validation.
- **Data Flow:** Frontend `axios` requests include a Firebase Bearer token -> FastAPI `get_current_user` dependency verifies token using Firebase Admin SDK -> FastAPI fetches/updates Firestore -> FastAPI returns JSON -> React updates UI.
- **Authentication Flow:** User logs in via Firebase Client SDK -> Firebase provides an ID token -> Token is passed to `AuthContext` and attached to `api.js` Axios interceptor -> Backend verifies token -> Backend fetches custom profile from `users` Firestore collection -> Frontend redirects based on profile state.
- **API Flow:** RESTful JSON APIs.
- **AI Flow:** Concurrent AI execution. When a test is submitted, `gemini_client.py` uses `asyncio.gather` to concurrently evaluate every question. It utilizes a Dual-Agent system: a "Primary Scorer" grades the question, and an "Auditor" reviews the grade to prevent hallucinations. Socratic hints and study plans are also generated via targeted prompt chains.
- **State Management:** Light. Global user state in `AuthContext`. Page-level state using `useState`. No Redux/Zustand.

---

## 6. Features

| Feature | Purpose | Files |
|---------|---------|-------|
| **Diagnostic Test** | Determines baseline student mastery using an initial fixed test. | `DiagnosticTest.jsx`, `diagnostic.py` |
| **Personalized Tests** | Generates dynamic 10-question tests (60% weak topics, 40% strong topics) based on historical performance. | `TestPage.jsx`, `paper.py`, `personalization_engine.py` |
| **AI Concurrent Grading** | Grades subjective and objective mistakes rapidly, returning detailed mathematical reasoning for every question. | `ResultPage.jsx`, `submit.py`, `gemini_client.py` |
| **Socratic Reflections** | Replaces direct answers with a 3-stage hint system to guide students to the correct logic on questions they got wrong. | `Feedback.jsx`, `HintReveal.jsx`, `reflection.py` |
| **AI Study Plans** | Actionable daily routines generated by Gemini based on the student's mastery profile. | `StudyPlan.jsx`, `study_plan.py` |
| **Batch Management** | Teachers can create batches, archive them, and bulk-reassign students between batches. | `TeacherDashboard.jsx`, `batches.py` |
| **Onboarding Enforcement** | Hard-gates students from accessing the app until they complete a survey detailing their target exam (JEE/NEET). | `OnboardingSurvey.jsx`, `RoleGuard.jsx`, `App.jsx`, `auth.py` |
| **Class Pulse Analytics** | Aggregates mastery data for all students in a teacher's batch to identify class-wide conceptual gaps. | `TeacherDashboard.jsx`, `teacher.py` |

---

## 7. Database Schema

*All collections reside in Firebase Cloud Firestore.*

- **`users`**: Contains extended profile data.
  - `uid` (String, matches Firebase Auth UID)
  - `email`, `name`, `role` (student/teacher/admin)
  - `status` (active, pending_survey, incomplete_profile_rejected, pending_approval)
  - `assigned_batch_id` (String)
  - `target_exam` (JEE/NEET)

- **`mastery_profiles`**: Tracks topic-wise performance.
  - `student_id` (String)
  - `tests_completed` (Int)
  - `mastery` (Map/Dict) -> Keys are Chapters (e.g., "Calculus", "Mechanics"). Values are Maps containing: `accuracy` (Float), `attempts` (Int), `avg_time_sec` (Float), `trend` (String: improving/stable/declining).

- **`batches`**: Teacher cohorts.
  - `batch_id`, `name`, `teacher_id`, `target_exam`, `capacity`, `current_count`, `status` (active/archived), `syllabus_notes`.

- **`enrollment_requests`**: Connects students to batches.
  - `request_id`, `student_id`, `batch_id`, `status` (pending/approved/rejected), `student_name`, `survey_snapshot`.

- **`submissions`**: Logs of completed tests.
  - `submission_id`, `student_id`, `test_type`, `score`, `results` (Array of question result maps with `is_correct`, `time_spent`, and `ai_score_details`).

- **`study_plans`**: Stored AI routines.
  - `student_id`, `plan_data` (JSON array of actionable steps), `generated_at`.

- **`reflections`**: Socratic chat states.
  - Tracks the progression of hints unlocked for a specific question in a specific submission.

- **`questions`**: Question Bank (if stored dynamically).

---

## 8. API Documentation

| Route Prefix | Endpoints & Methods | Purpose |
|--------------|---------------------|---------|
| `/api/auth` | `GET /profile`, `POST /onboarding-survey`, `GET /onboarding-survey` | Manages user custom claims and onboarding state. |
| `/api/batches` | `GET /`, `POST /`, `PATCH /{id}`, `PATCH /{id}/archive`, `POST /{id}/bulk-reassign` | Batch CRUD and roster organization for teachers. |
| `/api/enrollment`| `POST /request`, `GET /status`, `GET /pending`, `POST /approve`, `POST /reject` | Manages the student application lifecycle. |
| `/api/diagnostic`| `GET /generate` | Fetches the baseline starting exam. |
| `/api/paper` | `GET /generate` | Algorithmically generates the 60/40 personalized test. |
| `/api/submit` | `POST /` | Submits test answers for concurrent AI evaluation. |
| `/api/mastery` | `GET /`, `GET /{student_id}` | Fetches mastery profiles for charts and pulse dashboards. |
| `/api/study-plan`| `GET /`, `POST /generate` | Retrieves or forces regeneration of an AI study plan. |
| `/api/reflection`| `GET /submission/{sub_id}`, `POST /unlock-hint` | Manages the 3-stage hint system on feedback pages. |
| `/api/teacher` | `GET /class-pulse` | Aggregates all student profiles assigned to a teacher. |

---

## 9. Components

- **`App.jsx`**: The root router. Heavily utilizes `RoleGuard` to wrap pages and control layout structures. Evaluates user `status` and `role` to redirect safely (e.g. kicking unapproved students to `/enrollment-status`).
- **`RoleGuard.jsx`**: An HOC (Higher Order Component) that checks `allowedRoles`, `requireSurveyComplete`, and `requireBatchAssigned`. It prevents route hijacking.
- **`AuthContext.jsx`**: Provides `user`, `userProfile`, `loading`, `login()`, `logout()`, `getToken()`, and `refreshProfile()` globally.
- **`TeacherDashboard.jsx`**: A massive command center with 3 tabs: Class Pulse (analytics), Batch Management (CRUD/Archive), Enrollment Requests (Approvals/Rejections).
- **`OnboardingSurvey.jsx`**: A multi-step form collecting `target_exam`, `weak_topics`, and `learning_style`. Will show a red rejection banner if the student's profile was marked as incomplete by a teacher.

---

## 10. Configuration

- **Environment Variables**: Managed via `.env` files (excluded from Git).
- **Tailwind**: Configured via Vite plugin (v4 styling). Theme colors (`brand-bg-dark`, `brand-accent`) are defined in `index.css`.
- **Firebase**: Frontend uses `firebase/app` and `firebase/auth`. Backend uses `firebase_admin` initialized via a service account JSON file.
- **Vite**: Vanilla config using `@vitejs/plugin-react`.
- **Linter**: Oxlint is configured in `package.json`.

---

## 11. Dependencies

- **`fastapi` / `uvicorn`**: Core backend web framework.
- **`firebase-admin`**: Grants the backend full access to Firestore.
- **`google-generativeai`**: Official Google Gemini SDK for AI grading and study plan generation.
- **`react` / `react-dom`**: Frontend UI framework.
- **`react-router-dom`**: Frontend navigation.
- **`axios`**: HTTP client for API requests.
- **`chart.js` / `react-chartjs-2`**: Used heavily in `TeacherDashboard.jsx` and `MasteryProfile.jsx` to render analytical graphs.
- **`lucide-react`**: Standardized iconography across the app.

---

## 12. Coding Conventions

- **Component Naming:** PascalCase for React components (e.g., `TeacherDashboard.jsx`).
- **Python Naming:** snake_case for routes, functions, and variables (e.g., `list_batches`, `study_plan.py`).
- **API Style:** RESTful structure. Backend routes are mounted in `main.py` using prefixes (e.g. `/api/batches`).
- **Async Style:** 
  - Frontend uses `async/await` heavily inside `useEffect` with standard `try/catch/finally` blocks for loading states.
  - Backend heavily uses `async def` and concurrent processing via `asyncio.gather`.
- **Styling Approach:** Tailwind utility classes directly in JSX. Custom variables mapped in `index.css`.
- **Error Handling:** Backend throws `HTTPException`. Frontend catches `err.response?.data?.detail`.

---

## 13. Known Issues

### Technical Debt
- **Pagination**: Firestore queries (like `.stream()`) currently pull all documents without limit/offset pagination, which will scale poorly with large cohorts.
- **CORS Configuration**: `allow_origins=["*"]` in `main.py` needs to be restricted for production security.

### Bugs
- Unknown – currently documented logic functions correctly.

---

## 14. Development History

- **Phase 1:** Setup of Firebase Auth and basic routing.
- **Phase 2:** Diagnostic testing, Gemini API integration (Scorer/Auditor architecture), and Mastery calculations.
- **Phase 3:** Socratic feedback generation and 60/40 Personalized Test algorithms.
- **Phase 4:** Teacher Dashboard analytics, Batch Archiving, Bulk Student Reassignment, and Strict Onboarding Enforcement for rejected profiles.

---

## 15. Testing

- Existing Tests: Unknown – requires investigation. No dedicated `/tests` directories were found in the root, backend, or frontend structures.
- How to test: Manual UI verification and running the backend/frontend development servers.

---

## 16. Deployment

- **Frontend Hosting:** Vercel. Connected to the GitHub repository. Triggers automatic builds on `main` branch pushes. Build command: `npm run build`.
- **Backend Hosting:** Render. Connected to the GitHub repository. Requires setting the `GEMINI_API_KEY` and Firebase Admin SDK variables in the Render Environment Secrets dashboard.

---

## 17. AI Context

The platform heavily relies on Google Gemini (via `google-generativeai`).
- **Dual-Agent Architecture:** Test submissions are graded by a primary prompt chain. The result is then passed to a secondary "Auditor" prompt chain that verifies the grade to minimize AI hallucinations.
- **Socratic Generation:** Prompts in `reflection.py` are strictly instructed *not* to provide direct answers, but to generate logical "Hints".
- **Study Plans:** Mastery profiles are dumped as JSON context into the Gemini context window in `study_plan.py` to generate markdown-based actionable schedules.

---

## 18. Important Decisions

- **Firestore vs. SQL:** Opted for NoSQL (Firestore) to allow flexible mastery profile schemas (Map structures) that can adapt if new subjects or chapters are added dynamically.
- **React Context vs. Redux:** Opted for Context API for authentication since state complexity is primarily isolated to specific pages, avoiding Redux boilerplate.
- **Socratic Grading:** Decision to block students from seeing immediate solutions to prevent passive learning.

---

## 19. Future Ideas

- Implement WebSockets or Firebase real-time listeners on the Teacher Dashboard so Class Pulse updates instantly as students submit tests, removing the need for manual page refreshes.
- Add Admin tools to manually edit question banks from the frontend UI.
