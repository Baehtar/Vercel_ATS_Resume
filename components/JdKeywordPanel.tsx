// components/JdKeywordPanel.tsx
// Paste a job description, extract tech keywords, and show what's in your
// resume vs what's missing, with one-click copy for each missing keyword.
"use client";

import { useMemo, useState } from "react";
import { parseJd } from "@/lib/jdParser";
import type { Resume } from "@/lib/types";

interface Props {
  resume: Resume;
  notify: (text: string) => void;
  onPersonalise: (missingKeywords: string[]) => void;
}

export default function JdKeywordPanel({ resume, notify, onPersonalise }: Props) {
  const [jdText, setJdText] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // Re-parse whenever the submitted JD text or the resume changes so the
  // matched/missing split stays in sync as the user edits their resume.
  const liveResult = useMemo(
    () => (submitted ? parseJd(submitted, resume) : null),
    [submitted, resume]
  );

  const handleAnalyse = () => {
    if (!jdText.trim()) return;
    setSubmitted(jdText);
  };

  const handleCopy = async (kw: string) => {
    try {
      await navigator.clipboard.writeText(kw);
    } catch {
      // fallback for older browsers / non-HTTPS
    }
    setCopied(kw);
    notify(`Copied "${kw}". Paste it into your Skills or Summary.`);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleClear = () => {
    setJdText("");
    setSubmitted("");
  };

  const display = liveResult;
  const hasResult = display && display.allKeywords.length > 0;
  const coveragePercent =
    hasResult && display.allKeywords.length > 0
      ? Math.round((display.matched.length / display.allKeywords.length) * 100)
      : 0;

  return (
    <details className="expander">
      <summary>Job Description Keyword Matcher</summary>
      <div className="expander-body">
        <p className="caption" style={{ marginTop: 0 }}>
          Paste a job description below. Keywords found in the JD will be
          compared against your resume, so you know exactly what to add to
          maximise your match for <em>this specific role</em>.
        </p>

        <textarea
          rows={6}
          value={jdText}
          placeholder="Paste the full job description here..."
          onChange={(e) => setJdText(e.target.value)}
        />

        <div className="btn-row" style={{ marginTop: 10 }}>
          <button className="btn-cta" onClick={handleAnalyse} disabled={!jdText.trim()}>
            Analyse JD
          </button>
          {submitted && (
            <button className="ghost" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        {display && display.allKeywords.length === 0 && (
          <div className="alert alert-warning" style={{ marginTop: 14 }}>
            No recognised tech keywords found. Try pasting a more detailed job
            description.
          </div>
        )}

        {hasResult && (
          <div style={{ marginTop: 18 }}>
            {/* Coverage bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 8,
                    borderRadius: 99,
                    background: "var(--panel-3)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${coveragePercent}%`,
                      background:
                        coveragePercent >= 70
                          ? "var(--green-500)"
                          : coveragePercent >= 40
                          ? "var(--yellow-400)"
                          : "#ef4444",
                      borderRadius: 99,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color:
                    coveragePercent >= 70
                      ? "var(--green-500)"
                      : coveragePercent >= 40
                      ? "var(--yellow-400)"
                      : "#ef4444",
                  minWidth: 48,
                  textAlign: "right",
                }}
              >
                {coveragePercent}%
              </span>
              <span className="caption" style={{ whiteSpace: "nowrap" }}>
                JD coverage
              </span>
            </div>

            <p className="caption" style={{ margin: "0 0 6px" }}>
              {display.allKeywords.length} keywords found in JD{" | "}
              <span style={{ color: "var(--green-500)", fontWeight: 600 }}>
                {display.matched.length} in your resume
              </span>{" "}
              {" | "}
              <span style={{ color: "#ef4444", fontWeight: 600 }}>
                {display.missing.length} missing
              </span>
            </p>

            {/* Missing keywords - primary action */}
            {display.missing.length > 0 && (
              <>
                <h4 style={{ marginTop: 14, marginBottom: 6, color: "#f87171" }}>
                  Missing from your resume - add these
                </h4>
                <p className="caption" style={{ marginTop: 0, marginBottom: 8 }}>
                  Click a keyword to copy it, then paste it into your Skills,
                  Summary, or Experience bullets.
                </p>
                <button
                  className="btn-cta"
                  style={{ marginBottom: 10 }}
                  onClick={() => onPersonalise(display.missing)}
                >
                  Personalise Resume to Job
                </button>
                <p className="caption" style={{ marginTop: 0, marginBottom: 8 }}>
                  Adds these recognised keywords to your Skills and Tools groups.
                  Keep only skills you can confidently discuss in an interview.
                </p>
                <div className="chip-select">
                  {display.missing.map((kw) => (
                    <button
                      key={kw}
                      title={`Click to copy "${kw}"`}
                      onClick={() => handleCopy(kw)}
                      style={{
                        padding: "5px 14px",
                        borderRadius: 20,
                        border: "1px solid rgba(239,68,68,0.4)",
                        background:
                          copied === kw
                            ? "rgba(239,68,68,0.25)"
                            : "rgba(239,68,68,0.10)",
                        color: copied === kw ? "#fff" : "#f87171",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        // override global uppercase button style
                        textTransform: "none",
                        letterSpacing: "normal",
                        boxShadow: "none",
                      }}
                    >
                      {copied === kw ? "Copied!" : `+ ${kw}`}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Matched keywords */}
            {display.matched.length > 0 && (
              <>
                <h4 style={{ marginTop: 18, marginBottom: 6, color: "var(--green-500)" }}>
                  Already in your resume
                </h4>
                <div className="chip-select">
                  {display.matched.map((kw) => (
                    <span key={kw} className="kw-must-matched">
                      {kw}
                    </span>
                  ))}
                </div>
              </>
            )}

            {display.missing.length === 0 && (
              <div className="alert alert-success" style={{ marginTop: 14 }}>
                Your resume covers all tech keywords in this job description!
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
