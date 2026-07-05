import React, { useState } from "react";
import { Search } from "lucide-react";

export default function StudentTable({ students, selectedStudentId, onSelectStudent }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter students based on search query
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getProgressColor = (acc) => {
    if (acc >= 65) return "bg-emerald-500";
    if (acc >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="w-full h-full flex flex-col bg-brand-bg-light/30 border-r border-brand-border-light">
      {/* Roster Header */}
      <div className="p-4 border-b border-brand-border-light">
        <h3 className="text-xs font-bold text-brand-muted-light uppercase tracking-wider mb-2">
          Roster &bull; {students.length} Students
        </h3>
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-brand-border-light rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent text-brand-text-light placeholder-brand-muted-light/60 transition-all shadow-xs"
          />
          <Search className="w-4 h-4 text-brand-muted-light/75 absolute left-3 top-3" />
        </div>
      </div>

      {/* Student List */}
      <div className="flex-1 overflow-y-auto divide-y divide-brand-border-light/40">
        {filteredStudents.length === 0 ? (
          <div className="p-6 text-center text-sm text-brand-muted-light">
            No students found.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const isSelected = student.student_id === selectedStudentId;

            return (
              <button
                key={student.student_id}
                onClick={() => onSelectStudent(student.student_id)}
                className={`w-full text-left p-4 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? "bg-white border-l-4 border-brand-accent"
                    : "hover:bg-white/50 border-l-4 border-transparent"
                }`}
              >
                {/* Avatar Initials */}
                <div className="w-10 h-10 rounded-lg bg-white border border-brand-border-light flex items-center justify-center text-xs font-bold text-brand-muted-light shrink-0 shadow-xs">
                  {getInitials(student.name)}
                </div>

                {/* Info & Bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-brand-text-light truncate">
                      {student.name}
                    </span>
                    <span className="text-xs font-bold text-brand-text-light shrink-0">
                      {student.avg_accuracy}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-brand-muted-light mb-2">
                    <span>{student.tests_completed} tests</span>
                  </div>

                  {/* Colored progress bar indicator */}
                  <div className="w-full h-1 bg-brand-border-light/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(student.avg_accuracy)}`}
                      style={{ width: `${Math.min(student.avg_accuracy, 100)}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
