// components/KeywordsEditor.tsx
// Admin tab — edit the tools and skills dropdown options stored in Supabase.
"use client";

import { useEffect, useState, useCallback } from "react";
import { getAccessToken } from "@/lib/supabaseClient";
import { loadRoleKeywords } from "@/lib/roleKeywords";

type Category = "tools" | "skills";

const LABELS: Record<Category, string> = {
  tools: "Tools dropdown (used in AI Experience Generator & Tech Stack)",
  skills: "Skills suggestions (used in the Skills section chips)",
};

function TagList({
  items,
  onChange,
}: {
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    // Allow duplicates to be avoided silently
    if (items.map(i => i.toLowerCase()).includes(trimmed.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...items, trimmed]);
    setInput("");
  };

  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {items.map((item, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "var(--panel-2)", border: "1px solid var(--border)",
            borderRadius: 4, padding: "3px 10px", fontSize: "0.82rem",
          }}>
            {item}
            <button
              onClick={() => remove(i)}
              className="icon-btn"
              style={{ width: 16, height: 16, padding: 0, fontSize: "0.65rem", minWidth: 0 }}
            >✕</button>
          </span>
        ))}
        {items.length === 0 && <span className="muted" style={{ fontSize: "0.82rem" }}>No items yet.</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          placeholder="Type a keyword and press Add or Enter"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); }}}
          style={{ flex: 1 }}
        />
        <button onClick={add} style={{ flexShrink: 0 }}>+ Add</button>
      </div>
      <p className="caption" style={{ margin: "4px 0 0" }}>
        {items.length} item{items.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function KeywordsEditor() {
  const roles = Object.entries(loadRoleKeywords()).map(([key, val]) => ({ key, title: val.title }));

  const [selectedRole, setSelectedRole] = useState(roles[0]?.key || "data_engineer");
  const [activeCategory, setActiveCategory] = useState<Category>("tools");
  const [data, setData] = useState<Record<Category, string[]>>({ tools: [], skills: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async (role: string) => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/keyword-options?role=${encodeURIComponent(role)}`);
      const json = await res.json();
      setData({
        tools: Array.isArray(json.tools) ? json.tools : [],
        skills: Array.isArray(json.skills) ? json.skills : [],
      });
    } catch {
      setMsg({ kind: "error", text: "Failed to load keyword options from Supabase." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(selectedRole); }, [selectedRole, loadData]);

  const saveCategory = async (category: Category) => {
    setSaving(true);
    setMsg(null);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/admin/keyword-options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role_key: selectedRole, category, items: data[category] }),
      });
      const json = await res.json();
      if (json.ok) {
        setMsg({ kind: "success", text: `${LABELS[category].split(" ")[0]} saved — students will see the updated list on next page load.` });
      } else {
        setMsg({ kind: "error", text: json.error || "Save failed." });
      }
    } catch (e) {
      setMsg({ kind: "error", text: `Save failed: ${e}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 4px" }}>Dropdown Options Editor</h3>
      <p className="caption" style={{ margin: "0 0 16px" }}>
        Edit the tools and skills that appear as suggestions in the resume builder dropdowns.
        ATS scoring keywords are not changed here.
      </p>

      {msg && <div className={`alert alert-${msg.kind}`} style={{ marginBottom: 12 }}>{msg.text}</div>}

      {/* Role selector */}
      <div style={{ marginBottom: 16 }}>
        <label className="field-label">Role</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {roles.map(({ key, title }) => (
            <button
              key={key}
              onClick={() => setSelectedRole(key)}
              style={{
                background: selectedRole === key ? "var(--yellow-400)" : "var(--panel-2)",
                color: "var(--gray-900)",
                fontWeight: selectedRole === key ? 700 : 500,
                fontSize: "0.85rem",
                padding: "6px 14px",
              }}
            >
              {title}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {(Object.keys(LABELS) as Category[]).map((cat) => (
          <button
            key={cat}
            className={`tab${activeCategory === cat ? " active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === "tools" ? "Tools" : "Skills"}
            <span style={{
              marginLeft: 6, fontSize: "0.72rem",
              background: "var(--panel-2)", padding: "1px 6px", borderRadius: 4,
            }}>
              {data[cat].length}
            </span>
          </button>
        ))}
      </div>

      <p className="caption" style={{ marginBottom: 10 }}>{LABELS[activeCategory]}</p>

      {loading ? (
        <p className="muted"><span className="spinner" />Loading…</p>
      ) : (
        <>
          <div className="panel">
            <TagList
              items={data[activeCategory]}
              onChange={(next) => setData((prev) => ({ ...prev, [activeCategory]: next }))}
            />
          </div>
          <button
            className="btn-cta full"
            onClick={() => saveCategory(activeCategory)}
            disabled={saving}
            style={{ marginTop: 8 }}
          >
            {saving && <span className="spinner" />}
            Save {activeCategory === "tools" ? "Tools" : "Skills"} for {roles.find(r => r.key === selectedRole)?.title}
          </button>
        </>
      )}
    </div>
  );
}
