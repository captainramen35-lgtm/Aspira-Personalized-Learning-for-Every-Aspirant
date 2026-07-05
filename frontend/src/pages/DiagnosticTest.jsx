import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import QuestionCard from "../components/QuestionCard";
import Navbar from "../components/Navbar";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function DiagnosticTest() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // q_id -> option
  const [timestamps, setTimestamps] = useState({}); // q_id -> cumulative seconds
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Track time spent per question
  const questionTimes = useRef({});
  const activeQuestionId = useRef(null);
  const lastTickTime = useRef(Date.now());

  useEffect(() => {
    // Fetch diagnostic questions
    async function loadQuestions() {
      try {
        const res = await api.get("/api/diagnostic/questions");
        setQuestions(res.data);
        
        // Initialize answer and time tracker structures
        const initialAnswers = {};
        const initialTimes = {};
        res.data.forEach((q) => {
          initialAnswers[q.id] = "";
          initialTimes[q.id] = 0;
        });
        setAnswers(initialAnswers);
        questionTimes.current = initialTimes;

        if (res.data.length > 0) {
          activeQuestionId.current = res.data[0].id;
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load diagnostic questions. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();

    // Start timer interval to track response speed
    lastTickTime.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTickTime.current) / 1000;
      lastTickTime.current = now;

      if (activeQuestionId.current) {
        questionTimes.current[activeQuestionId.current] = 
          (questionTimes.current[activeQuestionId.current] || 0) + deltaSec;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update which question is currently focused for timing tracking
  const handleSelectAnswer = (qId, option) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
    activeQuestionId.current = qId;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Verify all questions are answered
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      return setError(`Please answer all questions before submitting. (${unanswered.length} remaining)`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 className="w-12 h-12 text-brand-accent animate-spin mb-4" />
          <h2 className="text-xl font-bold text-brand-text-light">Loading Diagnostic Test...</h2>
          <p className="text-sm text-brand-muted-light mt-1">Preparing your assessment questions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg-light flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text-light mb-2">
            Diagnostic Assessment
          </h1>
          <p className="text-sm text-brand-muted-light font-medium">
            Answer all questions below to help us understand your strengths and areas for improvement.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm p-4 rounded-xl mb-6 font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Questions list */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} onClick={() => { activeQuestionId.current = q.id; }}>
              <QuestionCard
                question={q}
                currentIndex={idx + 1}
                totalQuestions={questions.length}
                selectedAnswer={answers[q.id]}
                onSelectAnswer={(option) => handleSelectAnswer(q.id, option)}
              />
            </div>
          ))}

          {/* Submit Action */}
          <div className="pt-4 pb-12 flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-accent/50 text-white font-extrabold text-sm px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-brand-accent/15 cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Mastery Profile...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Submit Diagnostic
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
