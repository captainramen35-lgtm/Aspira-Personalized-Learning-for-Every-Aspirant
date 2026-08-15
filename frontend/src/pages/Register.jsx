import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, User, Eye, EyeOff, GraduationCap, AlertCircle, CheckCircle, } from "lucide-react";

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

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) return setError("Please fill in all fields.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (!/\d/.test(password)) return setError("Password must contain at least one number.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    try {
      setLoading(true);
      await register(email, password, name);
      setVerificationSent(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create account. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  }

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-brand-bg-dark text-brand-text-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="glowing-bg top-[-100px] left-[-100px]" />
        <div className="glowing-bg bottom-[-100px] right-[-100px]" style={{ animationDelay: "-4s" }} />
        <div className="w-full max-w-md glass-card rounded-2xl border border-brand-border-dark p-10 shadow-2xl text-center z-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Account created!</h2>
          <p className="text-gray-400 text-sm mb-8">
            Your account has been created successfully. Go to sign in to continue.
          </p>
          <div className="flex flex-col gap-3">
            <RouterLink
              to="/login"
              className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3.5 rounded-xl transition-all text-sm"
            >
              Go to Sign In
            </RouterLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg-dark text-brand-text-dark flex flex-col justify-between relative overflow-hidden">
      <div className="glowing-bg top-[-100px] left-[-100px]" />
      <div className="glowing-bg bottom-[-100px] right-[-100px]" style={{ animationDelay: "-4s" }} />

      {/* Header */}
      <div className="p-6 z-10 flex items-center justify-between max-w-7xl mx-auto w-full">
        <RouterLink to="/" className="text-xl font-bold flex items-center gap-1.5 text-white">
          <GraduationCap className="w-6 h-6 text-brand-accent" />
          <span>Aspira</span>
        </RouterLink>
        <RouterLink to="/" className="text-xs font-semibold text-brand-accent hover:text-brand-accent-hover transition-colors">
          ← Back to home
        </RouterLink>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 z-10 my-6">
        <div className="w-full max-w-md glass-card rounded-2xl border border-brand-border-dark p-8 shadow-2xl">

          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-brand-accent/20 px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
            <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Student Registration</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Create your account</h2>
          <p className="text-sm text-gray-400 mb-6 font-medium">Start your personalized JEE/NEET learning journey.</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all"
                />
                <User className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Email Address</label>
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

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 chars with a number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthBar password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
                {confirmPassword && (
                  <div className="absolute right-4 top-3.5">
                    {confirmPassword === password
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <AlertCircle className="w-4 h-4 text-red-400" />
                    }
                  </div>
                )}
              </div>
            </div>



            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-accent/50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-brand-accent/20 mt-2 cursor-pointer"
            >
              {loading ? "Creating Account…" : "Create Student Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6 font-medium">
            Already have an account?{" "}
            <RouterLink to="/login" className="text-brand-accent hover:underline font-bold">Sign in</RouterLink>
          </p>
          <p className="text-center text-xs text-gray-500 mt-2">
            Teacher? Your account is created by your institute's administrator.
          </p>
        </div>
      </div>

      <div className="p-6 text-center text-xs text-gray-500 z-10">© 2026 Aspira. All rights reserved.</div>
    </div>
  );
}
