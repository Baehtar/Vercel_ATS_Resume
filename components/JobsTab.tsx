// components/JobsTab.tsx - Job board with filters
"use client";

import { useState } from "react";
import { MOCK_JOB_LISTINGS } from "@/lib/jobDb";

export default function JobsTab() {
  const jobs = MOCK_JOB_LISTINGS;
  const [roleFilter, setRoleFilter] = useState("All");
  const [expFilter, setExpFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");

  const experienceOrder = [
    "0-2 years", "1-3 years", "2-4 years", "3-5 years", "3+ years",
    "5-8 years", "5+ years", "Not specified",
  ];
  const experienceOptions = experienceOrder.filter((lvl) =>
    jobs.some((j) => j.experience === lvl)
  );
  const sourceOptions = Array.from(new Set(jobs.map((j) => j.source))).sort();

  let filtered = jobs;
  if (roleFilter !== "All") {
    const key = roleFilter === "Data Engineer" ? "data_engineer" : "data_analyst";
    filtered = filtered.filter((j) => j.role_type === key);
  }
  if (expFilter !== "All") filtered = filtered.filter((j) => j.experience === expFilter);
  if (sourceFilter !== "All") filtered = filtered.filter((j) => j.source === sourceFilter);

  return (
    <div>
      <h2>🔍 Latest Data Science Job Openings</h2>
      <p className="caption">Curated openings for Data Engineers and Data Analysts</p>

      <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div>
          <label className="field-label">Filter by Role</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            {["All", "Data Engineer", "Data Analyst"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Experience Level</label>
          <select value={expFilter} onChange={(e) => setExpFilter(e.target.value)}>
            {["All", ...experienceOptions].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Source</label>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            {["All", ...sourceOptions].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      <hr />

      {filtered.length === 0 ? (
        <div className="alert alert-info">No jobs match your filters. Try broadening your search.</div>
      ) : (
        <p>
          <strong>Showing {filtered.length} openings</strong>
        </p>
      )}

      {filtered.map((job) => (
        <div key={job.id} className="job-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0" }}>{job.title}</h3>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                🏢 {job.company} &nbsp;|&nbsp; 📍 {job.location} &nbsp;|&nbsp; 💰 {job.salary_range}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <small className="muted">📅 {job.posted}</small>
              <br />
              <small className="muted">via {job.source}</small>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            {job.tags.map((t) => (
              <span key={t} className="job-tag">
                {t}
              </span>
            ))}
          </div>

          <details className="expander" style={{ marginTop: 12 }}>
            <summary>
              📖 View Full Description — {job.title} at {job.company}
            </summary>
            <div className="expander-body">
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  margin: 0,
                  fontSize: "0.9rem",
                }}
              >
                {job.description}
              </pre>
              <hr />
              <p>
                <strong>Experience Required:</strong> {job.experience}
              </p>
              <a href={job.apply_url} target="_blank" rel="noreferrer">
                <button className="primary full">🔗 Apply on {job.source}</button>
              </a>
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}
