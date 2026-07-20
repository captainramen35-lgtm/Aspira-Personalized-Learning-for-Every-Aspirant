import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import {
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  ListTodo
} from "lucide-react";

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch mastery profile
        const profileRes = await api.get("/api/mastery");
        setProfile(profileRes.data);

        // Fetch study plan
        const planRes = await api.get("/api/study-plan/current");
        setStudyPlan(planRes.data.plan);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard insights.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/api/study-plan/generate");
      setStudyPlan(res.data.plan);
      setSuccess("Your customized 2-week roadmap is ready!");
    } catch (err) {
      console.error(err);
      setError("Failed to generate your personalized study plan. Please try again.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Group topics from profile.mastery
  const getCategorizedTopics = () => {
    if (!profile || !profile.mastery) return { weak: [], moderate: [], strong: [] };

    const weak = [];
    const moderate = [];
    const strong = [];

    Object.keys(profile.mastery).forEach((topic) => {
      const data = profile.mastery[topic];
      let acc = data.accuracy;
      
      // Convert fraction to percentage if stored as <= 1.0
      if (acc <= 1.0 && acc > 0.0) {
        acc = acc * 100;
      }
      acc = Math.round(acc);
      
      // Filter out non-attempted default fillers for categorization
      if (data.attempts > 0) {
        if (acc < 40) weak.push({ name: topic, accuracy: acc });
        else if (acc < 65) moderate.push({ name: topic, accuracy: acc });
        else strong.push({ name: topic, accuracy: acc });
      }
    });

    return { weak, moderate, strong };
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

  const { weak, moderate, strong } = getCategorizedTopics();
  const hasSubmissions = profile?.tests_completed > 0;

  return (
    <div className="min-h-screen bg-brand-bg-light flex flex-col pb-16">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 pt-10 space-y-8">
        
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 to-brand-accent/5 border border-brand-border-light rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-brand-accent/20 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-[10px] font-extrabold text-brand-accent uppercase tracking-wider">Student Dashboard</span>
            </div>
            <h1 className="text-3xl font-extrabold text-brand-text-light tracking-tight">
              Hello, {profile?.name || "Aspirant"}!
            </h1>
            <p className="text-sm text-brand-muted-light font-medium max-w-md">
              Enrolled in: <span className="text-brand-text-light font-bold">{profile?.assigned_batch_name || "Not Enrolled"}</span>
            </p>
          </div>

          <div className="flex gap-4 shrink-0">
            <Link
              to="/test"
              className="bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold px-5 py-3 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Start Practice
            </Link>
            <Link
              to="/profile"
              className="bg-white hover:bg-brand-bg-light/45 border border-brand-border-light text-brand-text-light text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              Mastery Profile
            </Link>
          </div>
        </div>

        {/* Global Feedback Area */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm p-4 rounded-xl font-semibold flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm p-4 rounded-xl font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Diagnostic Requirement Warning */}
        {!hasSubmissions && (
          <div className="bg-amber-50 border border-brand-accent/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-brand-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-brand-text-light">Diagnostic Test Pending</h4>
                <p className="text-xs text-brand-muted-light font-semibold mt-1">
                  You haven't established your diagnostic baseline yet. Complete it to unlock custom 75Q practice sessions and study planners.
                </p>
              </div>
            </div>
            <Link
              to="/diagnostic"
              className="bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold px-5 py-3 rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              Take Diagnostic Test
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLS: Mastery standing & Study Plan */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Subject Mastery standing cards */}
            <div className="bg-white border border-brand-border-light rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-brand-border-light/40 pb-3">
                <h3 className="font-extrabold text-base text-brand-text-light">Syllabus Breakdown</h3>
                <p className="text-xs text-brand-muted-light font-medium mt-0.5">
                  Your performance categorized dynamically by rolling accuracy.
                </p>
              </div>

              {hasSubmissions ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Weak Pool */}
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-widest block mb-2">Weak Areas (&lt;40%)</span>
                      {weak.length > 0 ? (
                        <ul className="space-y-1.5 text-xs text-brand-text-light font-bold">
                          {weak.map(t => (
                            <li key={t.name} className="flex justify-between">
                              <span>{t.name}</span>
                              <span className="text-rose-500 font-extrabold">{t.accuracy}%</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-brand-muted-light italic">No weak topics! Great job.</span>
                      )}
                    </div>
                  </div>

                  {/* Moderate Pool */}
                  <div className="bg-amber-500/5 border border-brand-accent/25 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-brand-accent font-extrabold uppercase tracking-widest block mb-2">Moderate (40%-65%)</span>
                      {moderate.length > 0 ? (
                        <ul className="space-y-1.5 text-xs text-brand-text-light font-bold">
                          {moderate.map(t => (
                            <li key={t.name} className="flex justify-between">
                              <span>{t.name}</span>
                              <span className="text-brand-accent font-extrabold">{t.accuracy}%</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-brand-muted-light italic">No moderate topics.</span>
                      )}
                    </div>
                  </div>

                  {/* Strong Pool */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest block mb-2">Strong (&gt;=65%)</span>
                      {strong.length > 0 ? (
                        <ul className="space-y-1.5 text-xs text-brand-text-light font-bold">
                          {strong.map(t => (
                            <li key={t.name} className="flex justify-between">
                              <span>{t.name}</span>
                              <span className="text-emerald-500 font-extrabold">{t.accuracy}%</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-brand-muted-light italic">Keep practicing to build strong areas.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-brand-muted-light italic text-center py-6">
                  Diagnose your levels to see topic classification.
                </p>
              )}
            </div>

            {/* AI Study Plan Panel */}
            <div className="bg-white border border-brand-border-light rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-brand-border-light/40 pb-3 mb-6">
                <div>
                  <h3 className="font-extrabold text-base text-brand-text-light">Your Study Roadmap</h3>
                  <p className="text-xs text-brand-muted-light font-medium mt-0.5">
                    Personalized 2-week planner focusing on weakness mitigation.
                  </p>
                </div>
                <Calendar className="w-5 h-5 text-brand-accent" />
              </div>

              {studyPlan ? (
                <div className="space-y-4">
                  <div className="bg-brand-bg-light/35 border border-brand-border-light rounded-xl p-5 space-y-3">
                    <h4 className="font-extrabold text-sm text-brand-text-light flex items-center gap-1.5">
                      <ListTodo className="w-4 h-4 text-brand-accent" />
                      {studyPlan.title || "Custom Study Roadmap"}
                    </h4>
                    <p className="text-xs text-brand-muted-light font-medium leading-relaxed">
                      {studyPlan.overview}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {studyPlan.focus_areas?.map((area, idx) => (
                        <span key={idx} className="bg-amber-500/10 border border-brand-accent/20 text-brand-accent font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      to="/study-plan"
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors cursor-pointer"
                    >
                      Open Full 14-Day Calendar
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <p className="text-xs text-brand-muted-light max-w-sm mx-auto leading-relaxed">
                    Generate an AI-powered 2-week daily scheduler structured according to your weak subjects and targets.
                  </p>
                  <button
                    onClick={handleGeneratePlan}
                    disabled={generatingPlan}
                    className="bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold px-6 py-3 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 mx-auto"
                  >
                    {generatingPlan ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating Roadmap...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate AI Study Plan
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT 1 COL: Stats & Quick links */}
          <div className="space-y-8">
            {/* Quick Status Stats Card */}
            <div className="bg-white border border-brand-border-light rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-brand-text-light uppercase tracking-wider border-b border-brand-border-light/40 pb-2">
                Overall standing
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-brand-bg-light/25 border border-brand-border-light/40 rounded-xl p-4 text-center">
                  <span className="text-[10px] text-brand-muted-light font-bold uppercase tracking-wider block mb-1">Tests Done</span>
                  <span className="text-2xl font-extrabold text-brand-text-light">
                    {profile?.tests_completed || 0}
                  </span>
                </div>
                
                <div className="bg-brand-bg-light/25 border border-brand-border-light/40 rounded-xl p-4 text-center">
                  <span className="text-[10px] text-brand-muted-light font-bold uppercase tracking-wider block mb-1">Avg Accuracy</span>
                  <span className="text-2xl font-extrabold text-emerald-600">
                    {profile && Object.values(profile.mastery).some(t => t.attempts > 0)
                      ? (() => {
                          const attempted = Object.values(profile.mastery).filter(t => t.attempts > 0);
                          const totalAcc = attempted.reduce((acc, t) => {
                            const val = t.accuracy <= 1.0 && t.accuracy > 0.0 ? t.accuracy * 100 : t.accuracy;
                            return acc + val;
                          }, 0);
                          return Math.round(totalAcc / attempted.length);
                        })()
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* Extra micro-analytics or quotes */}
              <div className="bg-brand-bg-light/10 border border-brand-border-light/60 rounded-xl p-4 flex gap-2.5 items-start">
                <Award className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                <p className="text-[11px] text-brand-muted-light font-medium leading-relaxed">
                  "The secret to getting ahead is getting started. Continue solving tests to improve accuracy and speed metrics."
                </p>
              </div>
            </div>

            {/* Quick Links Menu */}
            <div className="bg-white border border-brand-border-light rounded-xl p-6 shadow-sm space-y-3">
              <h3 className="font-extrabold text-sm text-brand-text-light uppercase tracking-wider border-b border-brand-border-light/40 pb-2 mb-2">
                Quick Navigation
              </h3>
              
              <Link
                to="/test"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-brand-border-light hover:bg-brand-bg-light/20 transition-all text-xs font-bold text-brand-text-light cursor-pointer"
              >
                <span>Adaptive Practice test</span>
                <ArrowRight className="w-4 h-4 text-brand-muted-light" />
              </Link>
              
              <Link
                to="/profile"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-brand-border-light hover:bg-brand-bg-light/20 transition-all text-xs font-bold text-brand-text-light cursor-pointer"
              >
                <span>Full Mastery Profile</span>
                <ArrowRight className="w-4 h-4 text-brand-muted-light" />
              </Link>

              <Link
                to="/diagnostic"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-brand-border-light hover:bg-brand-bg-light/20 transition-all text-xs font-bold text-brand-text-light cursor-pointer"
              >
                <span>Retake Diagnostic test</span>
                <ArrowRight className="w-4 h-4 text-brand-muted-light" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
