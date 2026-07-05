import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, Eye, EyeOff, GraduationCap, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      return setError("Please fill in all fields.");
    }
    try {
      setError("");
      setLoading(true);
      await login(email, password);
      // Auth listener in AuthContext will fetch the role and redirect accordingly
      navigate("/profile");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to sign in. Please check your credentials.");
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
        <Link to="/" className="text-xl font-bold flex items-center gap-1.5 text-white">
          <GraduationCap className="w-6 h-6 text-brand-accent" />
          <span>Aspira</span>
        </Link>
        <Link to="/" className="text-xs font-semibold text-brand-accent hover:text-brand-accent-hover transition-colors flex items-center gap-1">
          &larr; Back to home
        </Link>
      </div>

      {/* Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md glass-card rounded-2xl border border-brand-border-dark p-8 shadow-2xl relative">
          
          {/* Welcome Pill */}
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-brand-accent/20 px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
            <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Welcome back</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Sign in to Aspira</h2>
          <p className="text-sm text-gray-400 mb-6 font-medium">Continue your learning journey.</p>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Email
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-accent/50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-brand-accent/20 border border-brand-accent/10 mt-6 cursor-pointer"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-400 mt-6 font-medium">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-accent hover:underline font-bold">
              Create one
            </Link>
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
