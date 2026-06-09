// components/PrepTab.tsx - Interview prep question banks
"use client";

import { useState } from "react";
import { INTERVIEW_QUESTIONS, type PrepQuestion } from "@/lib/prepDb";

function QuestionItem({ q, qi }: { q: PrepQuestion; qi: number }) {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answer, setAnswer] = useState("");
  const diffCls = `difficulty-${q.difficulty.toLowerCase()}`;

  return (
    <details className="expander">
      <summary>
        Q{qi + 1}: {q.question}
      </summary>
      <div className="expander-body">
        <span className={diffCls}>Difficulty: {q.difficulty}</span>

        <div style={{ margin: "10px 0" }}>
          <label style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showHint}
              onChange={(e) => setShowHint(e.target.checked)}
              style={{ width: "auto", marginRight: 6 }}
            />
            💡 Show Hint
          </label>
        </div>
        {showHint && (
          <div className="alert alert-info">
            <strong>Hint:</strong> {q.hint}
          </div>
        )}

        <label className="field-label">✍ Write your answer here:</label>
        <textarea
          rows={5}
          value={answer}
          placeholder="Type your answer to practice..."
          onChange={(e) => setAnswer(e.target.value)}
        />

        <div style={{ margin: "10px 0" }}>
          <label style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showAnswer}
              onChange={(e) => setShowAnswer(e.target.checked)}
              style={{ width: "auto", marginRight: 6 }}
            />
            📝 Show Sample Answer
          </label>
        </div>
        {showAnswer && (
          <div className="alert alert-success">
            <strong>Sample Answer:</strong>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: "6px 0 0" }}>
              {q.sample_answer}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}

export default function PrepTab() {
  const [role, setRole] = useState<string>(Object.keys(INTERVIEW_QUESTIONS)[0]);
  const roleData = INTERVIEW_QUESTIONS[role];

  return (
    <div>
      <h2>🎓 Interview Preparation</h2>
      <p className="caption">Practice role-specific technical and behavioral questions</p>

      <label className="field-label">Select Role to Practice</label>
      <select style={{ maxWidth: 320 }} value={role} onChange={(e) => setRole(e.target.value)}>
        {Object.keys(INTERVIEW_QUESTIONS).map((k) => (
          <option key={k} value={k}>
            {INTERVIEW_QUESTIONS[k].title}
          </option>
        ))}
      </select>

      {Object.entries(roleData.categories).map(([categoryName, questions]) => (
        <div key={categoryName}>
          <h3 style={{ marginTop: 20 }}>📂 {categoryName}</h3>
          {questions.map((q, qi) => (
            <QuestionItem key={qi} q={q} qi={qi} />
          ))}
          <hr />
        </div>
      ))}
    </div>
  );
}
