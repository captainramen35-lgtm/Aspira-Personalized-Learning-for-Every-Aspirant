import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * RoleGuard — wraps a route and enforces:
 *  1. User must be authenticated
 *  2. User's role must be in `allowedRoles`
 *  3. Optional: requireEnrolled — student must have assigned_batch_id
 *  4. Optional: requireActivated — teacher must have status === "active"
 */
export default function RoleGuard({
  children,
  allowedRoles,
  requireEnrolled = false,
  requireActivated = false,
  requireSurveyComplete = false,
}) {
  const { currentUser, userRole, userProfile, loading } = useAuth();
  console.log("ROLE GUARD CHECK:", {
    currentUser,
    userRole,
    userProfile,
    status: userProfile?.status,
    target_exam: userProfile?.target_exam,
    assigned_batch_id: userProfile?.assigned_batch_id,
    loading,
  });
  if (loading || (currentUser && !userRole)) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your profile…</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Role mismatch → redirect to their home
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === "admin") return <Navigate to="/admin" replace />;
    if (userRole === "teacher") return <Navigate to="/teacher" replace />;
    return <Navigate to="/profile" replace />;
  }

  // Teacher must complete onboarding before accessing dashboard
  if (requireActivated && userRole === "teacher" && userProfile?.status === "pending_first_login") {
    return <Navigate to="/teacher/onboarding" replace />;
  }

  // Student must complete survey before accessing batch selection or enrollment status
  if (requireSurveyComplete && userRole === "student") {
    const status = userProfile?.status;
    console.log("SURVEY GUARD STATUS:", status);

    if (
      status === "pending_survey" ||
      status === "incomplete_profile_rejected" ||
      !userProfile?.target_exam
    ) {
      return <Navigate to="/onboarding-survey" replace />;
    }

    // Student already submitted an enrollment request.
    // Don't allow them back into batch selection.
    if (status === "pending_approval" && window.location.pathname !== "/enrollment-status") {
      console.log("REDIRECTING TO ENROLLMENT STATUS");
      return <Navigate to="/enrollment-status" replace />;
    }
  }

  // Student must be enrolled (have assigned_batch_id) before accessing tests
  if (requireEnrolled && userRole === "student") {
    const status = userProfile?.status;
    const hasBatch = !!userProfile?.assigned_batch_id;

    if (!hasBatch || status === "pending_approval") {
      // Route to the correct step in the funnel
      if (status === "pending_survey" || status === "incomplete_profile_rejected") return <Navigate to="/onboarding-survey" replace />;
      if (status === "pending_batch") return <Navigate to="/batch-selection" replace />;
      if (status === "pending_approval") return <Navigate to="/enrollment-status" replace />;
    }
  }

  return children;
}
