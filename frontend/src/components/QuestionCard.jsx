import React from "react";

export default function QuestionCard({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer
}) {
  const optionsMap = ["A", "B", "C", "D"];

  const getDifficultyColor = (diff) => {
    switch (diff.toLowerCase()) {
      case "easy":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "hard":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-brand-border-light p-6 shadow-sm mb-6 transition-all duration-300">
      {/* Meta Header */}
      <div className="flex items-center justify-between mb-4 border-b border-brand-border-light/40 pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted-light">
          {question.subject} &bull; {question.topic}
        </span>
        <span
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getDifficultyColor(
            question.difficulty
          )}`}
        >
          {question.difficulty}
        </span>
      </div>

      {/* Index */}
      {currentIndex !== undefined && totalQuestions !== undefined && (
        <span className="text-xs font-bold text-brand-accent uppercase tracking-widest block mb-2">
          QUESTION {currentIndex} OF {totalQuestions}
        </span>
      )}

      {/* Question Text */}
      <h3 className="text-lg font-bold text-brand-text-light mb-6 leading-relaxed">
        {question.question_text}
      </h3>

      {/* Options List */}
      <div className="space-y-3">
        {question.options.map((opt, idx) => {
          const letter = optionsMap[idx];
          const isSelected = selectedAnswer === letter;

          return (
            <button
              key={idx}
              onClick={() => onSelectAnswer(letter)}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-brand-accent bg-amber-500/5 shadow-sm"
                  : "border-brand-border-light hover:border-brand-accent/50 hover:bg-brand-bg-light/40"
              }`}
            >
              {/* Circle Index */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors duration-200 ${
                  isSelected
                    ? "bg-brand-accent text-white border-brand-accent"
                    : "bg-brand-bg-light/75 text-brand-text-light border-brand-border-light"
                }`}
              >
                {letter}
              </div>

              {/* Option Text */}
              <span
                className={`text-sm font-semibold ${
                  isSelected ? "text-brand-text-light" : "text-brand-text-light/95"
                }`}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
