// components/AtsAudit.tsx - ATS keyword audit panel
"use client";

import type { AtsReport } from "@/lib/types";

export default function AtsAudit({ report }: { report: AtsReport }) {
  const score = report.score;
  return (
    <div>
      <h3>ATS Optimization Score</h3>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div className="metric">
          <div className="metric-label">Score</div>
          <div className="metric-value">{score} / 100</div>
          {score >= 75 ? (
            <div className="alert alert-success" style={{ margin: "8px 0 0" }}>
              Strong Match! 🎉
            </div>
          ) : score >= 50 ? (
            <div className="alert alert-warning" style={{ margin: "8px 0 0" }}>
              Moderate — needs refinement
            </div>
          ) : (
            <div className="alert alert-error" style={{ margin: "8px 0 0" }}>
              Weak — add more keywords
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <table className="score-table">
            <tbody>
              <tr>
                <td>Must-Have Keywords</td>
                <td>
                  <strong>{report.breakdown.must_have_keywords}</strong> / 40
                </td>
              </tr>
              <tr>
                <td>Good-to-Have Keywords</td>
                <td>
                  <strong>{report.breakdown.good_to_have_keywords}</strong> / 15
                </td>
              </tr>
              <tr>
                <td>Section Completeness</td>
                <td>
                  <strong>{report.breakdown.sections}</strong> / 25
                </td>
              </tr>
              <tr>
                <td>Formatting Quality</td>
                <td>
                  <strong>{report.breakdown.formatting}</strong> / 20
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <hr />

      <h4>🔴 Must-Have Keywords</h4>
      <div>
        {report.must_have_matched.map((kw) => (
          <span key={kw} className="kw-must-matched">
            ✓ {kw}
          </span>
        ))}
      </div>
      {report.must_have_missing.length > 0 ? (
        <>
          <p style={{ margin: "8px 0 4px" }}>
            <strong>Missing (add these!):</strong>
          </p>
          <div>
            {report.must_have_missing.map((kw) => (
              <span key={kw} className="kw-must-missing">
                ✗ {kw}
              </span>
            ))}
          </div>
        </>
      ) : report.must_have_matched.length ? (
        <small style={{ color: "var(--green-500)" }}>✅ All must-have keywords present!</small>
      ) : null}

      <h4 style={{ marginTop: 16 }}>🔵 Good-to-Have Keywords</h4>
      <div>
        {report.good_to_have_matched.map((kw) => (
          <span key={kw} className="kw-good-matched">
            ✓ {kw}
          </span>
        ))}
      </div>
      {report.good_to_have_missing.length > 0 && (
        <>
          <p style={{ margin: "8px 0 4px" }}>
            <strong>Could add:</strong>
          </p>
          <div>
            {report.good_to_have_missing.map((kw) => (
              <span key={kw} className="kw-good-missing">
                ○ {kw}
              </span>
            ))}
          </div>
        </>
      )}

      <hr />

      <h4>💡 Suggested Action Verbs</h4>
      {report.verb_suggestions.length > 0 ? (
        <div>
          {report.verb_suggestions.map((v) => (
            <span key={v} className="verb-badge">
              {v}
            </span>
          ))}
        </div>
      ) : (
        <small style={{ color: "var(--green-500)" }}>Great verb usage!</small>
      )}

      <hr />

      <h4>📋 Formatting & Structure Audit</h4>
      {report.formatting_warnings.length === 0 ? (
        <small style={{ color: "var(--green-500)" }}>✅ No formatting issues found!</small>
      ) : (
        report.formatting_warnings.map((w, i) => (
          <div key={i} className={`warn-box ${w.type === "error" ? "warn-error" : "warn-warning"}`}>
            <strong>{w.type === "error" ? "✖" : "⚠"}</strong> {w.message}
          </div>
        ))
      )}

      {report.experience_gaps && report.experience_gaps.length > 0 && (
        <>
          <h4 style={{ marginTop: 16 }}>🗓 Employment Gap Timeline</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {report.experience_gaps.map((gap, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "var(--panel-2)",
                  border: `1px solid ${gap.months > 6 ? "rgba(239,68,68,0.35)" : "rgba(250,200,0,0.35)"}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                }}
              >
                <span style={{ fontSize: "1.3rem" }}>{gap.months > 6 ? "🔴" : "🟡"}</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: "0.9rem" }}>
                    {gap.from} → {gap.to}
                  </strong>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {gap.months} month{gap.months !== 1 ? "s" : ""} gap
                    {gap.months > 6 ? " — significant, address in summary" : " — minor, consider mentioning"}
                  </div>
                </div>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    background: gap.months > 6 ? "rgba(239,68,68,0.12)" : "rgba(250,200,0,0.12)",
                    color: gap.months > 6 ? "#f87171" : "var(--yellow-400)",
                    border: `1px solid ${gap.months > 6 ? "rgba(239,68,68,0.25)" : "rgba(250,200,0,0.25)"}`,
                  }}
                >
                  {gap.months > 6 ? "−5 pts" : "−3 pts"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
