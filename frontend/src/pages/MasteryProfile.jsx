import React, { useState, useEffect } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { Loader2, User, Mail, BookOpen, Clock, Calendar, CheckSquare } from "lucide-react";

export default function MasteryProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("/api/mastery");
        setProfile(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load your mastery profile details.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getMasteryLabel = (accuracy) => {
    // If accuracy is stored as fraction (e.g. 0.35) or percentage (e.g. 35.0)
    const acc = accuracy <= 1.0 && accuracy > 0.0 ? accuracy * 100 : accuracy;
    if (acc >= 65) return `${acc.toFixed(0)}% (Strong)`;
    if (acc >= 40) return `${acc.toFixed(0)}% (Moderate)`;
    return `${acc.toFixed(0)}% (Weak)`;
  };

  const getMasteryColor = (accuracy) => {
    const acc = accuracy <= 1.0 && accuracy > 0.0 ? accuracy * 100 : accuracy;
    if (acc >= 65) return "bg-emerald-500 text-emerald-600 border-emerald-500/30";
    if (acc >= 40) return "bg-amber-500 text-amber-600 border-amber-500/30";
    return "bg-rose-500 text-rose-500 border-rose-500/20";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg-light flex flex-col pb-12">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 pt-10">
        {/* Profile Card Header (Dark Golden Box) */}
        {profile && (
          <div className="w-full bg-[#c07c2a] rounded-xl p-8 flex items-center gap-6 shadow-md text-white mb-8 border border-[#a2631a]">
            {/* Initials Circle */}
            <div className="w-20 h-20 rounded-full border-2 border-white/50 bg-[#a2631a] flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm">
              {getInitials(profile.name)}
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight">{profile.name}</h2>
              <p className="text-white/80 text-sm font-medium mt-1">{profile.email}</p>
            </div>
          </div>
        )}

        {/* Account Details */}
        <div className="w-full bg-white rounded-xl border border-brand-border-light p-6 shadow-xs mb-8">
          <h3 className="text-lg font-bold text-brand-text-light mb-6 border-b border-brand-border-light/40 pb-2.5">
            Account Details
          </h3>

          <div className="space-y-4 text-sm font-semibold">
            {/* NAME */}
            <div className="flex items-center justify-between border-b border-brand-border-light/20 pb-3">
              <span className="text-brand-muted-light font-medium uppercase tracking-wider text-xs">Name</span>
              <span className="text-brand-text-light">{profile?.name}</span>
            </div>

            {/* EMAIL */}
            <div className="flex items-center justify-between border-b border-brand-border-light/20 pb-3">
              <span className="text-brand-muted-light font-medium uppercase tracking-wider text-xs">Email</span>
              <span className="text-brand-text-light">{profile?.email}</span>
            </div>

            {/* ENROLLED */}
            <div className="flex items-center justify-between border-b border-brand-border-light/20 pb-3">
              <span className="text-brand-muted-light font-medium uppercase tracking-wider text-xs">Enrolled</span>
              <span className="text-brand-text-light">Not Enrolled</span>
            </div>

            {/* PROGRESS */}
            <div className="flex items-center justify-between border-b border-brand-border-light/20 pb-3">
              <span className="text-brand-muted-light font-medium uppercase tracking-wider text-xs">Progress</span>
              <span className="text-brand-text-light">{profile?.tests_completed} tests taken</span>
            </div>

            {/* JOINED */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-brand-muted-light font-medium uppercase tracking-wider text-xs">Joined</span>
              <span className="text-brand-text-light">{profile?.joined_date}</span>
            </div>
          </div>
        </div>

        {/* Subject Mastery Profile */}
        <div className="w-full bg-white rounded-xl border border-brand-border-light p-6 shadow-xs">
          <h3 className="text-lg font-bold text-brand-text-light mb-6 border-b border-brand-border-light/40 pb-2.5">
            Subject Mastery Profile
          </h3>

          {profile && profile.mastery && (
            <div className="space-y-4">
              {Object.keys(profile.mastery).map((topic) => {
                const topicData = profile.mastery[topic];
                const accPercent = topicData.accuracy <= 1.0 && topicData.accuracy > 0.0 
                  ? topicData.accuracy * 100 
                  : topicData.accuracy;
                
                const isWeak = accPercent < 40;
                const isStrong = accPercent >= 65;

                let textColorClass = "text-amber-600";
                if (isWeak) textColorClass = "text-rose-500";
                if (isStrong) textColorClass = "text-emerald-600";

                return (
                  <div key={topic} className="bg-brand-bg-light/25 border border-brand-border-light/40 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-brand-text-light">{topic}</span>
                      <span className={`text-xs font-bold ${textColorClass}`}>
                        {getMasteryLabel(topicData.accuracy)}
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-3 bg-brand-border-light/40 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isWeak 
                            ? "bg-rose-500" 
                            : isStrong 
                              ? "bg-emerald-500" 
                              : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.max(accPercent, 2)}%` }} // minimum 2% for visual indicator
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
