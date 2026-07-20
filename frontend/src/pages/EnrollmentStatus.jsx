import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  GraduationCap, Clock, CheckCircle, XCircle,
  RefreshCw, ArrowRight, AlertTriangle, Loader2
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
    label: "Pending Review",
    description: "Your enrollment request has been submitted. Your teacher will review your profile and respond soon.",
  },
  approved: {
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
    label: "Approved! 🎉",
    description: "Congratulations! You've been approved. You can now start your diagnostic test.",
  },
  reassigned: {
    icon: RefreshCw,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    label: "Placed in a Batch",
    description: "Your teacher has placed you in the best-fit batch for your level.",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
    label: "Not Approved",
    description: "Unfortunately, your enrollment request was not approved for the selected batch.",
  },
};

export default function EnrollmentStatus() {
  const { getToken, userProfile } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${BACKEND_URL}/api/enrollment/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequest(res.data.request);
    } catch (err) {
      setError("Could not fetch enrollment status.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (userProfile && userProfile.assigned_batch_id && userProfile.status === "active") {
      navigate("/dashboard");
    }
  }, [userProfile, navigate]);

  useEffect(() => {
    fetchStatus();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
          <p className="text-gray-400 text-sm">Checking your enrollment status…</p>
        </div>
      </div>
    );
  }

  const status = request?.status || "pending";
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="min-h-screen bg-brand-bg-dark text-white relative overflow-hidden flex flex-col">
      <div className="glowing-bg top-[-80px] left-[-80px]" />
      <div className="glowing-bg bottom-[-80px] right-[-80px]" style={{ animationDelay: "-5s" }} />

      {/* Header */}
      <div className="p-6 flex items-center gap-2 z-10 relative max-w-3xl mx-auto w-full">
        <GraduationCap className="w-6 h-6 text-brand-accent" />
        <span className="text-lg font-bold">Aspira</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 z-10 relative">
        <div className="w-full max-w-lg">
          <div className="glass-card rounded-2xl border border-brand-border-dark p-8 shadow-2xl">

            {/* Status Icon */}
            <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-6 ${cfg.bg}`}>
              <StatusIcon className={`w-8 h-8 ${cfg.color}`} />
            </div>

            <h1 className="text-2xl font-extrabold mb-2">
              Enrollment Status: <span className={cfg.color}>{cfg.label}</span>
            </h1>

            {request && (
              <p className="text-sm text-gray-400 mb-2">
                Batch: <span className="text-white font-semibold">{request.batch_name || "—"}</span>
              </p>
            )}

            <p className="text-gray-300 text-sm mb-6">{cfg.description}</p>

            {/* AI Placement Explanation */}
            {(status === "approved" || status === "reassigned") && request?.placement_explanation && (
              <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-5 mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-accent mb-2">Message from your teacher</p>
                <p className="text-sm text-gray-200 leading-relaxed">{request.placement_explanation}</p>
              </div>
            )}

            {/* Rejection Reason */}
            {status === "rejected" && request?.rejection_reason && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2">Reason</p>
                <p className="text-sm text-gray-300">{request.rejection_reason}</p>
              </div>
            )}

            {/* Pending: auto-refresh indicator */}
            {status === "pending" && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span>Auto-refreshing every 30 seconds…</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {(status === "approved" || status === "reassigned") && (
                <button
                  onClick={() => navigate("/diagnostic")}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-brand-accent hover:bg-brand-accent-hover rounded-xl font-bold transition-all text-sm"
                >
                  Start Diagnostic Test <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {status === "rejected" && (
                <button
                  onClick={() => navigate("/batch-selection")}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-all text-sm"
                >
                  Browse Other Batches
                </button>
              )}

              <button
                onClick={fetchStatus}
                className="w-full flex items-center justify-center gap-2 py-3 border border-gray-700 hover:border-gray-500 rounded-xl text-gray-400 hover:text-white font-semibold transition-all text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Check for Updates
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mt-4">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-gray-600 mt-4">
            Questions? Contact your institute administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
