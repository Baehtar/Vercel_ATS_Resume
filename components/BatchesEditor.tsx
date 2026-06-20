// components/BatchesEditor.tsx
// Admin tab — edit the list of batches students can pick during sign-up.
"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/supabaseClient";

export default function BatchesEditor() {
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/signup-options?category=batches");
        const json = await res.json();
        setItems(Array.isArray(json.items) ? json.items : []);
      } catch {
        setMsg({ kind: "error", text: "Failed to load batches." });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (items.map((i) => i.toLowerCase()).includes(trimmed.toLowerCase())) {
      setInput("");
      return;
    }
    setItems([...items, trimmed]);
    setInput("");
  };

  const remove = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/admin/signup-options", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: "batches", items }),
      });
      const json = await res.json();
      if (json.ok) {
        setMsg({ kind: "success", text: "Batches saved — new students will see the updated list." });
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
      <h3 style={{ margin: "0 0 4px" }}>Sign-up Batches Editor</h3>
      <p className="caption" style={{ margin: "0 0 16px" }}>
        Manage the batch list students choose from when registering. Order here is the order shown in the dropdown.
      </p>

      {msg && <div className={`alert alert-${msg.kind}`} style={{ marginBottom: 12 }}>{msg.text}</div>}

      {loading ? (
        <p className="muted"><span className="spinner" />Loading batches…</p>
      ) : (
        <>
          <div className="panel">
            {items.length === 0 && (
              <p className="muted" style={{ fontSize: "0.85rem", margin: "0 0 10px" }}>
                No batches yet. Add the first one below.
              </p>
            )}
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 0", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ flex: 1, fontSize: "0.9rem" }}>{item}</span>
                <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} title="Move up" style={{ borderRadius: 0 }}>↑</button>
                <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down" style={{ borderRadius: 0 }}>↓</button>
                <button className="icon-btn" onClick={() => remove(i)} title="Remove" style={{ borderRadius: 0 }}>✕</button>
              </div>
            ))}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                value={input}
                placeholder="e.g. Data Science Fellowship - Jun 2026"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); }}}
                style={{ flex: 1 }}
              />
              <button onClick={add} style={{ flexShrink: 0 }}>+ Add</button>
            </div>
          </div>

          <button className="btn-cta full" onClick={save} disabled={saving} style={{ marginTop: 8 }}>
            {saving && <span className="spinner" />}Save Batches
          </button>
        </>
      )}
    </div>
  );
}
