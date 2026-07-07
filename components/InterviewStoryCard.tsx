// components/InterviewStoryCard.tsx
// Displays the AI-generated interview story with key talking points and a follow-up tip.
"use client";

import { useState } from "react";
import type { Resume } from "@/lib/types";
import { getAccessToken } from "@/lib/supabaseClient";
import { loadRoleKeywords } from "@/lib/roleKeywords";

interface Props {
  resume: Resume;
  targetRole: string;
}

interface StoryResult {
  story_title: string;
  story: string;
  key_talking_points: string[];
  follow_up_tip: string;
  api_used: boolean;
  api_error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildExperienceText(resume: Resume): string {
  return (resume.experience || [])
    .map((e) => {
      const header = `${e.role || "Role"} at ${e.company || "Company"} (${e.startDate || ""} – ${e.endDate || ""})`;
      const bullets = (e.bullets || []).filter(Boolean).map((b) => `  • ${b}`).join("\n");
      return `${header}\n${bullets}`;
    })
    .join("\n\n");
}

function buildProjectsText(resume: Resume): string {
  return (resume.projects || [])
    .filter((p) => p.name)
    .map((p) => `${p.name} (${p.tech || ""}): ${p.description || ""}`)
    .join("\n");
}

function buildSkillsText(resume: Resume): string {
  return (resume.skills || [])
    .filter((s) => s.list)
    .map((s) => `${s.category || "Skills"}: ${s.list}`)
    .join("\n");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InterviewStoryCard({ resume, targetRole }: Props) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<StoryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const roleTitle =
    loadRoleKeywords()[targetRole]?.title ||
    targetRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const hasEnoughData =
    (resume.experience || []).some((e) => e.company || e.role) ||
    (resume.projects || []).some((p) => p.name);

  const generate = async () => {
    setBusy(true);
    setResult(null);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          full_name: resume.personal?.fullName || "",
          target_role: targetRole,
          headline: resume.personal?.headline || "",
          summary: resume.summary || "",
          experience_text: buildExperienceText(resume),
          projects_text: buildProjectsText(resume),
          skills_text: buildSkillsText(resume),
        }),
      });
      const data: StoryResult = await res.json();
      setResult(data);
    } catch (e) {
      setResult({
        story_title: "Generation failed",
        story: "",
        key_talking_points: [],
        follow_up_tip: "",
        api_used: false,
        api_error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.story) return;
    try {
      await navigator.clipboard.writeText(result.story);
    } catch {/* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "20px 22px",
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, color: "var(--premium-white)" }}>
            Your Interview Story
          </h3>
          <p className="caption" style={{ margin: "4px 0 0" }}>
            A personalised 60-second story built from your resume — use it for
            &quot;Tell me about yourself&quot; or &quot;Walk me through your experience.&quot;
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {result && (
            <button className="ghost" onClick={handleCopy} style={{ fontSize: "0.82rem" }}>
              {copied ? "✓ Copied!" : "Copy Story"}
            </button>
          )}
          <button
            className="btn-cta"
            onClick={generate}
            disabled={busy || !hasEnoughData}
            title={!hasEnoughData ? "Add at least one experience entry or project first" : undefined}
          >
            {busy && <span className="spinner" />}
            {result ? "Regenerate Story" : "Generate My Story"}
          </button>
        </div>
      </div>

      {!hasEnoughData && !result && (
        <div className="alert alert-warning" style={{ marginTop: 14 }}>
          Add at least one experience entry or project in your CV tab first — the story is built
          directly from your resume content.
        </div>
      )}

      {/* Result */}
      {result && result.story && (
        <div style={{ marginTop: 18 }}>
          {/* API status */}
          {!result.api_used && result.api_error && (
            <div className="alert alert-warning" style={{ marginBottom: 12 }}>
              {result.api_error}
            </div>
          )}

          {/* Story title badge */}
          <div style={{ marginBottom: 10 }}>
            <span
              style={{
                display: "inline-block",
                background: "rgba(21,93,252,0.12)",
                color: "var(--premium-white)",
                border: "1px solid rgba(21,93,252,0.25)",
                borderRadius: 20,
                padding: "3px 14px",
                fontSize: "0.82rem",
                fontWeight: 700,
                letterSpacing: "0.01em",
              }}
            >
              {result.story_title}
            </span>
          </div>

          {/* The story itself */}
          <div
            style={{
              background: "var(--panel-2)",
              borderRadius: 10,
              padding: "18px 20px",
              borderLeft: "4px solid var(--premium-white)",
              lineHeight: 1.7,
              fontSize: "0.95rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {result.story}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginTop: 16,
            }}
          >
            {/* Key talking points */}
            {result.key_talking_points?.length > 0 && (
              <div
                style={{
                  background: "var(--panel-2)",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-muted)",
                  }}
                >
                  Key Talking Points
                </p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.key_talking_points.map((pt, i) => (
                    <li key={i} style={{ fontSize: "0.88rem", marginBottom: 6 }}>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up tip */}
            {result.follow_up_tip && (
              <div
                style={{
                  background: "rgba(0,199,88,0.07)",
                  border: "1px solid rgba(0,199,88,0.2)",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--green-500)",
                  }}
                >
                  Follow-Up Tip
                </p>
                <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.6 }}>
                  {result.follow_up_tip}
                </p>
              </div>
            )}
          </div>

          {/* Practice nudge */}
          <div className="alert alert-info" style={{ marginTop: 14 }}>
            <strong>Practice tip:</strong> Read this story out loud 3 times. Time yourself — aim
            for 60–80 seconds. Adjust the pace, not the words.
          </div>
        </div>
      )}

      {/* Empty state after failed generation */}
      {result && !result.story && (
        <div className="alert alert-error" style={{ marginTop: 14 }}>
          {result.api_error || "Could not generate a story. Try again."}
        </div>
      )}
    </div>
  );
}
