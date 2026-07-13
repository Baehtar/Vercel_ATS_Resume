// Admin tab - manage domain-specific topics and bullet notes.
"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/supabaseClient";

interface DomainTopic {
  topic: string;
  points: string[];
}

interface DomainNote {
  domain: string;
  topics: DomainTopic[];
}

const EMPTY_TOPIC: DomainTopic = { topic: "", points: [""] };
const EMPTY_DOMAIN: DomainNote = { domain: "", topics: [{ ...EMPTY_TOPIC, points: [""] }] };

function normalizeItems(items: unknown[]): DomainNote[] {
  return items
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => {
      const legacyNotes = typeof item.notes === "string" ? item.notes : "";
      const rawTopics = Array.isArray(item.topics) ? item.topics : [];
      const topics = rawTopics
        .filter((topic): topic is Record<string, unknown> => Boolean(topic && typeof topic === "object"))
        .map((topic) => ({
          topic: typeof topic.topic === "string" ? topic.topic : "",
          points: Array.isArray(topic.points)
            ? topic.points.filter((point): point is string => typeof point === "string")
            : [],
        }))
        .filter((topic) => topic.topic || topic.points.some((point) => point.trim()));

      // Keep previously saved paragraph notes visible after the format change.
      if (!topics.length && legacyNotes.trim()) {
        topics.push({ topic: "Previous notes", points: [legacyNotes] });
      }

      return {
        domain: typeof item.domain === "string" ? item.domain : "",
        topics,
      };
    })
    .filter((item) => item.domain.trim());
}

