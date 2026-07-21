import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RoleGuard from "./components/RoleGuard";

// Existing pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DiagnosticTest from "./pages/DiagnosticTest";
import TestPage from "./pages/TestPage";
import ResultPage from "./pages/ResultPage";
import MasteryProfile from "./pages/MasteryProfile";
import TeacherDashboard from "./pages/TeacherDashboard";
import Feedback from "./pages/Feedback";

// Phase 1 — new pages
import OnboardingSurvey from "./pages/OnboardingSurvey";
import BatchSelection from "./pages/BatchSelection";
import EnrollmentStatus from "./pages/EnrollmentStatus";
import TeacherOnboarding from "./pages/TeacherOnboarding";
import AdminDashboard from "./pages/AdminDashboard";

// Phase 4 — new pages
import StudentDashboard from "./pages/StudentDashboard";
import StudyPlan from "./pages/StudyPlan";

function IndexRoute() {
  const { currentUser, userProfile } = useAuth();
  
  if (currentUser && userProfile) {
    if (userProfile.role === "student" && userProfile.status === "active") {
      return <Navigate to="/dashboard" replace />;
    }
    if (userProfile.role === "teacher") {
      return <Navigate to="/teacher" replace />;
    }
    if (userProfile.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (userProfile.role === "student" && userProfile.status !== "active") {
      if (!userProfile.target_exam || userProfile.status === "incomplete_profile_rejected" || userProfile.status === "pending_survey") {
        return <Navigate to="/onboarding-survey" replace />;
      }
      if (!userProfile.assigned_batch_id) return <Navigate to="/batch-selection" replace />;
      return <Navigate to="/enrollment-status" replace />;
    }
  }
  return <Home />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Public Routes ─────────────────────────────────────────────── */}
          <Route path="/" element={<IndexRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Student Onboarding Funnel (auth required, no enrollment needed) ── */}
          <Route
            path="/onboarding-survey"
            element={
              <RoleGuard allowedRoles={["student"]}>
                <OnboardingSurvey />
              </RoleGuard>
            }
          />
          <Route
            path="/batch-selection"
            element={
              <RoleGuard allowedRoles={["student"]} requireSurveyComplete={true}>
                <BatchSelection />
              </RoleGuard>
            }
          />
          <Route
            path="/enrollment-status"
            element={
              <RoleGuard allowedRoles={["student"]} requireSurveyComplete={true}>
                <EnrollmentStatus />
              </RoleGuard>
            }
          />

          {/* ── Student Learning Routes (requires enrollment) ────────────── */}
          <Route
            path="/diagnostic"
            element={
              <RoleGuard allowedRoles={["student"]} requireEnrolled={true}>
                <DiagnosticTest />
              </RoleGuard>
            }
          />
          <Route
            path="/test"
            element={
              <RoleGuard allowedRoles={["student"]} requireEnrolled={true}>
                <TestPage />
              </RoleGuard>
            }
          />
          <Route
            path="/result"
            element={
              <RoleGuard allowedRoles={["student"]} requireEnrolled={true}>
                <ResultPage />
              </RoleGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <RoleGuard allowedRoles={["student"]} requireEnrolled={true}>
                <MasteryProfile />
              </RoleGuard>
            }
          />
          <Route
            path="/feedback"
            element={
              <RoleGuard allowedRoles={["student"]} requireEnrolled={true}>
                <Feedback />
              </RoleGuard>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RoleGuard allowedRoles={["student"]} requireEnrolled={true}>
                <StudentDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/study-plan"
            element={
              <RoleGuard allowedRoles={["student"]} requireEnrolled={true}>
                <StudyPlan />
              </RoleGuard>
            }
          />

          {/* ── Teacher Routes ───────────────────────────────────────────── */}
          <Route
            path="/teacher/onboarding"
            element={
              <RoleGuard allowedRoles={["teacher"]}>
                <TeacherOnboarding />
              </RoleGuard>
            }
          />
          <Route
            path="/teacher"
            element={
              <RoleGuard allowedRoles={["teacher"]} requireActivated={true}>
                <TeacherDashboard />
              </RoleGuard>
            }
          />

          {/* ── Admin Routes ─────────────────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <AdminDashboard />
              </RoleGuard>
            }
          />

          {/* ── Catch-all ────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
