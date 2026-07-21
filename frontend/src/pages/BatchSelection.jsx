import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  GraduationCap, Users, BookOpen, Calendar, ChevronRight,
  AlertCircle, CheckCircle, Clock, Zap, Lock
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export default function BatchSelection() {
  const { userProfile, getToken } = useAuth();
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const targetExam = userProfile?.target_exam || "JEE";

  useEffect(() => {
    if (userProfile && userProfile.assigned_batch_id && userProfile.status === "active") {
      navigate("/dashboard");
    }
  }, [userProfile, navigate]);

  useEffect(() => {
    async function fetchBatches() {
      try {
        const token = await getToken();
        const res = await axios.get(
          `${BACKEND_URL}/api/batches`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBatches(res.data.batches || []);
      } catch (err) {
        console.error(err);
        setError("Could not load available batches. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchBatches();
  }, [targetExam, getToken]);

  async function handleRequestEnrollment() {
    if (!selectedBatch) return setError("Please select a batch first.");
    try {
      setSubmitting(true);
      setError("");
      const token = await getToken();
      await axios.post(
        `${BACKEND_URL}/api/enrollment/request`,
        { batch_id: selectedBatch },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/enrollment-status");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to submit enrollment request.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const isFull = (batch) => batch.current_count >= batch.capacity;

  return (
    <div className="min-h-screen bg-brand-bg-dark text-white relative overflow-hidden">
      <div className="glowing-bg top-[-80px] left-[-80px]" />
      <div className="glowing-bg bottom-[-80px] right-[-80px]" style={{ animationDelay: "-5s" }} />

      {/* Header */}
      <div className="p-6 flex items-center justify-between z-10 relative max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-brand-accent" />
          <span className="text-lg font-bold">Aspira</span>
        </div>
        <div className="flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 px-3 py-1.5 rounded-full">
          <Zap className="w-3.5 h-3.5 text-brand-accent" />
          <span className="text-xs font-bold text-brand-accent">{targetExam} Track</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16 z-10 relative">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold mb-2">Select Your Batch</h1>
          <p className="text-gray-400 text-sm">
            Choose a batch below. Your teacher will review your profile and confirm your placement.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : batches.length === 0 ? (
          <div className="glass-card rounded-2xl border border-brand-border-dark p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">No batches available yet</h3>
            <p className="text-gray-400 text-sm">
              No batches are currently open for enrollment. Please check back later or contact your institute.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {batches.map((batch) => {
              const full = isFull(batch);
              const selected = selectedBatch === batch.batch_id;
              const pct = Math.min(100, Math.round((batch.current_count / batch.capacity) * 100));

              return (
                <button
                  key={batch.batch_id}
                  onClick={() => !full && setSelectedBatch(batch.batch_id)}
                  disabled={full}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    full
                      ? "border-gray-800 opacity-50 cursor-not-allowed"
                      : selected
                      ? "border-brand-accent bg-brand-accent/10 shadow-lg shadow-brand-accent/10"
                      : "border-gray-700 hover:border-gray-500 bg-gray-800/20"
                  }`}
                >
                  {selected && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="w-5 h-5 text-brand-accent" />
                    </div>
                  )}
                  {full && (
                    <div className="absolute top-4 right-4">
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                  )}

                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-brand-accent" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg leading-tight">{batch.name}</h3>
                      <span className="text-xs text-brand-accent font-semibold">{batch.target_exam}</span>
                    </div>
                  </div>

                  {batch.syllabus_notes && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{batch.syllabus_notes}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{batch.current_count} / {batch.capacity} students</span>
                    </div>
                    {full && <span className="text-red-400 font-semibold">Batch Full</span>}
                  </div>

                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedBatch && (
          <div className="flex justify-end">
            <button
              onClick={handleRequestEnrollment}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-4 bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-accent/50 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-brand-accent/20"
            >
              {submitting ? "Submitting…" : "Request Enrollment"}
              {!submitting && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
