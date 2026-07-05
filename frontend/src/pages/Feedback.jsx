import React, { useState, useEffect } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import HintReveal from "../components/HintReveal";
import { Loader2, Calendar, FileText, CheckCircle2, XCircle, ChevronRight, Award } from "lucide-react";

export default function Feedback() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const res = await api.get("/api/mastery/submissions");
        setSubmissions(res.data);
        // Automatically select the first submission if available
        if (res.data && res.data.length > 0) {
          setSelectedSub(res.data[0]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load test history. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "None") return "Just now";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-light text-brand-text-light flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1a120e] mb-2">
            Socratic Feedback & Analysis
          </h1>
          <p className="text-brand-muted-light text-base">
            Review your past assessments, AI-audited mistake details, and unlock progressive hints.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-brand-accent mb-4" />
            <p className="text-brand-muted-light">Retrieving your test history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
            <p>{error}</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border-light p-12 text-center shadow-sm">
            <FileText className="w-16 h-16 mx-auto text-brand-muted-light/40 mb-4" />
            <h3 className="text-xl font-bold text-[#1a120e] mb-2">No test history found</h3>
            <p className="text-brand-muted-light mb-6">
              Complete the diagnostic test or generate a practice test to view detailed Socratic feedback.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Pane: Submissions List */}
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-lg font-bold text-[#1a120e] px-1">Past Assessments</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {submissions.map((sub) => {
                  const isSelected = selectedSub && selectedSub.submission_id === sub.submission_id;
                  const scorePercentage = sub.total_questions > 0 
                    ? Math.round((sub.score / sub.total_questions) * 100)
                    : 0;

                  return (
                    <button
                      key={sub.submission_id}
                      onClick={() => setSelectedSub(sub)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-brand-accent/5 border-brand-accent shadow-sm"
                          : "bg-white border-brand-border-light hover:border-brand-accent/40"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide ${
                            sub.test_type === "diagnostic"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : "bg-brand-accent/10 text-brand-accent border border-brand-accent/20"
                          }`}>
                            {sub.test_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-brand-muted-light">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(sub.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-[#1a120e]">
                            {sub.score} / {sub.total_questions}
                          </div>
                          <div className="text-[10px] text-brand-muted-light font-medium">
                            {scorePercentage}% Score
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? "text-brand-accent translate-x-0.5" : "text-brand-muted-light/60"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Pane: Selected Submission Details */}
            <div className="lg:col-span-7">
              {selectedSub ? (
                <div className="bg-white rounded-2xl border border-brand-border-light p-6 shadow-sm space-y-6">
                  {/* Test Summary Card */}
                  <div className="flex items-center justify-between pb-4 border-b border-brand-border-light">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                        {selectedSub.test_type} Results
                      </span>
                      <h3 className="text-xl font-black text-[#1a120e]">
                        {formatDate(selectedSub.created_at)}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2.5 bg-brand-accent/5 border border-brand-accent/20 px-4 py-2 rounded-xl">
                      <Award className="w-5 h-5 text-brand-accent" />
                      <div>
                        <div className="text-lg font-black text-[#1a120e]">
                          {selectedSub.score} / {selectedSub.total_questions}
                        </div>
                        <div className="text-[10px] font-bold text-brand-muted-light uppercase">
                          Score
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Socratic Question Analysis */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-brand-muted-light uppercase tracking-wider">
                      Question Breakdown & Explanations
                    </h4>
                    
                    {selectedSub.results && selectedSub.results.length > 0 ? (
                      <div className="space-y-6">
                        {selectedSub.results.map((res, index) => {
                          const isCorrect = res.is_correct;
                          return (
                            <div 
                              key={res.q_id || index}
                              className={`p-5 rounded-xl border ${
                                isCorrect 
                                  ? "bg-green-50/30 border-green-200" 
                                  : "bg-red-50/20 border-red-100"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                  <span className="text-xs font-bold text-brand-muted-light">
                                    Q{index + 1} • {res.topic}
                                  </span>
                                  {res.question_text && (
                                    <p className="text-sm font-semibold text-[#1a120e] mt-1">
                                      {res.question_text}
                                    </p>
                                  )}
                                </div>
                                {isCorrect ? (
                                  <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Correct
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Incorrect
                                  </span>
                                )}
                              </div>

                              {/* Student vs Correct Choice */}
                              <div className="flex gap-4 text-xs font-bold mb-4">
                                <div className="bg-white/80 border border-brand-border-light px-3 py-1.5 rounded-[8px]">
                                  Your Choice: <span className={isCorrect ? "text-green-600" : "text-red-600"}>{res.student_answer || "N/A"}</span>
                                </div>
                                <div className="bg-white/80 border border-brand-border-light px-3 py-1.5 rounded-[8px]">
                                  Correct Choice: <span className="text-green-600">{res.correct_answer}</span>
                                </div>
                                {res.time_spent && (
                                  <div className="bg-white/80 border border-brand-border-light px-3 py-1.5 rounded-[8px] text-brand-muted-light">
                                    Time: {Math.round(res.time_spent)}s
                                  </div>
                                )}
                              </div>

                              {/* AI Mistake Audits & Socratic Hints */}
                              {res.ai_score_details && (
                                <div className="bg-white/95 rounded-xl border border-brand-border-light p-4 mt-3 space-y-3 shadow-sm">
                                  {res.ai_score_details.mistake_type && (
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                        res.ai_score_details.mistake_type === "conceptual"
                                          ? "bg-orange-100 text-orange-700 border border-orange-200"
                                          : "bg-amber-100 text-amber-700 border border-amber-200"
                                      }`}>
                                        AI Mistake Audit: {res.ai_score_details.mistake_type}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {res.ai_score_details.reasoning && (
                                    <div className="text-xs text-brand-muted-light leading-relaxed">
                                      <strong className="text-[#1a120e] block mb-1">AI Explanation:</strong>
                                      {res.ai_score_details.reasoning}
                                    </div>
                                  )}

                                  {/* Socratic Hints System */}
                                  {!isCorrect && res.ai_score_details.socratic_hints && (
                                    <div className="pt-3 border-t border-brand-border-light mt-3">
                                      <HintReveal hints={res.ai_score_details.socratic_hints} />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-brand-bg-light rounded-xl border border-brand-border-light">
                        <p className="text-sm text-brand-muted-light">
                          No question-level Socratic hints generated for this submission yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white/50 border border-dashed border-brand-border-light rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center text-brand-muted-light">
                  <FileText className="w-12 h-12 mb-3 text-brand-muted-light/30" />
                  <p className="font-semibold text-[#1a120e] mb-1">Select an assessment</p>
                  <p className="text-xs">Click on any past test on the left to see Socratic tips and explanations.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
