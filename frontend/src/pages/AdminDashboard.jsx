import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  GraduationCap, Users, UserPlus, Shield, Mail, BookOpen,
  CheckCircle, XCircle, AlertCircle, Eye, EyeOff, ChevronDown,
  Copy, RefreshCw, Power, PowerOff, Loader2
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const STATUS_BADGE = {
  active: { label: "Active", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  pending_first_login: { label: "Awaiting First Login", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  inactive: { label: "Deactivated", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE[status] || STATUS_BADGE.active;
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.cls}`}>{cfg.label}</span>
  );
}

export default function AdminDashboard() {
  const { getToken, logout } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", specialization: "" });
  const [creating, setCreating] = useState(false);
  const [createdTeacher, setCreatedTeacher] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  async function fetchTeachers() {
    try {
      const token = await getToken();
      const res = await axios.get(`${BACKEND_URL}/api/admin/teachers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(res.data.teachers || []);
    } catch (err) {
      setError("Failed to load teacher list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTeachers(); }, []);

  async function handleCreateTeacher(e) {
    e.preventDefault();
    if (!form.name || !form.email) return setError("Name and email are required.");
    try {
      setCreating(true);
      setError("");
      const token = await getToken();
      const res = await axios.post(
        `${BACKEND_URL}/api/admin/register-teacher`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreatedTeacher(res.data);
      setForm({ name: "", email: "", specialization: "" });
      setShowForm(false);
      await fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create teacher account.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleTeacherStatus(uid, currentStatus) {
    try {
      const token = await getToken();
      const action = currentStatus === "inactive" ? "reactivate" : "deactivate";
      await axios.patch(
        `${BACKEND_URL}/api/admin/teachers/${uid}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update teacher status.");
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-brand-bg-dark text-white">
      <div className="glowing-bg top-[-80px] left-[-80px] opacity-30" />

      {/* Navbar */}
      <nav className="border-b border-brand-border-dark bg-brand-bg-dark/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-brand-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-accent" />
                <span className="font-bold">Aspira</span>
              </div>
              <span className="text-xs text-gray-500">Administrator Console</span>
            </div>
          </div>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
            <Power className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">Teacher Management</h1>
            <p className="text-gray-400 text-sm">Register, manage, and monitor teacher accounts.</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setCreatedTeacher(null); setError(""); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent hover:bg-brand-accent-hover rounded-xl font-bold text-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Register Teacher
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Newly Created Teacher — Temp Password Card */}
        {createdTeacher && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-green-400">Teacher Account Created!</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Share the temporary password with <strong>{createdTeacher.email}</strong>. They'll be required to change it on first login.
            </p>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Temporary Password</p>
                <p className="font-mono text-lg font-bold tracking-wider text-white">
                  {showPassword ? createdTeacher.temp_password : "••••••••••••"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-all"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(createdTeacher.temp_password)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${copied ? "bg-green-500/20 text-green-400" : "bg-gray-800 hover:bg-gray-700 text-gray-400"}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Register Teacher Form */}
        {showForm && (
          <div className="glass-card border border-brand-border-dark rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand-accent" />
              New Teacher Account
            </h3>
            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Teacher's full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Email Address *</label>
                  <input
                    type="email"
                    placeholder="teacher@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Subject Specialization</label>
                <input
                  type="text"
                  placeholder="e.g., Physical Chemistry, JEE Advanced Maths"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="w-full bg-brand-bg-dark border border-brand-border-dark rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-accent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-accent/50 rounded-xl font-bold text-sm transition-all"
                >
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><UserPlus className="w-4 h-4" /> Create Account</>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-xl text-gray-400 hover:text-white font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Teacher List */}
        <div className="glass-card border border-brand-border-dark rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-brand-border-dark flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Registered Teachers</h2>
              <p className="text-xs text-gray-400 mt-0.5">{teachers.length} total</p>
            </div>
            <button onClick={fetchTeachers} className="p-2 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
            </div>
          ) : teachers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No teachers registered yet.</p>
              <p className="text-gray-600 text-xs mt-1">Click "Register Teacher" to add the first one.</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-border-dark">
              {teachers.map((teacher) => (
                <div key={teacher.uid} className="p-5 flex items-center justify-between hover:bg-white/2 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-accent/15 border border-brand-accent/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-brand-accent">
                        {teacher.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{teacher.name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{teacher.email}</span>
                      </div>
                      {teacher.specialization && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                          <BookOpen className="w-3 h-3" />
                          <span>{teacher.specialization}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={teacher.status} />
                    <button
                      onClick={() => toggleTeacherStatus(teacher.uid, teacher.status)}
                      title={teacher.status === "inactive" ? "Reactivate" : "Deactivate"}
                      className={`p-2 rounded-lg border transition-all ${
                        teacher.status === "inactive"
                          ? "border-green-500/30 hover:bg-green-500/10 text-green-400"
                          : "border-gray-700 hover:bg-red-500/10 hover:border-red-500/30 text-gray-500 hover:text-red-400"
                      }`}
                    >
                      {teacher.status === "inactive"
                        ? <Power className="w-4 h-4" />
                        : <PowerOff className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
