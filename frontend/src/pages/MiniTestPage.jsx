import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Play,
  Loader2,
  Sparkles,
  Award,
  ArrowRight
} from "lucide-react";

export default function MiniTestPage() {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get("subject") || "";
  const initialChapter = searchParams.get("chapter") || "";
  const initialTopic = searchParams.get("topic") || "";

  const [syllabus, setSyllabus] = useState(null);
  const [activeSubject, setActiveSubject] = useState(initialSubject);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [loading, setLoading] = useState(true);
  const [startingTest, setStartingTest] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadSyllabus() {
      try {
        const res = await api.get("/api/syllabus");
        setSyllabus(res.data);
        const subjects = Object.keys(res.data.subjects || {});
        
        let subToSelect = initialSubject;
        if (!subToSelect || !subjects.includes(subToSelect)) {
          subToSelect = subjects[0] || "Physics";
        }
        setActiveSubject(subToSelect);

        // Auto-expand chapter if provided
        if (initialChapter) {
          setExpandedChapters({ [initialChapter]: true });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load Mini Test syllabus structure.");
      } finally {
        setLoading(false);
      }
    }
    loadSyllabus();
  }, []);

  const toggleChapter = (chapterName) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterName]: !prev[chapterName]
    }));
  };

  const handleLaunchTest = async (chapterName, topicName = null) => {
    setStartingTest(true);
    setError("");
    try {
      const res = await api.post("/api/paper/generate", {
        subject: activeSubject,
        chapter: chapterName,
        topic: topicName,
        num_questions: 25,
        test_type: "mini"
      });

      const miniTestData = {
        paper_id: res.data.paper_id,
        questions: res.data.questions,
        test_type: "mini",
        subject: activeSubject,
        chapter: chapterName,
        topic: topicName
      };

      // Write to sessionStorage BEFORE navigating, as a reliable fallback
      // in case React Router location.state is wiped during the auth spinner re-render
      sessionStorage.setItem("aspira_active_mini_test", JSON.stringify(miniTestData));

      navigate("/mini-test/take", { state: miniTestData });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to launch Mini Test. Please try again.");
      setStartingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        </div>
      </div>
    );
  }

  const subjectsData = syllabus?.subjects || {};
  const currentSubjectData = subjectsData[activeSubject] || { chapters: [] };

  return (
    <div className="min-h-screen bg-brand-bg-light flex flex-col pb-16">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 pt-10 space-y-8">
        
        {/* Header */}
        <div className="bg-white border border-brand-border-light rounded-2xl p-6 md:p-8 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Mini Test Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-brand-text-light tracking-tight">
            Chapter & Topic Mini Tests
          </h1>
          <p className="text-sm text-brand-muted-light font-medium max-w-2xl leading-relaxed">
            Select a subject, chapter, or specific topic to start a targeted 25-question mini test. Build instant mastery data without needing a full diagnostic.
          </p>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm p-4 rounded-xl font-semibold mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Subject Selector Tabs */}
        <div className="flex items-center gap-3 border-b border-brand-border-light/60 pb-3 overflow-x-auto">
          {Object.keys(subjectsData).map((subName) => {
            const isActive = activeSubject === subName;
            return (
              <button
                key={subName}
                onClick={() => setActiveSubject(subName)}
                className={`px-6 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-brand-accent text-white shadow-md"
                    : "bg-white text-brand-text-light border border-brand-border-light hover:border-brand-accent/50"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                {subName} Mini Tests
              </button>
            );
          })}
        </div>

        {/* Chapter List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-extrabold text-brand-muted-light uppercase tracking-wider">
              {activeSubject} Syllabus ({currentSubjectData.chapter_count} Chapters &bull; {currentSubjectData.topic_count} Topics)
            </h3>
          </div>

          {currentSubjectData.chapters.map((chap) => {
            const isExpanded = !!expandedChapters[chap.name];

            return (
              <div
                key={chap.name}
                className="bg-white border border-brand-border-light rounded-xl overflow-hidden shadow-sm transition-all"
              >
                {/* Chapter Header Bar */}
                <div
                  onClick={() => toggleChapter(chap.name)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-brand-bg-light/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-brand-accent shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-brand-muted-light shrink-0" />
                    )}
                    <div>
                      <h4 className="font-extrabold text-base text-brand-text-light">
                        {chap.name}
                      </h4>
                      <span className="text-xs text-brand-muted-light font-semibold">
                        {chap.topic_count} Topics
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLaunchTest(chap.name);
                    }}
                    disabled={startingTest}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Test Entire Chapter
                  </button>
                </div>

                {/* Topics Accordion Body */}
                {isExpanded && (
                  <div className="bg-brand-bg-light/20 border-t border-brand-border-light/40 p-4 space-y-2">
                    {chap.topics.map((topic) => (
                      <div
                        key={topic.name}
                        className={`bg-white border ${
                          initialTopic === topic.name ? "border-brand-accent bg-amber-500/5" : "border-brand-border-light/60"
                        } rounded-lg p-3.5 flex items-center justify-between hover:border-brand-accent/40 transition-all`}
                      >
                        <div className="space-y-0.5">
                          <h5 className="font-extrabold text-sm text-brand-text-light">
                            {topic.name}
                          </h5>
                        </div>

                        <button
                          onClick={() => handleLaunchTest(chap.name, topic.name)}
                          disabled={startingTest}
                          className="bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          Take Mini Test
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
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
