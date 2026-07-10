// components/AdminDashboard.tsx - Admin view of all students and their resumes
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  fetchAllStudentsWithResumes,
  saveResumeForUser,
  signOutStudent,
  type StudentWithResume,
} from "@/lib/supabaseClient";
import { generateResumeHtml, TEMPLATE_OPTIONS } from "@/lib/resumeTemplates";
import type { Resume, TemplateId } from "@/lib/types";
import ResumePreview, { printResume } from "./ResumePreview";
import KeywordsEditor from "./KeywordsEditor";
import BatchesEditor from "./BatchesEditor";
import ProjectsEditor from "./ProjectsEditor";
import PromptEditor from "./PromptEditor";

type AdminTab = "students" | "keywords" | "batches" | "projects" | "prompts";
type ResumePanel = "preview" | "edit";

interface EditState {
  studentId: string;
  studentName: string;
  draft: Resume;
}

function blankResume(): Resume {
  return {
    personal: { fullName: "", headline: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "" },
    summary: "",
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
  };
}

export default function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("students");
  const [students, setStudents] = useState<StudentWithResume[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchName, setSearchName] = useState("");
  const [filterBatch, setFilterBatch] = useState("All");
  const [batchOptions, setBatchOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/signup-options?category=batches")
      .then((r) => r.json())
      .then((json: { items?: string[] }) => {
        if (json.items?.length) setBatchOptions(json.items);
      })
      .catch(() => {});
  }, []);
  const [filterResume, setFilterResume] = useState<"All" | "Saved" | "Not saved">("All");
  const [filterExp, setFilterExp] = useState<"All" | "0" | "1+" | "3+">("All");

  const [selectedStudent, setSelectedStudent] = useState<StudentWithResume | null>(null);
  const [resumePanel, setResumePanel] = useState<ResumePanel>("preview");
  const [templateId, setTemplateId] = useState<TemplateId>("modern");

  const [editState, setEditState] = useState<EditState | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchAllStudentsWithResumes();
      setStudents(res.students);
      setLoadError(res.error);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const nameMatch =
        !searchName ||
        (s.name || "").toLowerCase().includes(searchName.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(searchName.toLowerCase());
      const courseMatch = filterBatch === "All" || s.batch === filterBatch;
      const resumeMatch =
        filterResume === "All" ||
        (filterResume === "Saved" && s.has_resume) ||
        (filterResume === "Not saved" && !s.has_resume);
      const expMatch =
        filterExp === "All" ||
        (filterExp === "0" && s.experience_count === 0) ||
        (filterExp === "1+" && s.experience_count >= 1) ||
        (filterExp === "3+" && s.experience_count >= 3);
      return nameMatch && courseMatch && resumeMatch && expMatch;
    });
  }, [students, searchName, filterBatch, filterResume, filterExp]);

  const openStudent = (s: StudentWithResume) => {
    setSelectedStudent(s);
    setResumePanel("preview");
    setPushMsg(null);
    const baseDraft = s.resume ? structuredClone(s.resume) : blankResume();
    setEditState({ studentId: s.id, studentName: s.name || "Student", draft: baseDraft });
  };

  const patchDraft = (fn: (d: Resume) => void) => {
    if (!editState) return;
    const next = structuredClone(editState.draft);
    fn(next);
    setEditState({ ...editState, draft: next });
  };

  const downloadEditedPdf = () => {
    if (!editState) return;
    printResume(generateResumeHtml(editState.draft, templateId));
  };

  const pushChanges = async () => {
    if (!editState) return;
    const confirmed = window.confirm(
      `Push resume changes to ${editState.studentName}?\n\nThis will OVERWRITE their saved resume. This cannot be undone.`
    );
    if (!confirmed) return;
    setPushBusy(true);
    setPushMsg(null);
    const res = await saveResumeForUser(editState.studentId, editState.draft);
    setPushBusy(false);
    if (res.ok) {
      setPushMsg({ kind: "success", text: `Resume saved for ${editState.studentName}.` });
      const refreshed = await fetchAllStudentsWithResumes();
      setStudents(refreshed.students);
      if (selectedStudent) {
        const updated = refreshed.students.find((s) => s.id === selectedStudent.id);
        if (updated) setSelectedStudent(updated);
      }
    } else {
      setPushMsg({ kind: "error", text: res.error || "Failed to save." });
    }
  };

  const previewHtml = selectedStudent?.resume
    ? generateResumeHtml(selectedStudent.resume, templateId)
    : "";
  const editPreviewHtml = editState ? generateResumeHtml(editState.draft, templateId) : "";

  const handleSignOut = async () => {
    await signOutStudent();
    onSignOut();
  };

  return (
    <div className="main">
      <h2 style={{ color: "var(--premium-white)" }}>Admin Dashboard</h2>

      <div className="tabs">
        <button className={`tab ${activeTab === "students" ? "active" : ""}`} onClick={() => setActiveTab("students")}>Students</button>
        <button className={`tab ${activeTab === "keywords" ? "active" : ""}`} onClick={() => setActiveTab("keywords")}>Keyword Options</button>
        <button className={`tab ${activeTab === "batches" ? "active" : ""}`} onClick={() => setActiveTab("batches")}>Batches</button>
        <button className={`tab ${activeTab === "projects" ? "active" : ""}`} onClick={() => setActiveTab("projects")}>Projects</button>
        <button className={`tab ${activeTab === "prompts" ? "active" : ""}`} onClick={() => setActiveTab("prompts")}>AI Prompts</button>
      </div>

      {activeTab === "prompts" && (
        <><PromptEditor /><hr /><button className="full" onClick={handleSignOut}>Sign Out</button></>
      )}

      {activeTab === "projects" && (
        <><ProjectsEditor /><hr /><button className="full" onClick={handleSignOut}>Sign Out</button></>
      )}

      {activeTab === "batches" && (
        <><BatchesEditor /><hr /><button className="full" onClick={handleSignOut}>Sign Out</button></>
      )}

      {activeTab === "keywords" && (
        <><KeywordsEditor /><hr /><button className="full" onClick={handleSignOut}>Sign Out</button></>
      )}

      {activeTab === "students" && (
        <>
          {loadError && <div className="alert alert-error">Could not fetch students: {loadError}</div>}

          {/* Filter bar */}
          <div className="admin-filter-bar">
            <div>
              <label className="field-label" style={{ margin: 0 }}>Search</label>
              <input
                type="text"
                placeholder="Name or email…"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{ minWidth: 180 }}
              />
            </div>
            <div>
              <label className="field-label" style={{ margin: 0 }}>Batch</label>
              <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
                <option value="All">All batches</option>
                {batchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" style={{ margin: 0 }}>Resume</label>
              <select value={filterResume} onChange={(e) => setFilterResume(e.target.value as "All" | "Saved" | "Not saved")}>
                {["All", "Saved", "Not saved"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" style={{ margin: 0 }}>Experience</label>
              <select value={filterExp} onChange={(e) => setFilterExp(e.target.value as "All" | "0" | "1+" | "3+")}>
                <option value="All">All</option>
                <option value="0">0 entries</option>
                <option value="1+">1+ entries</option>
                <option value="3+">3+ entries</option>
              </select>
            </div>
          </div>
          <p className="caption" style={{ margin: "4px 0 12px" }}>
            {loading ? "Loading…" : `Showing ${filtered.length} of ${students.length} students`}
          </p>

          {loading ? (
            <p className="muted"><span className="spinner" />Loading students…</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name / Email</th>
                    <th>Phone</th>
                    <th>Qualification</th>
                    <th>Course</th>
                    <th>Domain</th>
                    <th>Experience</th>
                    <th>Resume</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>
                        No students match the current filters.
                      </td>
                    </tr>
                  ) : filtered.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.name || "N/A"}</div>
                        {s.email && <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{s.email}</div>}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{s.phone || "N/A"}</td>
                      <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.qualification || "N/A"}</td>
                      <td>{s.course || "N/A"}</td>
                      <td>{s.domain || s.course || "N/A"}</td>
                      <td style={{ textAlign: "center" }}>
                        {s.experience_count === 0
                          ? <span className="badge-gray">0</span>
                          : (
                            <details style={{ cursor: "pointer", userSelect: "none" }}>
                              <summary style={{
                                listStyle: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                color: "var(--premium-white)",
                                cursor: "pointer",
                              }}>
                                {s.experience_count} entr{s.experience_count === 1 ? "y" : "ies"} ▾
                              </summary>
                              <div style={{
                                position: "absolute",
                                zIndex: 50,
                                background: "var(--panel)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                padding: "8px 12px",
                                marginTop: 4,
                                minWidth: 220,
                                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                                fontSize: "0.82rem",
                              }}>
                                {s.resume?.experience?.map((exp, ei) => (
                                  <div key={ei} style={{ padding: "4px 0", borderBottom: ei < (s.experience_count - 1) ? "1px solid var(--border)" : "none" }}>
                                    <div style={{ fontWeight: 600 }}>{exp.role || "—"}</div>
                                    <div style={{ color: "var(--text-muted)" }}>{exp.company}{exp.startDate ? ` · ${exp.startDate}–${exp.endDate || "Present"}` : ""}</div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )
                        }
                      </td>
                      <td>
                        {s.has_resume
                          ? <span className="badge-green">✓ Saved</span>
                          : <span className="badge-gray">— None</span>}
                      </td>
                      <td>
                        <button style={{ padding: "5px 12px", fontSize: "0.78rem" }} onClick={() => openStudent(s)}>
                          View / Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Resume panel */}
          {selectedStudent && editState && (
            <div className="panel" style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>
                  {selectedStudent.name || "Student"}
                  {selectedStudent.course && (
                    <span className="badge-gray" style={{ marginLeft: 10, fontWeight: 400, fontSize: "0.8rem" }}>{selectedStudent.course}</span>
                  )}
                </h3>
                <button className="ghost" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => { setSelectedStudent(null); setEditState(null); }}>
                  Close
                </button>
              </div>

              <div className="sub-tabs">
                <button className={`sub-tab ${resumePanel === "preview" ? "active" : ""}`} onClick={() => setResumePanel("preview")}>Preview</button>
                <button className={`sub-tab ${resumePanel === "edit" ? "active" : ""}`} onClick={() => setResumePanel("edit")}>Edit Resume</button>
              </div>

              {resumePanel === "preview" && (
                selectedStudent.resume ? (
                  <>
                    <label className="field-label">Template</label>
                    <select style={{ maxWidth: 280 }} value={templateId} onChange={(e) => setTemplateId(e.target.value as TemplateId)}>
                      {(Object.keys(TEMPLATE_OPTIONS) as TemplateId[]).map((t) => <option key={t} value={t}>{TEMPLATE_OPTIONS[t]}</option>)}
                    </select>
                    <div style={{ margin: "12px 0" }}>
                      <button className="primary full" onClick={() => printResume(previewHtml)}>Download Student Resume PDF</button>
                    </div>
                    <ResumePreview html={previewHtml} />
                  </>
                ) : (
                  <div className="alert alert-warning">This student hasn&apos;t saved a resume yet. Switch to the Edit tab to create one.</div>
                )
              )}

              {resumePanel === "edit" && (
                <div>
                  <details className="expander" open>
                    <summary>Personal Details</summary>
                    <div className="expander-body">
                      <div className="grid-2">
                        <div>
                          <label className="field-label">Full Name</label>
                          <input value={editState.draft.personal.fullName} onChange={(e) => patchDraft((d) => (d.personal.fullName = e.target.value))} />
                        </div>
                        <div>
                          <label className="field-label">Phone</label>
                          <input value={editState.draft.personal.phone} onChange={(e) => patchDraft((d) => (d.personal.phone = e.target.value))} />
                        </div>
                      </div>
                      <div className="grid-2">
                        <div>
                          <label className="field-label">Email</label>
                          <input value={editState.draft.personal.email} onChange={(e) => patchDraft((d) => (d.personal.email = e.target.value))} />
                        </div>
                        <div>
                          <label className="field-label">Headline</label>
                          <input value={editState.draft.personal.headline} placeholder="Data Engineer | ETL | Pipelines" onChange={(e) => patchDraft((d) => (d.personal.headline = e.target.value))} />
                        </div>
                      </div>
                    </div>
                  </details>

                  <details className="expander">
                    <summary>Summary</summary>
                    <div className="expander-body">
                      <textarea rows={5} value={editState.draft.summary} onChange={(e) => patchDraft((d) => (d.summary = e.target.value))} placeholder="Professional summary…" />
                    </div>
                  </details>

                  <details className="expander">
                    <summary>Experience ({editState.draft.experience.length} entries)</summary>
                    <div className="expander-body">
                      {editState.draft.experience.map((exp, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                          <strong style={{ fontSize: "0.9rem" }}>Entry {i + 1}</strong>
                          <div className="grid-2" style={{ marginTop: 6 }}>
                            <div>
                              <label className="field-label">Company</label>
                              <input value={exp.company} onChange={(e) => patchDraft((d) => (d.experience[i].company = e.target.value))} />
                            </div>
                            <div>
                              <label className="field-label">Role / Title</label>
                              <input value={exp.role} onChange={(e) => patchDraft((d) => (d.experience[i].role = e.target.value))} />
                            </div>
                          </div>
                          <div className="grid-2">
                            <div>
                              <label className="field-label">Start Date</label>
                              <input value={exp.startDate} placeholder="e.g. 2023-01" onChange={(e) => patchDraft((d) => (d.experience[i].startDate = e.target.value))} />
                            </div>
                            <div>
                              <label className="field-label">End Date</label>
                              <input value={exp.endDate} placeholder="e.g. 2024-06 or Present" onChange={(e) => patchDraft((d) => (d.experience[i].endDate = e.target.value))} />
                            </div>
                          </div>
                          <label className="field-label">Bullets</label>
                          {exp.bullets.map((b, bi) => (
                            <div className="bullet-row" key={bi}>
                              <input value={b} placeholder="Action verb + metric…" onChange={(e) => patchDraft((d) => (d.experience[i].bullets[bi] = e.target.value))} />
                              <button className="icon-btn" onClick={() => patchDraft((d) => d.experience[i].bullets.splice(bi, 1))}>✖</button>
                            </div>
                          ))}
                          <div className="btn-row" style={{ marginTop: 6 }}>
                            <button onClick={() => patchDraft((d) => d.experience[i].bullets.push(""))}>+ Bullet</button>
                            <button onClick={() => patchDraft((d) => d.experience.splice(i, 1))}>Remove Entry</button>
                          </div>
                          <hr />
                        </div>
                      ))}
                      <button className="full" onClick={() => patchDraft((d) => d.experience.push({ company: "", role: "", location: "", startDate: "", endDate: "", bullets: [""] }))}>
                        + Add Experience Entry
                      </button>
                    </div>
                  </details>

                  <details className="expander">
                    <summary>Skills</summary>
                    <div className="expander-body">
                      {editState.draft.skills.map((sg, i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div className="grid-2">
                            <div>
                              <label className="field-label">Group Name</label>
                              <input value={sg.category} onChange={(e) => patchDraft((d) => (d.skills[i].category = e.target.value))} />
                            </div>
                            <div>
                              <label className="field-label">Skills (comma-separated)</label>
                              <input value={sg.list} placeholder="Python, SQL, Spark…" onChange={(e) => patchDraft((d) => (d.skills[i].list = e.target.value))} />
                            </div>
                          </div>
                          <button style={{ marginTop: 6 }} onClick={() => patchDraft((d) => d.skills.splice(i, 1))}>Remove Group</button>
                          <hr />
                        </div>
                      ))}
                      <button className="full" onClick={() => patchDraft((d) => d.skills.push({ category: "", list: "" }))}>+ Add Skill Group</button>
                    </div>
                  </details>

                  <details className="expander">
                    <summary>Live Preview (edit draft)</summary>
                    <div className="expander-body">
                      <label className="field-label">Template</label>
                      <select style={{ maxWidth: 280 }} value={templateId} onChange={(e) => setTemplateId(e.target.value as TemplateId)}>
                        {(Object.keys(TEMPLATE_OPTIONS) as TemplateId[]).map((t) => <option key={t} value={t}>{TEMPLATE_OPTIONS[t]}</option>)}
                      </select>
                      <div style={{ marginTop: 12 }}><ResumePreview html={editPreviewHtml} /></div>
                    </div>
                  </details>

                  {pushMsg && <div className={`alert alert-${pushMsg.kind}`} style={{ marginTop: 12 }}>{pushMsg.text}</div>}

                  <div className="btn-row" style={{ marginTop: 16 }}>
                    <button className="primary" onClick={downloadEditedPdf}>Download Edited PDF</button>
                    <button className="primary" onClick={pushChanges} disabled={pushBusy}>
                      {pushBusy && <span className="spinner" />}Push Changes to Student
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <hr />
          <button className="full" onClick={handleSignOut}>Sign Out</button>
        </>
      )}
    </div>
  );
}
