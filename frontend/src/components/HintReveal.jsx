import React, { useState } from "react";
import { Lightbulb, ChevronRight, HelpCircle } from "lucide-react";

export default function HintReveal({ socraticFeedback }) {
  const [activeStage, setActiveStage] = useState(0); // 0: No hints revealed, 1: Hint 1, 2: Hint 2, 3: Hint 3, 4: Full explanation

  const handleNextStage = () => {
    if (activeStage < 4) {
      setActiveStage(activeStage + 1);
    }
  };

  const stages = [
    { label: "Need a hint?", btnText: "Reveal Hint 1" },
    { label: "Hint 1 Unlocked", text: socraticFeedback.hint1, btnText: "Reveal Hint 2" },
    { label: "Hint 2 Unlocked", text: socraticFeedback.hint2, btnText: "Reveal Hint 3 (Final Hint)" },
    { label: "Hint 3 Unlocked", text: socraticFeedback.hint3, btnText: "Reveal Worked Explanation" },
    { label: "Worked Explanation", text: socraticFeedback.final_explanation, btnText: null }
  ];

  return (
    <div className="w-full bg-brand-bg-light/60 border border-brand-border-light rounded-xl p-5 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-brand-accent animate-pulse" />
        <h4 className="text-sm font-bold text-brand-text-light uppercase tracking-wider">
          Socratic Study Assistant
        </h4>
      </div>

      <div className="space-y-4">
        {/* Render revealed hints */}
        {activeStage >= 1 && (
          <div className="bg-white border border-brand-border-light/50 rounded-lg p-3 shadow-xs">
            <span className="text-xs font-bold text-brand-accent uppercase block mb-1">Hint 1</span>
            <p className="text-sm text-brand-text-light/90 italic leading-relaxed">{socraticFeedback.hint1}</p>
          </div>
        )}

        {activeStage >= 2 && (
          <div className="bg-white border border-brand-border-light/50 rounded-lg p-3 shadow-xs">
            <span className="text-xs font-bold text-brand-accent uppercase block mb-1">Hint 2</span>
            <p className="text-sm text-brand-text-light/90 italic leading-relaxed">{socraticFeedback.hint2}</p>
          </div>
        )}

        {activeStage >= 3 && (
          <div className="bg-white border border-brand-border-light/50 rounded-lg p-3 shadow-xs">
            <span className="text-xs font-bold text-brand-accent uppercase block mb-1">Hint 3</span>
            <p className="text-sm text-brand-text-light/90 italic leading-relaxed">{socraticFeedback.hint3}</p>
          </div>
        )}

        {activeStage === 4 && (
          <div className="bg-amber-500/5 border border-brand-accent/35 rounded-lg p-4 shadow-xs">
            <span className="text-xs font-bold text-brand-accent uppercase block mb-1">Worked Explanation</span>
            <p className="text-sm text-brand-text-light leading-relaxed font-medium">
              {socraticFeedback.final_explanation}
            </p>
          </div>
        )}

        {/* Action Button */}
        {activeStage < 4 && (
          <div className="flex items-center justify-between pt-1 border-t border-brand-border-light/50 mt-2">
            <span className="text-xs text-brand-muted-light font-medium flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              {activeStage === 0 
                ? "Unlock hints one by one to solve it yourself!" 
                : `Showing ${activeStage} of 3 hints`
              }
            </span>
            <button
              onClick={handleNextStage}
              className="bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              {stages[activeStage].btnText}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
