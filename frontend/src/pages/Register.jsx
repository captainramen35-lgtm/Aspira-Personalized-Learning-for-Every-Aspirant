import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, User, Eye, EyeOff, GraduationCap, AlertCircle, ShieldAlert } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student"); // "student" or "teacher"
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      return setError("Please fill in all fields.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      setLoading(true);
      await register(email, password, name, role);
      navigate("/profile");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create account. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg-dark text-brand-text-dark flex flex-col justify-between relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="glowing-bg top-[-100px] left-[-100px]"></div>
      <div className="glowing-bg bottom-[-100px] right-[-100px]" style={{ animationDelay: "-4s" }}></div>

      {/* Header Link */}
      <div className="p-6 z-10 flex items-center justify-between max-w-7xl mx-auto w-full">
        <RouterLink to="/" className="text-xl font-bold flex items-center gap-1.5 text-white">
          <GraduationCap className="w-6 h-6 text-brand-accent" />
          <span>Aspira</span>
        </RouterLink>
        <RouterLink to="/" className="text-xs font-semibold text-brand-accent hover:text-brand-accent-hover transition-colors flex items-center gap-1">
          &larr; Back to home
        </RouterLink>
      </div>

      {/* Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 z-10 my-6">
        <div className="w-full max-w-md glass-card rounded-2xl border border-brand-border-dark p-8 shadow-2xl relative">
          
          {/* Welcome Pill */}
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-brand-accent/20 px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
            <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Get started</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Create your account</h2>
          <p className="text-sm text-gray-400 mb-6 font-medium">Start your personalized learning journey with Aspira.</p>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Full Name
              </label>
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

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Email Address
              </label>
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

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Confirm Password
              </label>
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
              </div>
            </div>

            {/* Role Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                I am a...
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-11 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all appearance-none cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
                <GraduationCap className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
                <div className="absolute right-4 top-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-accent/50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-brand-accent/20 border border-brand-accent/10 mt-6 cursor-pointer"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-400 mt-6 font-medium">
            Already have an account?{" "}
            <RouterLink to="/login" className="text-brand-accent hover:underline font-bold">
              Sign in
            </RouterLink>
          </p>

        </div>
      </div>

      {/* Footer copyright */}
      <div className="p-6 text-center text-xs text-gray-500 z-10">
        &copy; 2026 Aspira. All rights reserved.
      </div>
    </div>
  );
}
