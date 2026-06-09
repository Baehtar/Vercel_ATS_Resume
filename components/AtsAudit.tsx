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
        <small style={{ color: "#10b981" }}>✅ All must-have keywords present!</small>
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
        <small style={{ color: "#10b981" }}>Great verb usage!</small>
      )}

      <hr />

      <h4>📋 Formatting & Structure Audit</h4>
      {report.formatting_warnings.length === 0 ? (
        <small style={{ color: "#10b981" }}>✅ No formatting issues found!</small>
      ) : (
        report.formatting_warnings.map((w, i) => (
          <div key={i} className={`warn-box ${w.type === "error" ? "warn-error" : "warn-warning"}`}>
            <strong>{w.type === "error" ? "✖" : "⚠"}</strong> {w.message}
          </div>
        ))
      )}
    </div>
  );
}
