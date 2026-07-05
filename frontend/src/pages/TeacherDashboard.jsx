import React, { useState, useEffect } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import StudentTable from "../components/StudentTable";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Loader2, Users, AlertTriangle, ArrowLeft, ShieldAlert, Award, Clock, FileText } from "lucide-react";

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  // 1. Fetch Class-wide analytics on mount
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get("/api/teacher/analytics");
        setClassData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load class analytics. Ensure you are registered as a Teacher.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  // 2. Fetch Selected Student Details
  const handleSelectStudent = async (studentId) => {
    if (studentId === selectedStudentId) {
      // Toggle off selection to show Class Pulse
      setSelectedStudentId(null);
      setStudentDetail(null);
      return;
    }

    setSelectedStudentId(studentId);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/api/teacher/student/${studentId}`);
      setStudentDetail(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load details for the selected student.");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Topic bar chart config (Class average mastery)
  const getTopicBarChart = () => {
    if (!classData) return null;
    
    const labels = classData.weakest_topics.map((item) => item.topic);
    const dataValues = classData.weakest_topics.map((item) => item.avg_accuracy);

    const colors = dataValues.map((v) => (v >= 65 ? "#10b981" : v >= 40 ? "#d97706" : "#ef4444"));

    const data = {
      labels,
      datasets: [
        {
          label: "Class Average Mastery (%)",
          data: dataValues,
          backgroundColor: colors,
          borderRadius: 6,
          barThickness: 24
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { color: "#7c6a5f" },
          grid: { color: "#dfd3c340" }
        },
        x: {
          ticks: { color: "#2c1b12", font: { size: 10, weight: "600" } },
          grid: { display: false }
        }
      }
    };

    return <Bar data={data} options={options} />;
  };

  // Pie chart config (Strong vs Weak standing)
  const getPieChart = () => {
    if (!classData) return null;

    const data = {
      labels: ["Strong (Avg >= 60%)", "Weak (Avg < 60%)"],
      datasets: [
        {
          data: [classData.strong_weak_ratio.strong, classData.strong_weak_ratio.weak],
          backgroundColor: ["#10b981", "#ef4444"],
          borderColor: ["#ffffff", "#ffffff"],
          borderWidth: 2
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#2c1b12", font: { family: "Outfit", size: 11, weight: "600" } }
        }
      }
    };

    return <Pie data={data} options={options} />;
  };

  // Renders the horizontal progress bars for a selected student's topics
  const renderStudentMasteryBars = (mastery) => {
    return (
      <div className="space-y-4">
        {Object.keys(mastery).map((topic) => {
          const tdata = mastery[topic];
          const acc = tdata.accuracy;
          
          let progressColor = "bg-amber-500";
          let labelColor = "text-amber-600";
          if (acc >= 65) {
            progressColor = "bg-emerald-500";
            labelColor = "text-emerald-600";
          } else if (acc < 40) {
            progressColor = "bg-rose-500";
            labelColor = "text-rose-500";
          }

          return (
            <div key={topic} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-brand-text-light">{topic}</span>
                <span className={labelColor}>{acc}%</span>
              </div>
              <div className="w-full h-2.5 bg-brand-bg-light/40 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                  style={{ width: `${Math.max(acc, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg-light flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <Loader2 className="w-12 h-12 text-brand-accent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg-light flex flex-col h-screen overflow-hidden">
      <Navbar />

      {/* Main Layout Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Roster */}
        <div className="w-80 h-full shrink-0">
          {classData && (
            <StudentTable
              students={classData.roster}
              selectedStudentId={selectedStudentId}
              onSelectStudent={handleSelectStudent}
            />
          )}
        </div>

        {/* Right Side: Analytical Canvas */}
        <div className="flex-1 h-full overflow-y-auto p-8">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm p-4 rounded-xl mb-6 font-semibold">
              {error}
            </div>
          )}

          {/* LOADING STUDENT DETAILS STATE */}
          {loadingDetail ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-brand-accent animate-spin mb-3" />
              <p className="text-sm text-brand-muted-light font-medium">Fetching student insights...</p>
            </div>
          ) : studentDetail ? (
            /* Selected Student Detail View */
            <div className="space-y-6">
              {/* Header Action bar */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleSelectStudent(selectedStudentId)}
                  className="flex items-center gap-1.5 text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Class Pulse
                </button>
              </div>

              {/* Student Header Card */}
              <div className="bg-white rounded-xl border border-brand-border-light p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-brand-text-light">{studentDetail.name}</h2>
                    <p className="text-xs text-brand-muted-light font-bold mt-1 uppercase tracking-wider">
                      {studentDetail.tests_completed} tests completed &bull; last active today
                    </p>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 bg-brand-bg-light/80 border border-brand-border-light text-brand-muted-light text-xs font-bold px-3 py-1.5 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      SPEED: {studentDetail.speed.status}
                    </span>
                    <span className="bg-amber-500/10 border border-brand-accent/25 text-brand-accent text-xs font-extrabold px-3 py-1.5 rounded-lg">
                      50th percentile
                    </span>
                  </div>
                </div>

                {/* Progress bars inside student card */}
                <div className="mt-8">
                  <h3 className="text-sm font-bold text-brand-text-light uppercase tracking-wider mb-4 border-b border-brand-border-light/40 pb-2">
                    Subject Mastery Profile
                  </h3>
                  {renderStudentMasteryBars(studentDetail.mastery)}
                </div>

                {/* AI Mistake Patterns */}
                <div className="mt-8 bg-brand-bg-light/45 border border-brand-border-light rounded-xl p-5">
                  <h3 className="text-xs font-bold text-brand-text-light uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-brand-accent" />
                    RECURRING MISTAKE PATTERNS
                  </h3>
                  <ul className="space-y-2 text-sm text-brand-text-light font-medium pl-2">
                    {studentDetail.mistake_patterns.map((pattern, pIdx) => (
                      <li key={pIdx} className="flex gap-2">
                        <span className="text-brand-accent font-bold">&bull;</span>
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* DEFAULT: Class Pulse Overview */
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-brand-accent uppercase tracking-wider block mb-1">
                  Class Analytics
                </span>
                <h1 className="text-3xl font-extrabold text-brand-text-light tracking-tight">
                  Class Pulse
                </h1>
              </div>

              {/* Grid: Bar Chart + Pie Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart (2/3 width) */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-brand-border-light p-6 shadow-sm flex flex-col">
                  <h3 className="text-sm font-bold text-brand-text-light uppercase tracking-wider mb-1">
                    Topic-wise average mastery
                  </h3>
                  <p className="text-xs text-brand-muted-light mb-4 font-semibold">
                    Across all students - lowest average is <span className="text-rose-500">Calculus (45%)</span>, a class-wide gap.
                  </p>
                  <div className="h-64 flex-1">
                    {getTopicBarChart()}
                  </div>
                </div>

                {/* Pie Chart (1/3 width) */}
                <div className="bg-white rounded-xl border border-brand-border-light p-6 shadow-sm flex flex-col">
                  <h3 className="text-sm font-bold text-brand-text-light uppercase tracking-wider mb-1">
                    Weak / strong distribution
                  </h3>
                  <p className="text-xs text-brand-muted-light mb-4 font-semibold">
                    How the batch splits by overall standing.
                  </p>
                  <div className="h-64 flex-1 flex items-center justify-center">
                    {getPieChart()}
                  </div>
                </div>
              </div>

              {/* Flagged This Week Card */}
              <div className="bg-white rounded-xl border border-brand-border-light p-6 shadow-sm">
                <h3 className="text-xs font-bold text-brand-text-light uppercase tracking-wider mb-2">
                  Flagged this week
                </h3>
                {classData && classData.flagged_students.length > 0 ? (
                  <div className="space-y-4 mt-4">
                    <p className="text-xs text-brand-muted-light font-semibold">
                      {classData.flagged_students.length} students showing signs of risk - worth a nudge.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {classData.flagged_students.map((student) => (
                        <div
                          key={student.student_id}
                          onClick={() => handleSelectStudent(student.student_id)}
                          className="border border-rose-500/20 bg-rose-500/5 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-rose-500/10 transition-all"
                        >
                          <div>
                            <span className="font-bold text-sm text-brand-text-light block">
                              {student.name}
                            </span>
                            <span className="text-xs text-brand-muted-light">
                              Declining in: {student.declining_topics.join(", ")}
                            </span>
                          </div>
                          <AlertTriangle className="w-5 h-5 text-rose-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-brand-muted-light font-semibold mb-3">
                      0 students showing signs of risk - worth a nudge.
                    </p>
                    <p className="text-sm text-brand-text-light/80 font-medium">
                      No students currently flagged. Nice work.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
