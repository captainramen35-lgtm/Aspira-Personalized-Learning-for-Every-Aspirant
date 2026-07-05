import React from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import HintReveal from "../components/HintReveal";
import { CheckCircle2, XCircle, Award, ArrowRight, AlertTriangle, HelpCircle, Check, X } from "lucide-react";

export default function ResultPage() {
  const location = useLocation();
  const submissionData = location.state?.submissionData;

  if (!submissionData) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <HelpCircle className="w-16 h-16 text-brand-muted-light mb-4" />
          <h2 className="text-xl font-bold text-brand-text-light">No Result Data Found</h2>
          <p className="text-sm text-brand-muted-light mt-1 mb-6">Take a test to see your score analysis.</p>
          <Link
            to="/test"
            className="bg-brand-accent hover:bg-brand-accent-hover text-white px-6 py-3 rounded-xl font-bold transition-colors cursor-pointer text-sm"
          >
            Launch Practice Test
          </Link>
        </div>
      </div>
    );
  }

  const { score, total_questions, results } = submissionData;
  const accuracy = Math.round((score / total_questions) * 100);

  const getScoreMessage = (acc) => {
    if (acc >= 90) return "Excellent! Outstanding mastery shown.";
    if (acc >= 70) return "Great job! Keep working on your weak areas.";
    if (acc >= 50) return "Good attempt! Revisit the hints and explanation.";
    return "Needs improvement. Take time to work through the Socratic guides.";
  };

  return (
    <div className="min-h-screen bg-brand-bg-light flex flex-col pb-16">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 pt-10">
        
        {/* Score Summary Card */}
        <div className="bg-white rounded-xl border border-brand-border-light p-8 shadow-sm text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-brand-accent" />
          </div>

          <h1 className="text-3xl font-extrabold text-brand-text-light mb-1.5 tracking-tight">
            Session Completed
          </h1>
          <p className="text-sm font-bold text-brand-accent uppercase tracking-widest block mb-4">
            {score} / {total_questions} CORRECT ({accuracy}% accuracy)
          </p>

          <p className="text-sm text-brand-muted-light font-medium mb-6">
            {getScoreMessage(accuracy)}
          </p>

          <Link
            to="/profile"
            className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold px-6 py-3 rounded-xl transition-all shadow-xs cursor-pointer text-sm"
          >
            View Updated Profile
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Graded Questions List */}
        <h2 className="text-lg font-bold text-brand-text-light mb-4 uppercase tracking-wider">
          Review Questions
        </h2>

        <div className="space-y-6">
          {results.map((res, idx) => {
            const isCorrect = res.is_correct;
            const errorType = res.ai_score_details?.mistake_type;

            return (
              <div
                key={res.q_id}
                className={`bg-white rounded-xl border p-6 shadow-xs transition-all duration-300 ${
                  isCorrect ? "border-emerald-500/20" : "border-rose-500/20"
                }`}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between mb-4 border-b border-brand-border-light/40 pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted-light">
                    QUESTION {idx + 1} &bull; {res.subject} &bull; {res.topic}
                  </span>
                  
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                      isCorrect
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Correct
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" />
                        Incorrect
                      </>
                    )}
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-md font-bold text-brand-text-light mb-4 leading-relaxed">
                  {res.question_text}
                </h3>

                {/* Options Review */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {res.options.map((opt, oIdx) => {
                    const letter = ["A", "B", "C", "D"][oIdx];
                    const isSelected = res.student_answer === letter;
                    const isExpected = res.correct_answer === letter;

                    let optionBorder = "border-brand-border-light";
                    let optionBg = "bg-transparent";

                    if (isExpected) {
                      optionBorder = "border-emerald-500";
                      optionBg = "bg-emerald-500/5";
                    } else if (isSelected) {
                      optionBorder = "border-rose-500";
                      optionBg = "bg-rose-500/5";
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-semibold text-brand-text-light/95 ${optionBorder} ${optionBg}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                            isExpected
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : isSelected
                                ? "bg-rose-500 text-white border-rose-500"
                                : "bg-brand-bg-light/75 text-brand-text-light border-brand-border-light"
                          }`}
                        >
                          {letter}
                        </div>
                        <span className="truncate">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* AI Explanation / Feedback */}
                {!isCorrect ? (
                  <div className="mt-4 pt-4 border-t border-brand-border-light/40 space-y-4">
                    {/* Error type category pill */}
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-500">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Mistake style: {errorType} error</span>
                    </div>

                    <div className="bg-brand-bg-light/35 border border-brand-border-light/50 rounded-lg p-4">
                      <h4 className="text-xs font-bold text-brand-text-light uppercase tracking-wider mb-1.5">
                        AI Tutor Assessment
                      </h4>
                      <p className="text-sm text-brand-text-light/90 leading-relaxed font-medium">
                        {res.ai_score_details?.reasoning}
                      </p>
                    </div>

                    {/* Progressive Socratic Hints */}
                    {res.socratic_feedback && (
                      <HintReveal socraticFeedback={res.socratic_feedback} />
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 mt-2 text-sm text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Option {res.correct_answer} is correct. You spent {res.time_spent} seconds on this question.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
