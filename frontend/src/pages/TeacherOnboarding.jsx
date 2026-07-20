import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  GraduationCap, Lock, Eye, EyeOff, User, BookOpen,
  CheckCircle, AlertCircle, ChevronRight, ShieldCheck
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "All Subjects"];

function PasswordStrengthBar({ password }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
  ];
  const passed = checks.filter((c) => c.pass).length;
  const colors = ["bg-red-500", "bg-yellow-500", "bg-green-500"];
  const color = colors[passed - 1] || "bg-gray-600";
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1 h-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`flex-1 rounded-full transition-all ${i < passed ? color : "bg-gray-700"}`} />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map((c) => (
          <span key={c.label} className={`text-xs ${c.pass ? "text-green-400" : "text-gray-500"}`}>
            {c.pass ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TeacherOnboarding() {
  const { changePassword, getToken, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: password change, 2: profile
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bio, setBio] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [subjectsTaught, setSubjectsTaught] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleSubject(subj) {
    setSubjectsTaught((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]
    );
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (!/\d/.test(newPassword)) return setError("Password must contain at least one number.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

    try {
      setLoading(true);
      await changePassword(newPassword);
      setStep(2);
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setError("Your session has expired. Please log out and log back in with your temporary password.");
      } else {
        setError(err.message || "Failed to change password.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    if (!bio.trim()) return setError("Please add a short bio.");
    setError("");

    try {
      setLoading(true);
      const token = await getToken();
      await axios.post(
        `${BACKEND_URL}/api/teacher/onboarding/complete`,
        {
          bio,
          qualifications,
          subjects_taught: subjectsTaught,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/teacher");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg-dark text-white relative overflow-hidden">
      <div className="glowing-bg top-[-80px] left-[-80px]" />
      <div className="glowing-bg bottom-[-80px] right-[-80px]" style={{ animationDelay: "-5s" }} />

      {/* Header */}
      <div className="p-6 flex items-center justify-between max-w-3xl mx-auto z-10 relative">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-brand-accent" />
          <span className="text-lg font-bold">Aspira</span>
        </div>
        <button onClick={() => logout()} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Sign out
        </button>
      </div>

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto px-6 mb-8 z-10 relative">
        <div className="flex items-center gap-3 mb-2">
          {[
            { n: 1, label: "Set Password" },
            { n: 2, label: "Complete Profile" },
          ].map(({ n, label }, i) => (
            <React.Fragment key={n}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  n < step ? "bg-brand-accent border-brand-accent" : n === step ? "border-brand-accent text-brand-accent" : "border-gray-700 text-gray-600"
                }`}>
                  {n < step ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : n}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${n === step ? "text-white" : "text-gray-600"}`}>{label}</span>
              </div>
              {i === 0 && <div className={`flex-1 h-0.5 rounded-full ${step > 1 ? "bg-brand-accent" : "bg-gray-700"}`} />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">Complete these steps to access your Teacher Dashboard</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-16 z-10 relative">
        <div className="glass-card rounded-2xl border border-brand-border-dark p-8 shadow-2xl">

          {error && (
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: Password Change ── */}
          {step === 1 && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-2xl font-extrabold">Set Your Password</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  You've been given a temporary password. Please create a new secure password to continue.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 chars with a number"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loading}
                        className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent"
                      />
                      <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-500 hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrengthBar password={newPassword} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent"
                      />
                      <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
                      {confirmPassword && (
                        <div className="absolute right-4 top-3.5">
                          {confirmPassword === newPassword
                            ? <CheckCircle className="w-4 h-4 text-green-400" />
                            : <AlertCircle className="w-4 h-4 text-red-400" />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-brand-accent/5 border border-brand-accent/15 rounded-xl p-3">
                <ShieldCheck className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" />
                <p className="text-xs text-gray-400">Your new password replaces the temporary one and cannot be recovered by administrators.</p>
              </div>

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-accent/50 rounded-xl font-bold transition-all">
                {loading ? "Saving…" : "Set Password & Continue"} {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* ── STEP 2: Profile ── */}
          {step === 2 && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-2xl font-extrabold">Complete Your Profile</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">Tell your students a bit about yourself.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Short Bio</label>
                    <textarea
                      rows={3}
                      placeholder="e.g., 8 years of JEE coaching experience, specialized in Physical Chemistry..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-gray-800/50 border border-brand-border-dark rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Qualifications / Degrees</label>
                    <input
                      type="text"
                      placeholder="e.g., M.Sc. Physics, B.Tech IIT Delhi"
                      value={qualifications}
                      onChange={(e) => setQualifications(e.target.value)}
                      className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Subjects I teach</label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map((subj) => (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => toggleSubject(subj)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all cursor-pointer ${
                            subjectsTaught.includes(subj)
                              ? "border-brand-accent bg-brand-accent/15 text-brand-accent"
                              : "border-gray-700 text-gray-400 hover:border-gray-500"
                          }`}
                        >
                          {subjectsTaught.includes(subj) && <BookOpen className="w-3.5 h-3.5 inline mr-1" />}
                          {subj}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-accent/50 rounded-xl font-bold transition-all">
                {loading ? "Saving…" : "Complete Setup & Go to Dashboard"} {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
