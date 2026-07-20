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
import {
  Loader2,
  Users,
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
  Clock,
  Plus,
  Edit2,
  Archive,
  Check,
  X,
  ChevronRight,
  Eye,
  BookOpen,
  ArrowRight,
  Book,
  Sparkles,
  CheckCircle2,
  FileText
} from "lucide-react";

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
  // Tabs: 'pulse' | 'batches' | 'requests'
  const [activeTab, setActiveTab] = useState("pulse");

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Tab 1: Class Pulse (Analytics)
  const [classData, setClassData] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Tab 2: Batch Management
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null); // null for create, batch object for edit
  const [batchForm, setBatchForm] = useState({
    name: "",
    target_exam: "JEE",
    capacity: 50,
    syllabus_notes: ""
  });

  // Tab 3: Enrollment Requests
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null); // request object for detailed view/decision
  const [decisionMode, setDecisionMode] = useState(""); // 'approve' | 'reassign' | 'reject'
  const [decisionForm, setDecisionForm] = useState({
    reason: "",
    target_batch_id: ""
  });
  const [processingDecision, setProcessingDecision] = useState(false);

  // Initial fetch on mount
  useEffect(() => {
    fetchClassAnalytics();
    fetchBatches();
    fetchRequests();
  }, []);

  // Clear messages after 4 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // --- API FETCHERS ---

  const fetchClassAnalytics = async () => {
    try {
      const res = await api.get("/api/teacher/analytics");
      setClassData(res.data);
    } catch (err) {
      console.error(err);
      // Don't show global error if they haven't set up any students yet
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await api.get("/api/batches");
      setBatches(res.data.batches || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch batches.");
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await api.get("/api/enrollment/requests");
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch enrollment requests.");
    } finally {
      setLoadingRequests(false);
    }
  };

  // --- EVENT HANDLERS: Class Pulse ---

  const handleSelectStudent = async (studentId) => {
    if (studentId === selectedStudentId) {
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

  // --- EVENT HANDLERS: Batch Management ---

  const handleOpenCreateBatch = () => {
    setEditingBatch(null);
    setBatchForm({
      name: "",
      target_exam: "JEE",
      capacity: 50,
      syllabus_notes: ""
    });
    setShowBatchModal(true);
  };

  const handleOpenEditBatch = (batch) => {
    setEditingBatch(batch);
    setBatchForm({
      name: batch.name,
      target_exam: batch.target_exam,
      capacity: batch.capacity,
      syllabus_notes: batch.syllabus_notes
    });
    setShowBatchModal(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    try {
      if (editingBatch) {
        // Edit existing
        await api.patch(`/api/batches/${editingBatch.batch_id}`, {
          name: batchForm.name,
          capacity: parseInt(batchForm.capacity),
          syllabus_notes: batchForm.syllabus_notes
        });
        setSuccessMsg(`Batch "${batchForm.name}" updated successfully.`);
      } else {
        // Create new
        await api.post("/api/batches", {
          name: batchForm.name,
          target_exam: batchForm.target_exam,
          capacity: parseInt(batchForm.capacity),
          syllabus_notes: batchForm.syllabus_notes
        });
        setSuccessMsg(`Batch "${batchForm.name}" created successfully.`);
      }
      setShowBatchModal(false);
      fetchBatches();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to save batch. Please try again.");
    }
  };

  const handleArchiveBatch = async (batchId, batchName) => {
    if (!window.confirm(`Are you sure you want to archive "${batchName}"? Archived batches cannot be unarchived.`)) {
      return;
    }
    try {
      await api.patch(`/api/batches/${batchId}/archive`);
      setSuccessMsg(`Batch "${batchName}" archived.`);
      fetchBatches();
    } catch (err) {
      console.error(err);
      setError("Failed to archive batch.");
    }
  };

  // --- EVENT HANDLERS: Enrollment Requests Decision ---

  const handleOpenDecision = (req, mode) => {
    setSelectedRequest(req);
    setDecisionMode(mode);
    setDecisionForm({
      reason: "",
      target_batch_id: mode === "reassign" ? "" : (req.batch_id || "")
    });
  };

  const handleCloseDecision = () => {
    setSelectedRequest(null);
    setDecisionMode("");
    setDecisionForm({ reason: "", target_batch_id: "" });
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !decisionMode) return;

    setProcessingDecision(true);
    try {
      let endpoint = `/api/enrollment/requests/${selectedRequest.request_id}/approve`;
      let payload = {};

      if (decisionMode === "reassign") {
        endpoint = `/api/enrollment/requests/${selectedRequest.request_id}/reassign`;
        payload = {
          reason: decisionForm.reason,
          target_batch_id: decisionForm.target_batch_id
        };
      } else if (decisionMode === "reject") {
        endpoint = `/api/enrollment/requests/${selectedRequest.request_id}/reject`;
        payload = {
          reason: decisionForm.reason
        };
      }

      const res = await api.patch(endpoint, payload);
      
      setSuccessMsg(res.data.message || `Request successfully ${decisionMode}ed.`);
      handleCloseDecision();
      fetchRequests();
      fetchBatches(); // Refresh current counts
      fetchClassAnalytics(); // Refresh roster
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to submit decision.");
    } finally {
      setProcessingDecision(false);
    }
  };

  // --- CHART HELPERS ---

  const getTopicBarChart = () => {
    if (!classData || !classData.weakest_topics || classData.weakest_topics.length === 0) {
      return <div className="text-sm text-brand-muted-light font-medium text-center py-12">No topic data available. Run diagnostic tests with students first.</div>;
    }
    
    const labels = classData.weakest_topics.map((item) => item.topic);
    const dataValues = classData.weakest_topics.map((item) => item.avg_accuracy);

    const colors = dataValues.map((v) => (v >= 65 ? "#10b981" : v >= 40 ? "#f59e0b" : "#ef4444"));

    const data = {
      labels,
      datasets: [
        {
          label: "Class Average Mastery (%)",
          data: dataValues,
          backgroundColor: colors,
          borderRadius: 6,
          barThickness: 20
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
          grid: { color: "#dfd3c320" }
        },
        x: {
          ticks: { color: "#2c1b12", font: { size: 10, weight: "600" } },
          grid: { display: false }
        }
      }
    };

    return <Bar data={data} options={options} />;
  };

  const getPieChart = () => {
    if (!classData || !classData.strong_weak_ratio) return null;

    const data = {
      labels: ["Strong (Avg >= 60%)", "Weak (Avg < 60%)"],
      datasets: [
        {
          data: [classData.strong_weak_ratio.strong || 0, classData.strong_weak_ratio.weak || 0],
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
          labels: { color: "#2c1b12", font: { size: 11, weight: "600" } }
        }
      }
    };

    return <Pie data={data} options={options} />;
  };

  // --- SUB-RENDERERS ---

  const renderStudentMasteryBars = (mastery) => {
    if (!mastery || Object.keys(mastery).length === 0) {
      return <p className="text-xs text-brand-muted-light">No subject mastery data yet. Student needs to submit tests.</p>;
    }
    return (
      <div className="space-y-4">
        {Object.keys(mastery).map((topic) => {
          const tdata = mastery[topic];
          const acc = Math.round(tdata.accuracy || 0);
          
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
              <div className="w-full h-2 bg-brand-bg-light/40 rounded-full overflow-hidden relative">
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

      {/* Main Tab bar */}
      <div className="bg-white border-b border-brand-border-light px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("pulse")}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
              activeTab === "pulse"
                ? "bg-brand-accent text-white shadow-sm"
                : "text-brand-muted-light hover:text-brand-text-light hover:bg-brand-bg-light"
            }`}
          >
            Class Pulse
          </button>
          <button
            onClick={() => setActiveTab("batches")}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all relative ${
              activeTab === "batches"
                ? "bg-brand-accent text-white shadow-sm"
                : "text-brand-muted-light hover:text-brand-text-light hover:bg-brand-bg-light"
            }`}
          >
            Batch Management
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all relative ${
              activeTab === "requests"
                ? "bg-brand-accent text-white shadow-sm"
                : "text-brand-muted-light hover:text-brand-text-light hover:bg-brand-bg-light"
            }`}
          >
            Enrollment Requests
            {requests.filter(r => r.status === "pending").length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-white font-extrabold animate-pulse">
                {requests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        </div>

        {/* Global Toast Message area inside bar */}
        <div className="flex items-center gap-2">
          {successMsg && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fade-in font-bold">
              <CheckCircle2 className="w-4 h-4" />
              {successMsg}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 animate-fade-in font-bold">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Main Layout Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* --- TAB 1: CLASS PULSE --- */}
        {activeTab === "pulse" && (
          <div className="flex-1 flex h-full overflow-hidden">
            {/* Left Side: Roster */}
            <div className="w-80 h-full shrink-0 border-r border-brand-border-light">
              {classData && (
                <StudentTable
                  students={classData.roster || []}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={handleSelectStudent}
                />
              )}
              {!classData?.roster?.length && (
                <div className="p-8 text-center text-sm text-brand-muted-light font-bold">
                  No active students enrolled in your batches yet.
                </div>
              )}
            </div>

            {/* Right Side: Analytical Canvas */}
            <div className="flex-1 h-full overflow-y-auto p-8">
              {loadingDetail ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-brand-accent animate-spin mb-3" />
                  <p className="text-sm text-brand-muted-light font-medium">Fetching student insights...</p>
                </div>
              ) : studentDetail ? (
                /* Selected Student Detail View */
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleSelectStudent(selectedStudentId)}
                      className="flex items-center gap-1.5 text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Class Pulse
                    </button>
                  </div>

                  <div className="bg-white rounded-xl border border-brand-border-light p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-extrabold text-brand-text-light">{studentDetail.name}</h2>
                        <p className="text-xs text-brand-muted-light font-bold mt-1 uppercase tracking-wider">
                          {studentDetail.tests_completed || 0} tests completed
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 bg-brand-bg-light/80 border border-brand-border-light text-brand-muted-light text-xs font-bold px-3 py-1.5 rounded-lg">
                          <Clock className="w-3.5 h-3.5" />
                          SPEED: {studentDetail.speed?.status || "Normal"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-sm font-bold text-brand-text-light uppercase tracking-wider mb-4 border-b border-brand-border-light/40 pb-2 text-left">
                        Subject Mastery Profile
                      </h3>
                      {renderStudentMasteryBars(studentDetail.mastery)}
                    </div>

                    {studentDetail.chapters && Object.keys(studentDetail.chapters).length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-sm font-bold text-brand-text-light uppercase tracking-wider mb-4 border-b border-brand-border-light/40 pb-2 text-left">
                          Chapter Mastery Profile
                        </h3>
                        {renderStudentMasteryBars(studentDetail.chapters)}
                      </div>
                    )}

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Mistake patterns */}
                      <div className="bg-brand-bg-light/45 border border-brand-border-light rounded-xl p-5 text-left">
                        <h3 className="text-xs font-bold text-brand-text-light uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-brand-accent" />
                          RECURRING MISTAKE PATTERNS
                        </h3>
                        <ul className="space-y-2 text-xs text-brand-text-light font-medium pl-2">
                          {studentDetail.mistake_patterns?.length > 0 ? (
                            studentDetail.mistake_patterns.map((pattern, pIdx) => (
                              <li key={pIdx} className="flex gap-2">
                                <span className="text-brand-accent font-bold">&bull;</span>
                                <span>{pattern}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-brand-muted-light italic">No critical mistake patterns detected by AI yet.</li>
                          )}
                        </ul>
                      </div>

                      {/* AI Recommendations */}
                      <div className="bg-amber-500/5 border border-brand-accent/25 rounded-xl p-5 text-left">
                        <h3 className="text-xs font-bold text-brand-text-light uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-brand-accent" />
                          AI TEACHING RECOMMENDATIONS
                        </h3>
                        <ul className="space-y-2 text-xs text-brand-text-light font-medium pl-2">
                          {studentDetail.recommendations?.length > 0 ? (
                            studentDetail.recommendations.map((rec, rIdx) => (
                              <li key={rIdx} className="flex gap-2">
                                <span className="text-brand-accent font-bold">&bull;</span>
                                <span>{rec}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-brand-muted-light italic">All clear! No current recommendations needed.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* DEFAULT: Class Pulse Overview */
                <div className="space-y-6 max-w-5xl">
                  <div>
                    <span className="text-xs font-bold text-brand-accent uppercase tracking-wider block mb-1">
                      Class Analytics
                    </span>
                    <h1 className="text-3xl font-extrabold text-brand-text-light tracking-tight">
                      Class Pulse
                    </h1>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl border border-brand-border-light p-6 shadow-sm flex flex-col">
                      <h3 className="text-sm font-bold text-brand-text-light uppercase tracking-wider mb-1">
                        Topic-wise average mastery
                      </h3>
                      <p className="text-xs text-brand-muted-light mb-4 font-semibold">
                        Across all students in your active batches.
                      </p>
                      <div className="h-64 flex-1">
                        {getTopicBarChart()}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-brand-border-light p-6 shadow-sm flex flex-col">
                      <h3 className="text-sm font-bold text-brand-text-light uppercase tracking-wider mb-1">
                        Weak / strong distribution
                      </h3>
                      <p className="text-xs text-brand-muted-light mb-4 font-semibold">
                        How the class splits by overall standing.
                      </p>
                      <div className="h-64 flex-1 flex items-center justify-center">
                        {getPieChart() || <span className="text-xs text-brand-muted-light">No students yet</span>}
                      </div>
                    </div>
                  </div>

                  {/* Flagged Students Card */}
                  <div className="bg-white rounded-xl border border-brand-border-light p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-brand-text-light uppercase tracking-wider mb-2">
                      Flagged this week
                    </h3>
                    {classData && classData.flagged_students?.length > 0 ? (
                      <div className="space-y-4 mt-4">
                        <p className="text-xs text-brand-muted-light font-semibold">
                          {classData.flagged_students.length} students showing signs of risk - worth a nudge.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {classData.flagged_students.map((student) => (
                            <div
                              key={student.student_id}
                              onClick={() => handleSelectStudent(student.student_id)}
                              className="border border-rose-500/20 bg-rose-500/5 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-rose-500/10 transition-all animate-fade-in"
                            >
                              <div>
                                <span className="font-bold text-sm text-brand-text-light block">
                                  {student.name}
                                </span>
                                <span className="text-xs text-brand-muted-light">
                                  Declining in: {student.declining_topics?.join(", ") || "General performance"}
                                </span>
                              </div>
                              <AlertTriangle className="w-5 h-5 text-rose-500" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-brand-muted-light font-semibold mb-2">
                          0 students showing signs of risk.
                        </p>
                        <p className="text-sm text-brand-text-light/80 font-medium">
                          No students currently flagged. Nice work.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Class-wide AI Teaching Recommendations */}
                  <div className="bg-white rounded-xl border border-brand-border-light p-6 shadow-sm text-left">
                    <h3 className="text-xs font-bold text-brand-text-light uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
                      AI Teaching Recommendations (Class-wide)
                    </h3>
                    {classData && classData.teaching_recommendations?.length > 0 ? (
                      <ul className="space-y-3 mt-3">
                        {classData.teaching_recommendations.map((rec, rIdx) => (
                          <li
                            key={rIdx}
                            className="bg-brand-bg-light/35 border border-brand-border-light rounded-lg p-3 text-xs text-brand-text-light/90 font-semibold flex items-start gap-2"
                          >
                            <span className="text-brand-accent text-lg leading-none shrink-0">&bull;</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-brand-muted-light italic">
                        No immediate pedagogical interventions flagged. Keep monitoring the roster.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2: BATCH MANAGEMENT --- */}
        {activeTab === "batches" && (
          <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-text-light">Batch Management</h1>
                <p className="text-xs text-brand-muted-light font-medium mt-1">
                  Organize, edit and monitor enrollment limits for your active learning batches.
                </p>
              </div>
              <button
                onClick={handleOpenCreateBatch}
                className="flex items-center gap-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Batch
              </button>
            </div>

            {loadingBatches ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
              </div>
            ) : batches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batches.map((batch) => {
                  const percent = Math.min(Math.round((batch.current_count / batch.capacity) * 100), 100);
                  const isFull = batch.current_count >= batch.capacity;

                  return (
                    <div
                      key={batch.batch_id}
                      className="bg-white border border-brand-border-light rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                    >
                      {/* Top banner tag for Exam type */}
                      <div className="absolute top-0 right-0">
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-bl-lg uppercase tracking-wider ${
                          batch.target_exam === "JEE" ? "bg-blue-500 text-white" : "bg-emerald-500 text-white"
                        }`}>
                          {batch.target_exam}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h3 className="font-extrabold text-base text-brand-text-light pr-12 line-clamp-1">{batch.name}</h3>
                          <span className="text-[10px] text-brand-muted-light font-bold uppercase tracking-wider block mt-0.5">
                            ID: {batch.batch_id.slice(0, 8)}
                          </span>
                        </div>

                        {/* Capacity meter */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-brand-muted-light">Enrollment</span>
                            <span className={isFull ? "text-rose-500" : "text-brand-text-light"}>
                              {batch.current_count} / {batch.capacity} Students {isFull && "(Full)"}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-brand-bg-light/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isFull ? "bg-rose-500" : percent > 85 ? "bg-amber-500" : "bg-brand-accent"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Syllabus section */}
                        <div className="bg-brand-bg-light/40 border border-brand-border-light/40 rounded-lg p-3 text-xs">
                          <span className="font-bold text-brand-text-light uppercase tracking-wider block mb-1">Syllabus / Notes:</span>
                          <p className="text-brand-muted-light font-medium line-clamp-2 italic">
                            {batch.syllabus_notes || "No syllabus notes defined yet."}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-3 border-t border-brand-border-light/40 mt-5 pt-4">
                        <button
                          onClick={() => handleOpenEditBatch(batch)}
                          className="flex-1 flex items-center justify-center gap-1 border border-brand-border-light text-brand-text-light hover:bg-brand-bg-light text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleArchiveBatch(batch.batch_id, batch.name)}
                          className="flex-1 flex items-center justify-center gap-1 border border-rose-100 hover:bg-rose-50 text-rose-500 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          Archive
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-brand-border-light rounded-xl p-12 text-center max-w-md mx-auto mt-12">
                <Users className="w-12 h-12 text-brand-muted-light mx-auto mb-4" />
                <h3 className="font-bold text-brand-text-light text-base mb-1">Create Your First Batch</h3>
                <p className="text-xs text-brand-muted-light mb-6">
                  You need to create a batch before students can submit enrollment requests to join your classes.
                </p>
                <button
                  onClick={handleOpenCreateBatch}
                  className="bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: ENROLLMENT REQUESTS --- */}
        {activeTab === "requests" && (
          <div className="flex-1 overflow-hidden flex h-full">
            {/* Left Side: Requests List */}
            <div className="w-96 border-r border-brand-border-light flex flex-col h-full bg-white shrink-0">
              <div className="p-4 border-b border-brand-border-light bg-brand-bg-light/30">
                <h3 className="font-extrabold text-sm text-brand-text-light uppercase tracking-wider">
                  Pending Enrollments
                </h3>
                <p className="text-[11px] text-brand-muted-light font-medium mt-0.5">
                  Review student applications and make placement decisions.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-brand-border-light/60">
                {loadingRequests ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
                  </div>
                ) : requests.filter(r => r.status === "pending").length > 0 ? (
                  requests.filter(r => r.status === "pending").map((req) => (
                    <div
                      key={req.request_id}
                      onClick={() => handleOpenDecision(req, "review")}
                      className={`p-4 cursor-pointer hover:bg-brand-bg-light/35 transition-colors text-left flex flex-col gap-2 ${
                        selectedRequest?.request_id === req.request_id ? "bg-brand-bg-light/60" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-extrabold text-sm text-brand-text-light block">
                            {req.student_name}
                          </span>
                          <span className="text-[10px] text-brand-muted-light font-bold block mt-0.5 uppercase tracking-wider">
                            Requested: {req.batch_name}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent rounded-full uppercase tracking-wider">
                          {req.survey_snapshot?.target_exam || "JEE/NEET"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold text-brand-muted-light mt-1">
                        <span>{req.student_email}</span>
                        <span>
                          {req.requested_at && req.requested_at !== "None" && !isNaN(Date.parse(req.requested_at))
                            ? new Date(req.requested_at).toLocaleDateString(undefined, {month: "short", day: "numeric"})
                            : "Recent"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-brand-muted-light font-bold">
                    No pending enrollment requests. All caught up!
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Request Detail & Action Workspace */}
            <div className="flex-1 h-full overflow-y-auto p-8 bg-brand-bg-light/20">
              {selectedRequest ? (
                <div className="max-w-3xl space-y-6">
                  {/* Student Survey Detail Panel */}
                  <div className="bg-white border border-brand-border-light rounded-xl p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-brand-border-light/40 pb-4">
                      <div>
                        <span className="text-xs font-bold text-brand-accent uppercase tracking-widest block mb-0.5">Student Application</span>
                        <h2 className="text-xl font-extrabold text-brand-text-light">{selectedRequest.student_name}</h2>
                        <span className="text-xs text-brand-muted-light font-semibold mt-0.5">{selectedRequest.student_email}</span>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[10px] text-brand-muted-light font-bold uppercase tracking-wider block">Requested Batch</span>
                        <span className="font-extrabold text-sm text-brand-text-light block">{selectedRequest.batch_name}</span>
                      </div>
                    </div>

                    {/* Survey Snapshot details */}
                    <div>
                      <h3 className="text-xs font-extrabold text-brand-text-light uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Book className="w-4 h-4 text-brand-accent" />
                        ONBOARDING SURVEY SNAPSHOT
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-brand-bg-light/25 border border-brand-border-light/40 rounded-lg p-4">
                          <span className="text-[10px] text-brand-muted-light font-bold uppercase tracking-wider block mb-1">Target Exam</span>
                          <span className="font-extrabold text-sm text-brand-text-light">
                            {selectedRequest.survey_snapshot?.target_exam || "Not specified"}
                          </span>
                        </div>
                        
                        <div className="bg-brand-bg-light/25 border border-brand-border-light/40 rounded-lg p-4">
                          <span className="text-[10px] text-brand-muted-light font-bold uppercase tracking-wider block mb-1">Weekly Commitment</span>
                          <span className="font-extrabold text-sm text-brand-text-light">
                            {selectedRequest.survey_snapshot?.weekly_commitment || "Not specified"} hours
                          </span>
                        </div>

                        <div className="bg-brand-bg-light/25 border border-brand-border-light/40 rounded-lg p-4">
                          <span className="text-[10px] text-brand-muted-light font-bold uppercase tracking-wider block mb-1">Learning Style</span>
                          <span className="font-extrabold text-sm text-brand-text-light">
                            {selectedRequest.survey_snapshot?.learning_style || "Not specified"}
                          </span>
                        </div>

                        <div className="bg-brand-bg-light/25 border border-brand-border-light/40 rounded-lg p-4">
                          <span className="text-[10px] text-brand-muted-light font-bold uppercase tracking-wider block mb-1">Difficult Subjects</span>
                          <span className="font-extrabold text-sm text-brand-text-light block">
                            {selectedRequest.survey_snapshot?.difficult_subjects?.join(", ") || "None"}
                          </span>
                        </div>

                        <div className="bg-brand-bg-light/25 border border-brand-border-light/40 rounded-lg p-4 md:col-span-2">
                          <span className="text-[10px] text-brand-muted-light font-bold uppercase tracking-wider block mb-1">Academic Goals</span>
                          <p className="text-xs text-brand-text-light font-medium">
                            "{selectedRequest.survey_snapshot?.academic_goals || "No target stated."}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Decision Selection panel */}
                    <div className="border-t border-brand-border-light/40 pt-6">
                      <div className="flex gap-4">
                        <button
                          onClick={() => setDecisionMode("approve")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                            decisionMode === "approve"
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          Approve Request
                        </button>
                        <button
                          onClick={() => setDecisionMode("reassign")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                            decisionMode === "reassign"
                              ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                              : "border-blue-200 text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          <ArrowRight className="w-4 h-4" />
                          Reassign Batch
                        </button>
                        <button
                          onClick={() => setDecisionMode("reject")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                            decisionMode === "reject"
                              ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                              : "border-rose-200 text-rose-600 hover:bg-rose-50"
                          }`}
                        >
                          <X className="w-4 h-4" />
                          Reject Request
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Decision Options Forms (Conditional display) */}
                  {decisionMode && decisionMode !== "review" && (
                    <form onSubmit={handleSubmitDecision} className="bg-white border border-brand-border-light rounded-xl p-6 shadow-sm space-y-4 animate-fade-in">
                      <h3 className="text-sm font-extrabold text-brand-text-light uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-accent" />
                        {decisionMode === "approve" && "Confirm Approval & Generate AI Welcome Note"}
                        {decisionMode === "reassign" && "Reassign Student & Generate AI Transition Explanation"}
                        {decisionMode === "reject" && "Provide Rejection Reason"}
                      </h3>

                      {decisionMode === "reassign" && (
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-brand-muted-light uppercase tracking-wider">Select Target Batch</label>
                          <select
                            required
                            value={decisionForm.target_batch_id}
                            onChange={(e) => setDecisionForm({ ...decisionForm, target_batch_id: e.target.value })}
                            className="bg-brand-bg-light/40 border border-brand-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-accent font-medium text-brand-text-light"
                          >
                            <option value="">-- Choose Target Batch --</option>
                            {batches
                              .filter((b) => b.batch_id !== selectedRequest.batch_id)
                              .map((b) => (
                                <option key={b.batch_id} value={b.batch_id}>
                                  {b.name} ({b.target_exam}) - {b.current_count}/{b.capacity} enrolled
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-brand-muted-light uppercase tracking-wider">
                          {decisionMode === "reject" ? "Reason for Rejection" : "Teacher's Note / Context (Optional)"}
                        </label>
                        <textarea
                          rows="3"
                          value={decisionForm.reason}
                          onChange={(e) => setDecisionForm({ ...decisionForm, reason: e.target.value })}
                          placeholder={
                            decisionMode === "reject"
                              ? "Provide clear feedback on why this request is rejected. This will be shown to the student."
                              : "Write extra context or feedback (e.g. 'Student shows strong foundation in mechanics'). Gemini will use this to write a tailored welcome/placement note."
                          }
                          required={decisionMode === "reject"}
                          className="bg-brand-bg-light/40 border border-brand-border-light rounded-lg p-3 text-sm focus:outline-none focus:border-brand-accent placeholder-brand-muted-light font-medium"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleCloseDecision}
                          className="px-4 py-2 border border-brand-border-light text-brand-text-light rounded-lg text-xs font-bold hover:bg-brand-bg-light transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={processingDecision}
                          className="bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          {processingDecision && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Submit Decision
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-sm text-brand-muted-light py-20">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-brand-border-light" />
                    <p className="text-sm font-semibold">Select an application from the pending list to review details and make a decision.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* --- CREATE / EDIT BATCH DIALOG MODAL --- */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg-dark/50 backdrop-blur-sm p-6">
          <form
            onSubmit={handleSaveBatch}
            className="bg-white border border-brand-border-light rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl animate-scale-in text-left"
          >
            <div className="flex items-center justify-between border-b border-brand-border-light/40 pb-3">
              <h3 className="font-extrabold text-base text-brand-text-light">
                {editingBatch ? `Edit Batch: ${editingBatch.name}` : "Create New Learning Batch"}
              </h3>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-brand-muted-light hover:text-brand-text-light cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-brand-muted-light uppercase tracking-wider">Batch Name</label>
              <input
                type="text"
                required
                value={batchForm.name}
                onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                placeholder="e.g. JEE-2026 Achievers Batch"
                className="bg-brand-bg-light/40 border border-brand-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-accent font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-muted-light uppercase tracking-wider">Target Exam</label>
                <select
                  disabled={!!editingBatch} // Cannot change exam type of existing batch
                  value={batchForm.target_exam}
                  onChange={(e) => setBatchForm({ ...batchForm, target_exam: e.target.value })}
                  className="bg-brand-bg-light/40 border border-brand-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-accent font-semibold text-brand-text-light disabled:opacity-50"
                >
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-muted-light uppercase tracking-wider">Capacity (Max 200)</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  required
                  value={batchForm.capacity}
                  onChange={(e) => setBatchForm({ ...batchForm, capacity: parseInt(e.target.value) || 0 })}
                  className="bg-brand-bg-light/40 border border-brand-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-accent font-semibold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-brand-muted-light uppercase tracking-wider">Syllabus / Focus Notes</label>
              <textarea
                rows="3"
                value={batchForm.syllabus_notes}
                onChange={(e) => setBatchForm({ ...batchForm, syllabus_notes: e.target.value })}
                placeholder="Details of syllabus chapters, weekly schedules, target benchmarks..."
                className="bg-brand-bg-light/40 border border-brand-border-light rounded-lg p-3 text-sm focus:outline-none focus:border-brand-accent placeholder-brand-muted-light font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border-light/40">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 border border-brand-border-light text-brand-text-light rounded-lg text-xs font-bold hover:bg-brand-bg-light transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shadow-sm transition-colors"
              >
                {editingBatch ? "Save Changes" : "Create Batch"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
