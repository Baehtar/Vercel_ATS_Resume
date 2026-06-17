// components/ProjectsEditor.tsx
// Admin tab — manage preset projects students can add to their resume.
// Projects are stored in signup_options where category = 'projects',
// with items being an array of { name, tech, link, description } objects.
"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/supabaseClient";
import type { Project } from "@/lib/types";

const EMPTY_PROJECT: Project = { name: "", tech: "", link: "", description: "" };

export default function ProjectsEditor() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // Editing state for the add/edit form
  const [editing, setEditing] = useState<Project | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null); // null = new

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/signup-options?category=projects");
        const json = await res.json();
        setProjects(Array.isArray(json.items) ? (json.items as Project[]) : []);
      } catch {
        setMsg({ kind: "error", text: "Failed to load projects." });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (updated: Project[]) => {
    setSaving(true);
    setMsg(null);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/admin/signup-options", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: "projects", items: updated }),
      });
      const json = await res.json();
      if (json.ok) {
        setProjects(updated);
        setMsg({ kind: "success", text: "Projects saved — students will see the updated list." });
      } else {
        setMsg({ kind: "error", text: json.error || "Save failed." });
      }
    } catch (e) {
      setMsg({ kind: "error", text: `Save failed: ${e}` });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (proj: Project, idx: number) => {
    setEditing({ ...proj });
    setEditIdx(idx);
  };

  const startAdd = () => {
    setEditing({ ...EMPTY_PROJECT });
    setEditIdx(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditIdx(null);
  };

  const commitEdit = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setMsg({ kind: "error", text: "Project name is required." });
      return;
    }
    const updated = [...projects];
    if (editIdx === null) {
      updated.push(editing);
    } else {
      updated[editIdx] = editing;
    }
    setEditing(null);
    setEditIdx(null);
    save(updated);
  };

  const remove = (idx: number) => {
    if (!confirm(`Remove "${projects[idx].name}"?`)) return;
    save(projects.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...projects];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    save(next);
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 4px" }}>💻 Preset Projects Editor</h3>
      <p className="caption" style={{ margin: "0 0 16px" }}>
        Manage the preset projects students can add to their resume from the dropdown.
        Changes take effect immediately for all students.
      </p>

      {msg && <div className={`alert alert-${msg.kind}`} style={{ marginBottom: 12 }}>{msg.text}</div>}

      {loading ? (
        <p className="muted"><span className="spinner" />Loading projects…</p>
      ) : (
        <>
          {/* Project list */}
          {projects.length === 0 && !editing && (
            <p className="muted" style={{ fontSize: "0.85rem" }}>No preset projects yet. Add the first one below.</p>
          )}

          {projects.map((proj, i) => (
            <div key={i} className="panel" style={{ padding: "12px 16px", marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{proj.name}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{proj.tech}</div>
                {proj.link && <div style={{ fontSize: "0.75rem", color: "var(--blue-600)", marginTop: 2 }}>{proj.link}</div>}
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0 || saving} title="Move up">↑</button>
                <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === projects.length - 1 || saving} title="Move down">↓</button>
                <button className="icon-btn" onClick={() => startEdit(proj, i)} title="Edit">✏</button>
                <button className="icon-btn" onClick={() => remove(i)} disabled={saving} title="Remove">✕</button>
              </div>
            </div>
          ))}

          {/* Add / Edit form */}
          {editing ? (
            <div className="panel" style={{ marginTop: 8, border: "1px solid var(--primary)" }}>
              <h4 style={{ margin: "0 0 12px" }}>{editIdx === null ? "➕ Add New Project" : "✏️ Edit Project"}</h4>
              <label className="field-label">Project Name *</label>
              <input
                value={editing.name}
                placeholder="e.g. Scalable Cloud Data Lakehouse Pipeline"
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <label className="field-label">Tech Stack</label>
              <input
                value={editing.tech}
                placeholder="e.g. Azure Data Factory, Databricks, PySpark, Delta Lake"
                onChange={(e) => setEditing({ ...editing, tech: e.target.value })}
              />
              <label className="field-label">Link (optional)</label>
              <input
                value={editing.link}
                placeholder="https://github.com/..."
                onChange={(e) => setEditing({ ...editing, link: e.target.value })}
              />
              <label className="field-label">Description</label>
              <textarea
                rows={5}
                value={editing.description}
                placeholder="Describe what was built, technologies used, and impact…"
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
              <div className="btn-row" style={{ marginTop: 12 }}>
                <button className="btn-cta" onClick={commitEdit} disabled={saving}>
                  {saving && <span className="spinner" />}
                  {editIdx === null ? "Add Project" : "Save Changes"}
                </button>
                <button className="ghost" onClick={cancelEdit}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="full" style={{ marginTop: 8 }} onClick={startAdd} disabled={saving}>
              + Add New Project
            </button>
          )}
        </>
      )}
    </div>
  );
}
