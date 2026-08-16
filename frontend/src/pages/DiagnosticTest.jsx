import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import QuestionCard from "../components/QuestionCard";
import Navbar from "../components/Navbar";
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Send, Clock } from "lucide-react";

export default function DiagnosticTest() {
  const [selectedSubject, setSelectedSubject] = useState(null); // 'Physics', 'Chemistry', 'Biology', 'Mathematics'
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // q_id -> option
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Timing states
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const questionTimes = useRef({}); // q_id -> accumulated seconds
  const lastTickTime = useRef(Date.now());

  const loadQuestions = async (subject) => {
    try {
      setLoading(true);
      setError("");
      setSelectedSubject(subject);

      const res = await api.get(`/api/diagnostic/questions?subject=${subject}`);
      setQuestions(res.data);
      
      const initialAnswers = {};
      const initialTimes = {};
      res.data.forEach((q) => {
        initialAnswers[q.id] = "";
        initialTimes[q.id] = 0;
      });
      setAnswers(initialAnswers);
      questionTimes.current = initialTimes;
      setTotalElapsedTime(0);
      setCurrentIdx(0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to load diagnostic questions. Please try again.");
      setSelectedSubject(null);
    } finally {
      setLoading(false);
    }
  };

  // Timer Tick Hook
  useEffect(() => {
    if (loading || questions.length === 0 || submitting) return;

    lastTickTime.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTickTime.current) / 1000;
      lastTickTime.current = now;

      // Update total elapsed timer
      setTotalElapsedTime((prev) => prev + deltaSec);

      // Accumulate time for current active question
      const currentQuestionId = questions[currentIdx].id;
      questionTimes.current[currentQuestionId] = 
        (questionTimes.current[currentQuestionId] || 0) + deltaSec;
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, currentIdx, questions, submitting]);

  const handleSelectAnswer = (option) => {
    const qId = questions[currentIdx].id;
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    // Verify all questions are answered
    const unansweredCount = questions.filter((q) => !answers[q.id]).length;
    if (unansweredCount > 0) {
      return setError(`Please answer all questions before submitting. (${unansweredCount} unanswered)`);
    }

    try {
      setSubmitting(true);
      // Construct final timestamps dict
      const finalTimestamps = {};
      Object.keys(questionTimes.current).forEach((qid) => {
        finalTimestamps[qid] = Math.round(questionTimes.current[qid]);
      });

      await api.post("/api/diagnostic/submit", {
        answers,
        timestamps: finalTimestamps
      });

      // Redirect to profile to see the created mastery profile
      navigate("/profile");
    } catch (err) {
      console.error(err);
      setError("Failed to submit diagnostic assessment. Please try again.");
      setSubmitting(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!selectedSubject && !loading) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex flex-col pb-12">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto w-full px-6 pt-10">
          <div className="bg-white rounded-xl border border-brand-border-light p-8 shadow-sm text-center mb-8">
            <h1 className="text-3xl font-extrabold text-brand-text-light mb-3 tracking-tight">
              Subject Diagnostic Assessment
            </h1>
            <p className="text-sm text-brand-muted-light max-w-md mx-auto leading-relaxed">
              Select a subject to take a focused 30-question diagnostic test to benchmark your chapter-level mastery.
            </p>
            {error && (
              <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm p-4 rounded-xl font-semibold">
                {error}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => loadQuestions("Physics")}
              className="bg-white border border-brand-border-light hover:border-brand-accent rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
            >
              <span className="text-[10px] font-extrabold text-brand-accent uppercase tracking-widest block mb-1">
                30 Questions &bull; 45 Mins
              </span>
              <h3 className="text-xl font-bold text-brand-text-light group-hover:text-brand-accent transition-colors">
                Physics Diagnostic
              </h3>
              <p className="text-xs text-brand-muted-light mt-2 leading-relaxed">
                Evaluates Kinematics, Thermodynamics, Optics, Modern Physics, Electrostatics, and Magnetism.
              </p>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-brand-accent">
                Start Assessment <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div
              onClick={() => loadQuestions("Chemistry")}
              className="bg-white border border-brand-border-light hover:border-brand-accent rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
            >
              <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-1">
                30 Questions &bull; 45 Mins
              </span>
              <h3 className="text-xl font-bold text-brand-text-light group-hover:text-amber-500 transition-colors">
                Chemistry Diagnostic
              </h3>
              <p className="text-xs text-brand-muted-light mt-2 leading-relaxed">
                Evaluates Organic, Inorganic, Physical, Chemical Bonding, and Equilibrium.
              </p>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-amber-500">
                Start Assessment <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div
              onClick={() => loadQuestions("Biology")}
              className="bg-white border border-brand-border-light hover:border-brand-accent rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
            >
              <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest block mb-1">
                30 Questions &bull; NEET Specific
              </span>
              <h3 className="text-xl font-bold text-brand-text-light group-hover:text-emerald-500 transition-colors">
                Biology Diagnostic
              </h3>
              <p className="text-xs text-brand-muted-light mt-2 leading-relaxed">
                Evaluates Genetics, Human Physiology, Botany, Ecology, and Cell Biology.
              </p>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-emerald-500">
                Start Assessment <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 className="w-12 h-12 text-brand-accent animate-spin mb-4" />
          <h2 className="text-xl font-bold text-brand-text-light">Loading {selectedSubject} Diagnostic...</h2>
          <p className="text-sm text-brand-muted-light mt-1">Preparing your 30-question assessment</p>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-16 h-16 text-brand-accent animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-brand-text-light mb-2">Analyzing Assessment</h2>
          <p className="text-sm text-brand-muted-light max-w-sm">
            Generating your personalized rolling mastery profile and building Socratic recommendations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg-light flex flex-col pb-12">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 pt-10">
        
        {/* Page Header */}
        <div className="mb-6 flex justify-between items-end border-b border-brand-border-light pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-brand-text-light">
              Diagnostic Assessment
            </h1>
            <p className="text-xs text-brand-muted-light font-medium mt-1">
              Complete this 25-question test to establish your initial mastery baseline.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white border border-brand-border-light rounded-xl px-4 py-2 text-sm font-bold text-brand-text-light shadow-xs shrink-0">
            <Clock className="w-4 h-4 text-brand-accent" />
            <span>{formatTime(totalElapsedTime)}</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm p-4 rounded-xl mb-6 font-semibold animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-[10px] font-bold text-brand-muted-light mb-1.5">
            <span>PROGRESS</span>
            <span>{Math.round(((currentIdx + 1) / questions.length) * 100)}% ({currentIdx + 1}/{questions.length})</span>
          </div>
          <div className="w-full h-2 bg-brand-border-light/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-accent transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Question */}
        {questions.length > 0 && (
          <QuestionCard
            question={questions[currentIdx]}
            currentIndex={currentIdx + 1}
            totalQuestions={questions.length}
            selectedAnswer={answers[questions[currentIdx].id]}
            onSelectAnswer={handleSelectAnswer}
          />
        )}

        {/* Navigation Actions */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 bg-white hover:bg-brand-bg-light/40 border border-brand-border-light disabled:opacity-50 text-brand-text-light px-5 py-3 rounded-xl font-bold transition-all shadow-xs cursor-pointer text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white px-5 py-3 rounded-xl font-bold transition-all shadow-xs cursor-pointer text-sm"
            >
              Next Question
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-extrabold transition-all shadow-xs cursor-pointer text-sm"
            >
              <Send className="w-4 h-4" />
              Submit Diagnostic
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
