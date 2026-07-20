import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, Eye, EyeOff, GraduationCap, AlertCircle, CheckCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const { login, sendPasswordReset, userProfile } = useAuth();
  const navigate = useNavigate();

  function getRoleRedirect(profile) {
    if (!profile) return "/dashboard";
    const { role, status, assigned_batch_id } = profile;
    if (role === "admin") return "/admin";
    if (role === "teacher") {
      return status === "pending_first_login" ? "/teacher/onboarding" : "/teacher";
    }
    // Student funnel
    if (status === "pending_survey") return "/onboarding-survey";
    if (status === "pending_batch" || !assigned_batch_id) return "/batch-selection";
    if (status === "pending_approval") return "/enrollment-status";
    return "/dashboard";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return setError("Please fill in all fields.");
    try {
      setError("");
      setLoading(true);
      await login(email, password);
      // Profile is fetched by AuthContext listener; redirect after short delay
      setTimeout(() => {
        const profile = JSON.parse(localStorage.getItem("aspira_profile") || "{}");
        navigate(getRoleRedirect(profile));
      }, 500);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    if (!resetEmail) return setError("Please enter your email address.");
    try {
      setLoading(true);
      await sendPasswordReset(resetEmail);
      setResetSent(true);
      setError("");
    } catch (err) {
      setError("Could not send reset email. Please check the address.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg-dark text-brand-text-dark flex flex-col justify-between relative overflow-hidden">
      <div className="glowing-bg top-[-100px] left-[-100px]" />
      <div className="glowing-bg bottom-[-100px] right-[-100px]" style={{ animationDelay: "-4s" }} />

      {/* Header */}
      <div className="p-6 z-10 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="text-xl font-bold flex items-center gap-1.5 text-white">
          <GraduationCap className="w-6 h-6 text-brand-accent" />
          <span>Aspira</span>
        </Link>
        <Link to="/" className="text-xs font-semibold text-brand-accent hover:text-brand-accent-hover transition-colors">
          ← Back to home
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md glass-card rounded-2xl border border-brand-border-dark p-8 shadow-2xl">

          {!showReset ? (
            <>
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-brand-accent/20 px-3 py-1 rounded-full mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
                <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Welcome back</span>
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Sign in to Aspira</h2>
              <p className="text-sm text-gray-400 mb-6 font-medium">Continue your learning journey.</p>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-5">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all"
                    />
                    <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all"
                    />
                    <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-gray-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowReset(true); setResetEmail(email); setError(""); }}
                    className="text-xs text-brand-accent hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-accent/50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-brand-accent/20 mt-2 cursor-pointer"
                >
                  {loading ? "Signing In…" : "Sign In"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6 font-medium">
                Don't have an account?{" "}
                <Link to="/register" className="text-brand-accent hover:underline font-bold">Create one</Link>
              </p>
            </>
          ) : (
            /* ── Password Reset Panel ── */
            <>
              <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Reset Password</span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-white mb-1.5">Forgot your password?</h2>
              <p className="text-sm text-gray-400 mb-6">Enter your email and we'll send you a reset link.</p>

              {resetSent ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                  <p className="text-white font-semibold text-center">Reset link sent!</p>
                  <p className="text-gray-400 text-sm text-center">Check your inbox and follow the link to reset your password.</p>
                  <button
                    onClick={() => { setShowReset(false); setResetSent(false); }}
                    className="mt-2 text-brand-accent hover:underline text-sm font-semibold"
                  >
                    ← Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        disabled={loading}
                        className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all"
                      />
                      <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-accent/50 text-white font-bold py-3.5 rounded-xl transition-all mt-2"
                  >
                    {loading ? "Sending…" : "Send Reset Link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowReset(false); setError(""); }}
                    className="w-full text-gray-400 hover:text-white text-sm mt-1"
                  >
                    ← Back to sign in
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <div className="p-6 text-center text-xs text-gray-500 z-10">© 2026 Aspira. All rights reserved.</div>
    </div>
  );
}
