"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/supabaseClient";
import { DEFAULT_PROMPT_TEMPLATES, PROMPT_LABELS, type PromptKey } from "@/lib/promptTemplates";

const keys = Object.keys(PROMPT_LABELS) as PromptKey[];

export default function PromptEditor() {
  const [selected, setSelected] = useState<PromptKey>(keys[0]);
  const [prompts, setPrompts] = useState<Record<PromptKey, string>>(DEFAULT_PROMPT_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/prompt-options")
      .then((r) => r.json())
      .then((json) => { if (json.prompts) setPrompts(json.prompts); })
      .catch(() => setMsg({ kind: "error", text: "Failed to load prompts." }))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/admin/prompt-options", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: selected, prompt: prompts[selected] }),
      });
      const json = await res.json();
      setMsg(json.ok ? { kind: "success", text: "Prompt saved. New AI generations will use it." } : { kind: "error", text: json.error || "Save failed." });
    } catch (e) {
      setMsg({ kind: "error", text: `Save failed: ${e}` });
    } finally { setSaving(false); }
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 4px" }}>AI Prompt Editor</h3>
      <p className="caption" style={{ margin: "0 0 16px" }}>
        Edit the instructions sent to the AI. Keep the requested JSON output format so the generator can read the response. Available placeholders: <code>{"{{discipline}}"}</code>, <code>{"{{label}}"}</code>, <code>{"{{adjective}}"}</code>, <code>{"{{storyDiscipline}}"}</code>, and <code>{"{{focusTech}}"}</code>.
      </p>
      {msg && <div className={`alert alert-${msg.kind}`} style={{ marginBottom: 12 }}>{msg.text}</div>}
      {loading ? <p className="muted"><span className="spinner" />Loading prompts...</p> : (
        <>
          <label className="field-label">Prompt</label>
          <select value={selected} onChange={(e) => setSelected(e.target.value as PromptKey)} style={{ maxWidth: 360, marginBottom: 10 }}>
            {keys.map((key) => <option key={key} value={key}>{PROMPT_LABELS[key]}</option>)}
          </select>
          <textarea
            rows={24}
            value={prompts[selected]}
            onChange={(e) => setPrompts((current) => ({ ...current, [selected]: e.target.value }))}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "0.82rem", lineHeight: 1.5 }}
          />
          <button className="btn-cta full" onClick={save} disabled={saving} style={{ marginTop: 8 }}>
            {saving && <span className="spinner" />}Save {PROMPT_LABELS[selected]} Prompt
          </button>
        </>
      )}
    </div>
  );
}
