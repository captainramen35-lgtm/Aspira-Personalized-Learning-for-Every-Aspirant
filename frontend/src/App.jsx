import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DiagnosticTest from "./pages/DiagnosticTest";
import TestPage from "./pages/TestPage";
import ResultPage from "./pages/ResultPage";
import MasteryProfile from "./pages/MasteryProfile";
import TeacherDashboard from "./pages/TeacherDashboard";
import Feedback from "./pages/Feedback";

// Protected Route Component to handle role verification and routing redirects
function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userRole, loading } = useAuth();

  // If globally loading OR we have a user but haven't fetched their role yet
  if (loading || (currentUser && !userRole)) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect if they have the wrong role
    return userRole === "teacher" 
      ? <Navigate to="/teacher" replace /> 
      : <Navigate to="/profile" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Protected Routes */}
          <Route
            path="/diagnostic"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <DiagnosticTest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <TestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/result"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <ResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <MasteryProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Feedback />
              </ProtectedRoute>
            }
          />

          {/* Teacher Protected Routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
