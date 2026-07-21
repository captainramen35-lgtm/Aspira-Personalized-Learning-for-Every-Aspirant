import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  GraduationCap, BookOpen, Target, Brain, CheckCircle,
  ChevronRight, AlertCircle, Lightbulb
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const JEE_CHAPTERS = [
  "Physics", "Chemistry", "Mathematics",
  "Mechanics", "Thermodynamics", "Electromagnetism", "Optics",
  "Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry",
  "Calculus", "Algebra", "Coordinate Geometry", "Trigonometry"
];

const NEET_CHAPTERS = [
  "Physics", "Chemistry", "Biology",
  "Mechanics", "Thermodynamics", "Electromagnetism", "Optics",
  "Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry",
  "Human Physiology", "Genetics", "Plant Physiology", "Ecology"
];

const LEARNING_STYLES = [
  { value: "visual", label: "Visual — diagrams, charts, flowcharts" },
  { value: "reading", label: "Reading — textbooks, notes, theory" },
  { value: "practice", label: "Practice-first — solve, then review theory" },
  { value: "concept_first", label: "Concept-first — understand deeply, then practice" },
];

export default function OnboardingSurvey() {
  const { currentUser, getToken, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    target_exam: "",
    class_level: "",
    previous_coaching: "",
    difficult_subjects: [],
    learning_style: "",
    academic_goals: "",
    hours_per_day: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadExistingSurvey() {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await axios.get(`${BACKEND_URL}/api/auth/onboarding-survey`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.survey) {
          const s = res.data.survey;
          setForm({
            target_exam: s.target_exam || "",
            class_level: s.class_level || "",
            previous_coaching: s.previous_coaching || "",
            difficult_subjects: s.difficult_subjects || [],
            learning_style: s.learning_style || "",
            academic_goals: s.academic_goals || "",
            hours_per_day: s.hours_per_day || "",
          });
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error("Failed to load existing survey:", err);
        }
      }
    }
    loadExistingSurvey();
  }, [getToken]);

  function toggleSubject(subj) {
    setForm((f) => ({
      ...f,
      difficult_subjects: f.difficult_subjects.includes(subj)
        ? f.difficult_subjects.filter((s) => s !== subj)
        : [...f.difficult_subjects, subj],
    }));
  }

  async function handleSubmit() {
    if (!form.target_exam) return setError("Please select your target exam.");
    if (!form.academic_goals.trim()) return setError("Please share your academic goals.");

    try {
      setLoading(true);
      setError("");
      const token = await getToken();

      // Save survey to Firestore via backend
      await axios.post(
        `${BACKEND_URL}/api/auth/onboarding-survey`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (refreshProfile) {
        await refreshProfile();
      }

      navigate("/batch-selection");
    } catch (err) {
      console.error(err);
      setError("Failed to save your survey. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-brand-bg-dark text-white relative overflow-hidden">
      <div className="glowing-bg top-[-80px] left-[-80px]" />
      <div className="glowing-bg bottom-[-80px] right-[-80px]" style={{ animationDelay: "-5s" }} />

      {/* Header */}
      <div className="p-6 flex items-center gap-2 z-10 relative max-w-3xl mx-auto">
        <GraduationCap className="w-6 h-6 text-brand-accent" />
        <span className="text-lg font-bold">Aspira</span>
      </div>

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-6 mb-8 z-10 relative">
        <div className="flex items-center gap-2 mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <React.Fragment key={i}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i + 1 < step ? "bg-brand-accent border-brand-accent text-white" :
                i + 1 === step ? "border-brand-accent text-brand-accent" :
                "border-gray-700 text-gray-600"
              }`}>
                {i + 1 < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`flex-1 h-0.5 rounded-full transition-all ${i + 1 < step ? "bg-brand-accent" : "bg-gray-700"}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-gray-400">Step {step} of {totalSteps} — Tell us about yourself</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 z-10 relative pb-16">
        {userProfile?.status === "incomplete_profile_rejected" && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-400">Enrollment Rejected: Incomplete Profile</h3>
              <p className="text-xs text-rose-300 mt-1">
                Your previous enrollment request was rejected because your profile was missing necessary information. Please carefully review and complete all sections below so your teacher can better understand your needs.
              </p>
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl border border-brand-border-dark p-8 shadow-2xl">

          {error && (
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: Exam & Background ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-2xl font-extrabold">Your Target Exam</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">This shapes your entire learning experience on Aspira.</p>

                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">I'm preparing for</label>
                <div className="grid grid-cols-2 gap-4">
                  {["JEE", "NEET"].map((exam) => (
                    <button
                      key={exam}
                      onClick={() => setForm((f) => ({ ...f, target_exam: exam }))}
                      className={`p-5 rounded-xl border-2 transition-all text-left cursor-pointer ${
                        form.target_exam === exam
                          ? "border-brand-accent bg-brand-accent/10"
                          : "border-gray-700 hover:border-gray-500 bg-gray-800/30"
                      }`}
                    >
                      <div className="text-lg font-extrabold mb-1">{exam}</div>
                      <div className="text-xs text-gray-400">
                        {exam === "JEE" ? "Physics · Chemistry · Mathematics" : "Physics · Chemistry · Biology"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Current Class / Year</label>
                <div className="grid grid-cols-3 gap-3">
                  {["Class 11", "Class 12", "Dropper"].map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setForm((f) => ({ ...f, class_level: cls }))}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                        form.class_level === cls
                          ? "border-brand-accent bg-brand-accent/10 text-white"
                          : "border-gray-700 hover:border-gray-500 text-gray-400"
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Previous Coaching Experience</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: "yes", l: "Yes, I've had coaching" }, { v: "no", l: "No, self-studying" }].map(({ v, l }) => (
                    <button
                      key={v}
                      onClick={() => setForm((f) => ({ ...f, previous_coaching: v }))}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                        form.previous_coaching === v
                          ? "border-brand-accent bg-brand-accent/10 text-white"
                          : "border-gray-700 hover:border-gray-500 text-gray-400"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Subjects & Learning Style ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-2xl font-extrabold">Strengths & Weaknesses</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">This helps us prioritize what to focus on in your first test.</p>

                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Subjects / Topics I find difficult <span className="text-gray-600 normal-case font-normal">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(form.target_exam === "NEET" ? NEET_CHAPTERS : JEE_CHAPTERS).map((subj) => (
                    <button
                      key={subj}
                      onClick={() => toggleSubject(subj)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all cursor-pointer ${
                        form.difficult_subjects.includes(subj)
                          ? "border-brand-accent bg-brand-accent/15 text-brand-accent"
                          : "border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {form.difficult_subjects.includes(subj) && "✓ "}{subj}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">My preferred learning style</label>
                <div className="space-y-2">
                  {LEARNING_STYLES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setForm((f) => ({ ...f, learning_style: value }))}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                        form.learning_style === value
                          ? "border-brand-accent bg-brand-accent/10 text-white"
                          : "border-gray-700 hover:border-gray-500 text-gray-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Goals ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-2xl font-extrabold">Your Goals</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">Help us understand what success looks like for you.</p>

                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Academic goals & aspirations</label>
                <textarea
                  rows={4}
                  placeholder="e.g., I want to crack JEE Advanced and get into IIT Bombay CSE. I'm particularly weak in Calculus and want to reach at least 80% accuracy before the exam..."
                  value={form.academic_goals}
                  onChange={(e) => setForm((f) => ({ ...f, academic_goals: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-brand-border-dark rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Study hours per day (approx.)</label>
                <div className="grid grid-cols-4 gap-3">
                  {["1-2", "3-4", "5-6", "7+"].map((h) => (
                    <button
                      key={h}
                      onClick={() => setForm((f) => ({ ...f, hours_per_day: h }))}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                        form.hours_per_day === h
                          ? "border-brand-accent bg-brand-accent/10 text-white"
                          : "border-gray-700 hover:border-gray-500 text-gray-400"
                      }`}
                    >
                      {h} hrs
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 bg-brand-accent/5 border border-brand-accent/15 rounded-xl p-4">
                <Lightbulb className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  After completing your first diagnostic test, Aspira will generate a personalized study plan based on your responses here.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 font-semibold text-sm transition-all"
              >
                ← Back
              </button>
            ) : <div />}

            {step < totalSteps ? (
              <button
                onClick={() => {
                  if (step === 1) {
                    if (!form.target_exam) return setError("Please select your target exam.");
                    if (!form.class_level) return setError("Please select your current class.");
                    if (!form.previous_coaching) return setError("Please select your coaching experience.");
                  }
                  if (step === 2) {
                    if (!form.learning_style) return setError("Please select your preferred learning style.");
                  }
                  setError("");
                  setStep((s) => s + 1);
                }}
                className="flex items-center gap-2 px-8 py-3 bg-brand-accent hover:bg-brand-accent-hover rounded-xl font-bold text-sm text-white transition-all"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-accent/50 rounded-xl font-bold text-sm text-white transition-all"
              >
                {loading ? "Saving…" : "Finish & Browse Batches"} {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
