import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Play, Lightbulb, Target, TrendingUp, Cpu, Award, ArrowRight, Check } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("diagnostic");

  const tabs = [
    { id: "diagnostic", label: "Diagnostic" },
    { id: "adaptive", label: "Adaptive Testing" },
    { id: "socratic", label: "Socratic Feedback" },
    { id: "tracking", label: "Progress Tracking" }
  ];

  return (
    <div className="min-h-screen bg-brand-bg-dark text-brand-text-dark flex flex-col relative overflow-hidden pb-12">
      {/* Background decoration glow */}
      <div className="glowing-bg top-[-200px] left-[15%]"></div>
      <div className="glowing-bg bottom-[-200px] right-[10%]" style={{ animationDelay: "-3s" }}></div>

      <Navbar />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto w-full px-6 text-center pt-20 pb-16 z-10">
        
        {/* Top welcome link badge */}
        <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-brand-accent/20 px-3 py-1.5 rounded-full mb-8 hover:bg-amber-500/15 transition-all cursor-pointer">
          <span className="text-xs font-bold text-brand-accent">Personalized learning, built for you</span>
          <ArrowRight className="w-3.5 h-3.5 text-brand-accent" />
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Learn smarter, <br />
          not <span className="text-brand-accent">harder</span>.
        </h1>

        {/* Subtitle */}
        <p className="text-sm md:text-base text-gray-400 max-w-xl mx-auto font-medium leading-relaxed mb-10">
          Aspira uses adaptive diagnostics and Socratic feedback to build a study path that's uniquely yours — so every hour of preparation actually counts.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-brand-accent/20 border border-brand-accent/10 text-sm cursor-pointer"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="bg-transparent hover:bg-white/5 border border-brand-border-dark text-white font-bold px-7 py-3.5 rounded-xl transition-all text-sm cursor-pointer"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Why Aspira? Section */}
      <div id="about" className="max-w-6xl mx-auto w-full px-6 py-16 z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4">
            Why <span className="text-brand-accent">Aspira</span>?
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Most study platforms treat every student the same. Aspira doesn't. We combine a diagnostic-first approach with Socratic pedagogy to create a learning experience that genuinely adapts — so you spend less time guessing what to study and more time actually learning.
          </p>
        </div>

        {/* Three Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-card rounded-2xl border border-brand-border-dark p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-brand-accent/20 flex items-center justify-center mb-5">
              <Target className="w-6 h-6 text-brand-accent" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Diagnostic-first</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              Pinpoint exactly where you stand before you begin, eliminating wasted effort.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card rounded-2xl border border-brand-border-dark p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-brand-accent/20 flex items-center justify-center mb-5">
              <Lightbulb className="w-6 h-6 text-brand-accent" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Socratic method</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              Progressive hints guide your thinking instead of handing you the answer.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card rounded-2xl border border-brand-border-dark p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-brand-accent/20 flex items-center justify-center mb-5">
              <TrendingUp className="w-6 h-6 text-brand-accent" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Adaptive paths</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              Content and difficulty adjust in real-time, matching your growth trajectory.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Tabs Mockup Section */}
      <div id="works" className="max-w-4xl mx-auto w-full px-6 py-16 z-10">
        
        {/* Tab switcher buttons */}
        <div className="flex items-center justify-center bg-[#17100b] p-1 rounded-xl border border-brand-border-dark max-w-md mx-auto mb-10 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-brand-accent text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Tab Content (with Browser Mockup) */}
        <div className="text-center transition-all duration-300">
          {activeTab === "diagnostic" && (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Know exactly where you stand</h3>
              <p className="text-sm text-gray-400 max-w-lg mx-auto font-medium leading-relaxed mb-8">
                A targeted assessment that maps your strengths and gaps across every topic — so you never waste time on what you already know.
              </p>
              
              {/* Browser mockup card */}
              <div className="w-full bg-[#18110c] border border-brand-border-dark rounded-2xl overflow-hidden shadow-2xl text-left max-w-xl mx-auto">
                <div className="bg-[#100b08] px-4 py-3 border-b border-brand-border-dark flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-xs text-gray-500 font-mono select-none">aspira.app/test</span>
                </div>
                <div className="p-6">
                  <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest block mb-1">
                    Question 2 of 5
                  </span>
                  <div className="w-full h-1 bg-[#2d1c13] rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-brand-accent w-2/5" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-4">
                    A body is moving with uniform velocity. What is the net force acting on it?
                  </h4>
                  <div className="space-y-2">
                    <div className="border border-brand-border-dark rounded-lg p-2.5 text-xs text-gray-300 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#2d1c13] flex items-center justify-center font-bold text-gray-400 text-[10px]">A</span>
                      <span>Zero</span>
                    </div>
                    <div className="border border-brand-border-dark rounded-lg p-2.5 text-xs text-gray-300 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#2d1c13] flex items-center justify-center font-bold text-gray-400 text-[10px]">B</span>
                      <span>Non-zero constant</span>
                    </div>
                    <div className="border border-brand-accent bg-brand-accent/5 rounded-lg p-2.5 text-xs text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-accent flex items-center justify-center font-bold text-white text-[10px]">C</span>
                      <span>Variable</span>
                    </div>
                    <div className="border border-brand-border-dark rounded-lg p-2.5 text-xs text-gray-300 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#2d1c13] flex items-center justify-center font-bold text-gray-400 text-[10px]">D</span>
                      <span>Cannot be determined</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "adaptive" && (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Targeted learning sessions</h3>
              <p className="text-sm text-gray-400 max-w-lg mx-auto font-medium leading-relaxed mb-8">
                Aspira's personalization engine dynamically compiles papers weighting 60% of questions toward your weakest chapters, and 40% from your strong chapters.
              </p>
              <div className="bg-[#18110c] border border-brand-border-dark rounded-2xl p-6 text-left max-w-xl mx-auto shadow-2xl">
                <h4 className="text-sm font-bold text-white mb-3">Adaptive Paper Compiler</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-[#2d1c13]/30 p-2.5 rounded-lg border border-brand-border-dark/60 text-gray-300">
                    <span>Weak Topic: Electrochemistry (60% Weight)</span>
                    <span className="text-brand-accent font-bold">6 Questions Added</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#2d1c13]/30 p-2.5 rounded-lg border border-brand-border-dark/60 text-gray-300">
                    <span>Moderate/Strong Topic: Mechanics (40% Weight)</span>
                    <span className="text-brand-accent font-bold">4 Questions Added</span>
                  </div>
                  <div className="bg-amber-500/10 border border-brand-accent/20 p-3 rounded-lg text-brand-accent font-semibold flex items-center gap-2 mt-4">
                    <Cpu className="w-4 h-4" />
                    <span>Generated a personalized 10-question practice test matching your current weaknesses!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "socratic" && (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Socratic Hinting System</h3>
              <p className="text-sm text-gray-400 max-w-lg mx-auto font-medium leading-relaxed mb-8">
                Instead of immediately feeding you the worked answer, Aspira generates 3 progressive hints leading you to self-solve the problem.
              </p>
              <div className="bg-[#18110c] border border-brand-border-dark rounded-2xl p-6 text-left max-w-xl mx-auto shadow-2xl space-y-3 text-xs">
                <div className="border border-brand-border-dark bg-[#100b08] p-3 rounded-lg">
                  <span className="text-[10px] font-bold text-brand-accent uppercase block mb-1">Hint 1</span>
                  <p className="text-gray-300 italic">"What are the forces acting on the block along the inclined plane?"</p>
                </div>
                <div className="border border-brand-border-dark bg-[#100b08] p-3 rounded-lg opacity-80">
                  <span className="text-[10px] font-bold text-brand-accent uppercase block mb-1">Hint 2</span>
                  <p className="text-gray-400 italic">"Recall the formula for static friction. How does it balance the gravity component?"</p>
                </div>
                <div className="border border-brand-border-dark bg-[#100b08] p-3 rounded-lg opacity-50">
                  <span className="text-[10px] font-bold text-brand-accent uppercase block mb-1">Hint 3 (Lock Icon)</span>
                  <p className="text-gray-500 italic">"Click unlock to reveal the mathematical connection..."</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tracking" && (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Continuously Evolving Mastery</h3>
              <p className="text-sm text-gray-400 max-w-lg mx-auto font-medium leading-relaxed mb-8">
                Every test updates your Mastery Profile. The AI Auditor verifies correctness, speed trends are tracked, and dashboards update automatically.
              </p>
              <div className="bg-[#18110c] border border-brand-border-dark rounded-2xl p-6 text-left max-w-xl mx-auto shadow-2xl space-y-4">
                <h4 className="text-sm font-bold text-white">Mastery Analytics Update</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Mechanics</span>
                      <span className="text-emerald-500 font-bold">88% (Strong) &uarr;</span>
                    </div>
                    <div className="w-full h-2 bg-[#2d1c13] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[88%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Calculus</span>
                      <span className="text-brand-accent font-bold">45% (Moderate) &uarr;</span>
                    </div>
                    <div className="w-full h-2 bg-[#2d1c13] rounded-full overflow-hidden">
                      <div className="h-full bg-brand-accent w-[45%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Electrochemistry</span>
                      <span className="text-rose-500 font-bold">34% (Weak)</span>
                    </div>
                    <div className="w-full h-2 bg-[#2d1c13] rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 w-[34%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