export default function DomainNotesEditor() {
  const [items, setItems] = useState<DomainNote[]>([]);
  const [editing, setEditing] = useState<DomainNote | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/signup-options?category=domain_notes");
        const json = await res.json();
        setItems(normalizeItems(Array.isArray(json.items) ? json.items : []));
      } catch {
        setMsg({ kind: "error", text: "Failed to load domain notes." });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (nextItems: DomainNote[]) => {
    setSaving(true);
    setMsg(null);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/admin/signup-options", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: "domain_notes", items: nextItems }),
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg({ kind: "error", text: json.error || "Save failed." });
        return;
      }
      setItems(nextItems);
      setMsg({ kind: "success", text: "Domain topics and bullets saved." });
    } catch (e) {
      setMsg({ kind: "error", text: `Save failed: ${e}` });
    } finally {
      setSaving(false);
    }
  };

  const startAdd = () => {
    setEditing(structuredClone(EMPTY_DOMAIN));
    setEditIndex(null);
    setMsg(null);
  };

  const startEdit = (item: DomainNote, index: number) => {
    const copy = structuredClone(item);
    if (!copy.topics.length) copy.topics = [{ ...EMPTY_TOPIC, points: [""] }];
    setEditing(copy);
    setEditIndex(index);
    setMsg(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditIndex(null);
  };

  const updateTopic = (topicIndex: number, update: Partial<DomainTopic>) => {
    if (!editing) return;
    const topics = [...editing.topics];
    topics[topicIndex] = { ...topics[topicIndex], ...update };
    setEditing({ ...editing, topics });
  };

  const updatePoint = (topicIndex: number, pointIndex: number, value: string) => {
    if (!editing) return;
    const topics = structuredClone(editing.topics);
    topics[topicIndex].points[pointIndex] = value;
    setEditing({ ...editing, topics });
  };

  const addTopic = () => {
    if (!editing) return;
    setEditing({ ...editing, topics: [...editing.topics, structuredClone(EMPTY_TOPIC)] });
  };

  const removeTopic = (topicIndex: number) => {
    if (!editing) return;
    setEditing({ ...editing, topics: editing.topics.filter((_, index) => index !== topicIndex) });
  };

  const addPoint = (topicIndex: number) => {
    if (!editing) return;
    const topics = structuredClone(editing.topics);
    topics[topicIndex].points.push("");
    setEditing({ ...editing, topics });
  };

  const removePoint = (topicIndex: number, pointIndex: number) => {
    if (!editing) return;
    const topics = structuredClone(editing.topics);
    topics[topicIndex].points = topics[topicIndex].points.filter((_, index) => index !== pointIndex);
    setEditing({ ...editing, topics });
  };

  const commitEdit = () => {
    if (!editing || !editing.domain.trim()) {
      setMsg({ kind: "error", text: "A domain name is required." });
      return;
    }
    const duplicate = items.some((item, index) =>
      index !== editIndex && item.domain.trim().toLowerCase() === editing.domain.trim().toLowerCase()
    );
    if (duplicate) {
      setMsg({ kind: "error", text: "That domain already exists." });
      return;
    }

    const normalized: DomainNote = {
      domain: editing.domain.trim(),
      topics: editing.topics
        .map((topic) => ({
          topic: topic.topic.trim(),
          points: topic.points.map((point) => point.trim()).filter(Boolean),
        }))
        .filter((topic) => topic.topic || topic.points.length),
    };
    const next = [...items];
    if (editIndex === null) next.push(normalized);
    else next[editIndex] = normalized;
    setEditing(null);
    setEditIndex(null);
    void save(next);
  };

  const remove = (index: number) => {
    if (!confirm(`Remove "${items[index].domain}"?`)) return;
    void save(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 4px" }}>Domain Topics</h3>
      <p className="caption" style={{ margin: "0 0 16px" }}>
        Add topics for each domain, then capture details as separate bullet points or textboxes.
        These notes are stored for future use and do not affect resumes yet.
      </p>

      {msg && <div className={`alert alert-${msg.kind}`} style={{ marginBottom: 12 }}>{msg.text}</div>}

      {loading ? (
        <p className="muted"><span className="spinner" />Loading domain topics...</p>
      ) : (
        <>
          {items.length === 0 && !editing && (
            <p className="muted" style={{ fontSize: "0.85rem" }}>No domains added yet. Add the first domain below.</p>
          )}

          {items.map((item, index) => (
            <div key={`${item.domain}-${index}`} className="panel domain-note-card">
              <div className="domain-note-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{item.domain}</div>
                  {item.topics.length === 0 && <div className="muted" style={{ marginTop: 5 }}>No topics added.</div>}
                  {item.topics.map((topic, topicIndex) => (
                    <div key={topicIndex} style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{topic.topic || "Untitled topic"}</div>
                      <ul style={{ margin: "4px 0 0 18px", padding: 0, color: "var(--text-muted)", fontSize: "0.84rem" }}>
                        {topic.points.map((point, pointIndex) => <li key={pointIndex}>{point}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="domain-note-actions">
                  <button className="domain-action-btn" onClick={() => startEdit(item, index)}>Edit</button>
                  <button className="domain-action-btn danger" onClick={() => remove(index)} disabled={saving}>Remove</button>
                </div>
              </div>
            </div>
          ))}

          {editing ? (
            <div className="panel" style={{ marginTop: 10, border: "1px solid var(--primary)" }}>
              <h4 style={{ margin: "0 0 12px" }}>{editIndex === null ? "Add Domain" : "Edit Domain Topics"}</h4>
              <label className="field-label">Domain *</label>
              <input
                value={editing.domain}
                placeholder="e.g. FinTech, Healthcare, Retail"
                onChange={(e) => setEditing({ ...editing, domain: e.target.value })}
              />

              {editing.topics.map((topic, topicIndex) => (
                <div key={topicIndex} style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <label className="field-label" style={{ margin: 0 }}>Topic {topicIndex + 1}</label>
                    <button className="ghost" onClick={() => removeTopic(topicIndex)} disabled={editing.topics.length === 1}>Remove Topic</button>
                  </div>
                  <input
                    value={topic.topic}
                    placeholder="e.g. Common hiring signals"
                    onChange={(e) => updateTopic(topicIndex, { topic: e.target.value })}
                  />
                  {topic.points.map((point, pointIndex) => (
                    <div key={pointIndex} className="domain-point-row">
                      <textarea
                        rows={2}
                        value={point}
                        placeholder={`Bullet or note ${pointIndex + 1}`}
                        onChange={(e) => updatePoint(topicIndex, pointIndex, e.target.value)}
                        style={{ flex: 1, margin: 0 }}
                      />
                      <button className="domain-action-btn danger" onClick={() => removePoint(topicIndex, pointIndex)} disabled={topic.points.length === 1}>Remove</button>
                    </div>
                  ))}
                  <button style={{ marginTop: 8 }} onClick={() => addPoint(topicIndex)}>+ Add Bullet / Textbox</button>
                </div>
              ))}

              <div className="btn-row" style={{ marginTop: 14 }}>
                <button onClick={addTopic}>+ Add Topic</button>
                <button className="btn-cta" onClick={commitEdit} disabled={saving}>
                  {saving && <span className="spinner" />}
                  {editIndex === null ? "Add Domain" : "Save Changes"}
                </button>
                <button className="ghost" onClick={cancelEdit}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="full" style={{ marginTop: 10 }} onClick={startAdd} disabled={saving}>
              + Add Domain
            </button>
          )}
        </>
      )}
    </div>
  );
}
