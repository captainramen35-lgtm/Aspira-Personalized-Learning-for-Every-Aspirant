import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Loader2,
  CheckCircle,
  HelpCircle,
  BookOpen,
  ChevronRight,
  TrendingUp
} from "lucide-react";

export default function StudyPlan() {
  const [studyPlan, setStudyPlan] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPlan() {
      try {
        const [planRes, profileRes] = await Promise.all([
          api.get("/api/study-plan/current").catch(() => ({ data: { plan: null } })),
          api.get("/api/mastery").catch(() => ({ data: null }))
        ]);
        setStudyPlan(planRes.data?.plan || null);
        setProfile(profileRes.data || null);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch study plan.");
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

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

  if (!profile || profile.tests_completed === 0) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="bg-brand-accent/10 p-5 rounded-full mb-5">
            <BookOpen className="w-12 h-12 text-brand-accent" />
          </div>
          <h4 className="text-brand-text-light font-extrabold text-2xl mb-3">Unlock Your Study Plan</h4>
          <p className="text-brand-muted-light text-base mb-8 leading-relaxed font-medium">
            Take your Diagnostic Practice Test to unlock your Personalized Mastery Profile and AI Study Plan.
          </p>
          <Link
            to="/diagnostic"
            className="px-8 py-4 bg-brand-accent text-white font-extrabold rounded-xl shadow-md hover:-translate-y-0.5 transition-transform text-lg cursor-pointer"
          >
            Take Diagnostic
          </Link>
        </div>
      </div>
    );
  }

  if (!studyPlan) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <HelpCircle className="w-16 h-16 text-brand-muted-light mb-4" />
          <h2 className="text-xl font-bold text-brand-text-light">No Study Plan Found</h2>
          <p className="text-sm text-brand-muted-light mt-1 mb-6">
            Generate your personalized AI study plan roadmap from your student dashboard.
          </p>
          <Link
            to="/dashboard"
            className="bg-brand-accent hover:bg-brand-accent-hover text-white px-6 py-3 rounded-xl font-bold transition-colors cursor-pointer text-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg-light flex flex-col pb-16">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 pt-10 space-y-6">
        
        {/* Back Link */}
        <div className="flex items-center">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Plan Header */}
        <div className="bg-white rounded-xl border border-brand-border-light p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-brand-text-light">
                {studyPlan.title || "Your Custom Study Plan"}
              </h1>
              <p className="text-xs text-brand-muted-light font-semibold uppercase mt-0.5 tracking-wider">
                AI-generated 14-Day Roadmap
              </p>
            </div>
          </div>
          <p className="text-sm text-brand-text-light font-medium leading-relaxed border-t border-brand-border-light/40 pt-4 mt-3">
            {studyPlan.overview}
          </p>
        </div>

        {/* Weekly Roadmaps */}
        <div className="space-y-8">
          {studyPlan.weeks?.map((week, wIdx) => (
            <div key={wIdx} className="space-y-4">
              <h2 className="text-lg font-extrabold text-brand-text-light flex items-center gap-2 border-b border-brand-border-light/40 pb-2 uppercase tracking-widest text-left">
                <span>Week {week.week_number}</span>
                <span className="text-xs font-bold text-brand-muted-light bg-brand-bg-light/45 px-2 py-0.5 rounded border border-brand-border-light">
                  Focus Session
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {week.days?.map((day) => (
                  <div
                    key={day.day_number}
                    className="bg-white border border-brand-border-light rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-brand-accent uppercase tracking-widest">
                          Day {day.day_number}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-brand-muted-light">
                          <Clock className="w-3.5 h-3.5 text-brand-accent/70" />
                          {day.estimated_hours} Hours
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-sm text-brand-text-light">
                        {day.topic}
                      </h3>
                      
                      <ul className="space-y-1 text-xs text-brand-muted-light font-semibold pl-2">
                        {day.tasks?.map((task, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-1.5">
                            <span className="text-brand-accent text-[14px] leading-none shrink-0">&bull;</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-brand-border-light/20 flex justify-end">
                      <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" />
                        Recommended
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
