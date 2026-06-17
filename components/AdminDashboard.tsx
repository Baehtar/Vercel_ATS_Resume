// components/AdminDashboard.tsx - Admin view of all students and their resumes
"use client";

import { useEffect, useState } from "react";
import { fetchAllStudents, loadResume, signOutStudent, type ProfileRow } from "@/lib/supabaseClient";
import { generateResumeHtml, TEMPLATE_OPTIONS } from "@/lib/resumeTemplates";
import type { Resume, TemplateId } from "@/lib/types";
import ResumePreview, { printResume } from "./ResumePreview";
import KeywordsEditor from "./KeywordsEditor";

type AdminTab = "students" | "keywords";

export default function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("students");
  const [students, setStudents] = useState<ProfileRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState("All");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingName, setViewingName] = useState("Student");
  const [resume, setResume] = useState<Resume | null>(null);
  const [templateId, setTemplateId] = useState<TemplateId>("modern");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetchAllStudents();
      setStudents(res.students);
      setError(res.error);
      setLoading(false);
    })();
  }, []);

  const filtered =
    courseFilter === "All" ? students : students.filter((s) => s.course === courseFilter);

  const viewResume = async (student: ProfileRow) => {
    setViewingId(student.id);
    setViewingName(student.name || "Student");
    setResume(null);
    const r = await loadResume(student.id);
    setResume(r);
  };

  const html = resume ? generateResumeHtml(resume, templateId) : "";

  return (
    <div className="main">
      <h2 style={{ color: "var(--blue-600)" }}>🛡️ Admin Dashboard</h2>

      {/* Admin tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "students" ? "active" : ""}`} onClick={() => setActiveTab("students")}>
          👥 Students
        </button>
        <button className={`tab ${activeTab === "keywords" ? "active" : ""}`} onClick={() => setActiveTab("keywords")}>
          ⚙️ Keyword Options
        </button>
      </div>

      {activeTab === "keywords" && (
        <>
          <KeywordsEditor />
          <hr />
          <button className="full" onClick={async () => { await signOutStudent(); onSignOut(); }}>
            🚪 Sign Out
          </button>
        </>
      )}

      {activeTab === "students" && (
        <>
          {error && <div className="alert alert-error">Could not fetch students: {error}</div>}

          <h3>👥 Registered Students ({students.length})</h3>
          <label className="field-label">Filter by Course</label>
          <select
            style={{ maxWidth: 280 }}
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            {["All", "Data Engineer", "Data Analyst"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <p className="caption">Showing {filtered.length} students</p>
          <hr />

          {loading ? (
            <p className="muted">
              <span className="spinner" />Loading students…
            </p>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id}
                className="panel"
                style={{ display: "flex", alignItems: "center", gap: 16, padding: 14 }}
              >
                <div style={{ flex: 2 }}><strong>{s.name || "N/A"}</strong></div>
                <div style={{ flex: 2 }}>{s.batch || "N/A"}</div>
                <div style={{ flex: 1.5 }}>{s.course || "N/A"}</div>
                <div style={{ flex: 1 }}>
                  <button onClick={() => viewResume(s)}>View Resume</button>
                </div>
              </div>
            ))
          )}

          {viewingId && (
            <>
              <hr />
              <h3>📄 Resume — {viewingName}</h3>
              {resume ? (
                <>
                  <label className="field-label">Template</label>
                  <select
                    style={{ maxWidth: 280 }}
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value as TemplateId)}
                  >
                    {(Object.keys(TEMPLATE_OPTIONS) as TemplateId[]).map((t) => (
                      <option key={t} value={t}>{TEMPLATE_OPTIONS[t]}</option>
                    ))}
                  </select>
                  <div style={{ margin: "12px 0" }}>
                    <button className="primary full" onClick={() => printResume(html)}>
                      🖨 Download Student Resume PDF
                    </button>
                  </div>
                  <ResumePreview html={html} />
                </>
              ) : (
                <p className="muted">This student hasn&apos;t saved a resume yet.</p>
              )}
            </>
          )}

          <hr />
          <button className="full" onClick={async () => { await signOutStudent(); onSignOut(); }}>
            🚪 Sign Out
          </button>
        </>
      )}
    </div>
  );
}
