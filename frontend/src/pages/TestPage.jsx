import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import QuestionCard from "../components/QuestionCard";
import { Play, Loader2, ArrowRight, ArrowLeft, Send, CheckCircle2, Clock } from "lucide-react";

export default function TestPage() {
  const [testStarted, setTestStarted] = useState(false);
  const [paperId, setPaperId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  // Timing states
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const questionTimes = useRef({}); // q_id -> accumulated time in seconds
  const lastTickTime = useRef(Date.now());

  // Generate the custom personalized paper
  const handleStartTest = async () => {
    try {
      setGenerating(true);
      setError("");
      
      const res = await api.post("/api/paper/generate");
      setPaperId(res.data.paper_id);
      setQuestions(res.data.questions);
      
      // Initialize answer sheet and timers
      const initialAnswers = {};
      const initialTimes = {};
      res.data.questions.forEach((q) => {
        initialAnswers[q.id] = "";
        initialTimes[q.id] = 0;
      });
      
      setAnswers(initialAnswers);
      questionTimes.current = initialTimes;
      setTotalElapsedTime(0);
      setCurrentIdx(0);
      setTestStarted(true);
      
      lastTickTime.current = Date.now();
    } catch (err) {
      console.error(err);
      setError("Failed to generate personalized test paper. Have you taken the Diagnostic test?");
    } finally {
      setGenerating(false);
    }
  };

  // Timer Tick Hook
  useEffect(() => {
    if (!testStarted || questions.length === 0) return;

    lastTickTime.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTickTime.current) / 1000;
      lastTickTime.current = now;

      // Update total elapsed timer
      setTotalElapsedTime((prev) => prev + deltaSec);

      // Accumulate time for the currently active question
      const currentQuestionId = questions[currentIdx].id;
      questionTimes.current[currentQuestionId] = 
        (questionTimes.current[currentQuestionId] || 0) + deltaSec;
    }, 1000);

    return () => clearInterval(interval);
  }, [testStarted, currentIdx, questions]);

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

  const handleSubmit = async () => {
    // Check if all questions have been answered
    const unansweredCount = questions.filter((q) => !answers[q.id]).length;
    if (unansweredCount > 0) {
      return setError(`Please answer all questions before submitting. (${unansweredCount} unanswered)`);
    }

    try {
      setSubmitting(true);
      setError("");

      // Construct final integer timestamps
      const finalTimestamps = {};
      Object.keys(questionTimes.current).forEach((qid) => {
        finalTimestamps[qid] = Math.round(questionTimes.current[qid]);
      });

      const res = await api.post("/api/submit", {
        paper_id: paperId,
        answers,
        timestamps: finalTimestamps
      });

      // Redirect to results page, passing submission response data in navigation state
      navigate("/result", { state: { submissionData: res.data } });
    } catch (err) {
      console.error(err);
      setError("Failed to submit test. Please check your network and try again.");
      setSubmitting(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (generating) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 className="w-12 h-12 text-brand-accent animate-spin mb-4" />
          <h2 className="text-xl font-bold text-brand-text-light">Assembling Custom Paper...</h2>
          <p className="text-sm text-brand-muted-light mt-1">Weighting 60% of questions toward your weakest topics</p>
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
          <h2 className="text-2xl font-bold text-brand-text-light mb-2">Grading Test Submission</h2>
          <p className="text-sm text-brand-muted-light max-w-sm">
            Our AI Scorer and AI Auditor are evaluating your inputs and generating Socratic hints...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg-light flex flex-col pb-12">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 pt-10">
        
        {/* Launcher Screen (If test has not started) */}
        {!testStarted ? (
          <div className="bg-white rounded-xl border border-brand-border-light p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
              <Play className="w-8 h-8 text-brand-accent ml-1" />
            </div>

            <h1 className="text-3xl font-extrabold text-brand-text-light mb-3 tracking-tight">
              Adaptive Practice Session
            </h1>
            <p className="text-sm text-brand-muted-light max-w-md mx-auto mb-8 font-medium leading-relaxed">
              Generate a personalized 10-question practice test. The personalization engine uses your mastery history to weight 60% of questions toward your weakest chapters.
            </p>

            {error && (
              <div className="max-w-md mx-auto bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm p-4 rounded-xl mb-6 font-semibold flex items-center justify-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleStartTest}
              className="bg-brand-accent hover:bg-brand-accent-hover text-white font-extrabold px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-brand-accent/20 cursor-pointer text-sm"
            >
              Generate Personalized Test
            </button>
          </div>
        ) : (
          /* Active Test Screen */
          <div>
            {/* Header: Progress & Timer */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 mr-6">
                {/* Progress bar */}
                <div className="flex justify-between text-xs font-bold text-brand-muted-light mb-2">
                  <span>PROGRESS</span>
                  <span>{Math.round(((currentIdx + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-brand-border-light/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-accent transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 bg-white border border-brand-border-light rounded-xl px-4 py-2 text-sm font-bold text-brand-text-light shadow-xs shrink-0">
                <Clock className="w-4 h-4 text-brand-accent" />
                <span>{formatTime(totalElapsedTime)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm p-4 rounded-xl mb-6 font-semibold">
                {error}
              </div>
            )}

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
                  Submit Test
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
