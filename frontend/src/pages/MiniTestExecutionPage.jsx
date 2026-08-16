import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import QuestionCard from "../components/QuestionCard";
import { Loader2, ArrowRight, ArrowLeft, Send, Clock, Sparkles, BookOpen } from "lucide-react";

export default function MiniTestExecutionPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Read from location.state first; fall back to sessionStorage written by MiniTestPage
  // before navigation. This is necessary because RoleGuard's auth spinner can cause
  // a re-mount that wipes React Router's location.state.
  const resolvedData = (() => {
    if (location.state?.paper_id && location.state?.questions?.length > 0) {
      return location.state;
    }
    try {
      const stored = sessionStorage.getItem("aspira_active_mini_test");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.paper_id && parsed?.questions?.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  })();

  const paperId = resolvedData?.paper_id || "";
  const questions = resolvedData?.questions || [];
  const subject = resolvedData?.subject || "";
  const chapter = resolvedData?.chapter || "";
  const topic = resolvedData?.topic || "";

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const initAns = {};
    questions.forEach((q) => { initAns[q.id] = ""; });
    return initAns;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Timing states
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const questionTimes = useRef({}); // q_id -> accumulated time in seconds
  const lastTickTime = useRef(Date.now());

  // Initialize timers (only if we have valid data; redirect if not)
  useEffect(() => {
    if (!paperId || questions.length === 0) {
      // Only redirect if we genuinely have no data at all  
      // Give it a beat before redirecting, in case state is still resolving
      const t = setTimeout(() => {
        navigate("/mini-test", { replace: true });
      }, 500);
      return () => clearTimeout(t);
    }
    // Clear sessionStorage once we've successfully loaded the paper
    sessionStorage.removeItem("aspira_active_mini_test");
    const initialTimes = {};
    questions.forEach((q) => { initialTimes[q.id] = 0; });
    questionTimes.current = initialTimes;
    lastTickTime.current = Date.now();
  }, []);

  // Timer Tick Hook
  useEffect(() => {
    if (!paperId || questions.length === 0) return;

    lastTickTime.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTickTime.current) / 1000;
      lastTickTime.current = now;

      setTotalElapsedTime((prev) => prev + deltaSec);

      if (questions[currentIdx]) {
        const currentQuestionId = questions[currentIdx].id;
        questionTimes.current[currentQuestionId] = 
          (questionTimes.current[currentQuestionId] || 0) + deltaSec;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [paperId, currentIdx, questions]);

  const handleSelectAnswer = (option) => {
    if (!questions[currentIdx]) return;
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

  const handleSubmit = async () => {
    const unansweredCount = questions.filter((q) => !answers[q.id]).length;
    if (unansweredCount > 0) {
      return setError(`Please answer all questions before submitting. (${unansweredCount} unanswered)`);
    }

    try {
      setSubmitting(true);
      setError("");

      const finalTimestamps = {};
      Object.keys(questionTimes.current).forEach((qid) => {
        finalTimestamps[qid] = Math.round(questionTimes.current[qid]);
      });

      const res = await api.post("/api/submit", {
        paper_id: paperId,
        answers,
        timestamps: finalTimestamps
      });

      navigate("/result", { state: { submissionData: res.data } });
    } catch (err) {
      console.error(err);
      setError("Failed to submit Mini Test. Please check your network connection.");
      setSubmitting(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (submitting) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-16 h-16 text-brand-accent animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-brand-text-light mb-2">Grading Mini Test</h2>
          <p className="text-sm text-brand-muted-light max-w-sm font-medium">
            Evaluating your responses, computing topic accuracy, generating Socratic AI feedback, and updating your mastery profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg-light flex flex-col pb-12">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 pt-8">
        
        {/* Test Header Badge */}
        <div className="bg-white border border-brand-border-light rounded-xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              MINI TEST
            </div>
            <div className="text-sm font-bold text-brand-text-light flex items-center gap-2">
              <span>{subject}</span>
              <span className="text-brand-muted-light">&bull;</span>
              <span>{chapter}</span>
              {topic && (
                <>
                  <span className="text-brand-muted-light">&bull;</span>
                  <span className="text-brand-accent font-extrabold">{topic}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-brand-bg-light/60 border border-brand-border-light/60 rounded-lg px-3 py-1.5 text-xs font-bold text-brand-text-light shrink-0">
            <Clock className="w-3.5 h-3.5 text-brand-accent" />
            <span>{formatTime(totalElapsedTime)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-bold text-brand-muted-light mb-2">
            <span>QUESTION {currentIdx + 1} OF {questions.length}</span>
            <span>{Math.round(((currentIdx + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-brand-border-light/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-accent transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm p-4 rounded-xl mb-6 font-semibold">
            {error}
          </div>
        )}

        {/* Current Question */}
        {questions.length > 0 && currentIdx < questions.length && (
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
              Submit Mini Test
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
