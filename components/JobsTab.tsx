// components/JobsTab.tsx - Reads pre-fetched job listings cached in Supabase
"use client";

import { useEffect, useState } from "react";
import { MOCK_JOB_LISTINGS } from "@/lib/jobDb";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  role_type?: string;
  experience: string;
  posted: string;
  salary_range: string;
  source: string;
  apply_url: string;
  description: string;
  tags: string[];
}

function JobCard({ job }: { job: Job }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="job-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ margin: "0 0 4px 0" }}>{job.title}</h3>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Company: {job.company}&nbsp;|&nbsp;Location: {job.location}&nbsp;|&nbsp;Salary: {job.salary_range}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <small className="muted">Posted: {job.posted}</small><br />
          <small className="muted">{job.experience}</small>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        {(job.tags || []).map((t) => (
          <span key={t} className="job-tag">{t}</span>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{ padding: "6px 14px", fontSize: "0.85rem" }}
        >
          {open ? "Hide Description" : `View — ${job.title} at ${job.company}`}
        </button>

        {open && (
          <div className="expander-body" style={{ marginTop: 10, background: "var(--panel-2)", borderRadius: 10, padding: 16 }}>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0, fontSize: "0.9rem" }}>
              {job.description}
            </pre>
            <hr />
            <p><strong>Experience:</strong> {job.experience}</p>
            <a href={job.apply_url} target="_blank" rel="noreferrer">
              <button className="primary full">Apply</button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  role_type?: string;
  experience: string;
  posted: string;
  salary_range: string;
  source: string;
  apply_url: string;
  description: string;
  tags: string[];
}

export default function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All");
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/jobs");
        const data = await res.json();

        if (data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
          setUsingMock(false);
          // Show when the most recent listing was fetched
          const latest = data.jobs[0]?.fetched_at;
          if (latest) {
            setLastRefreshed(
              new Date(latest).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
              })
            );
          }
        } else {
          // Fall back to mock data if Supabase is empty or not yet seeded
          setJobs(
            MOCK_JOB_LISTINGS.map((j) => ({
              ...j,
              id: String(j.id),
              role_type: j.role_type,
            }))
          );
          setUsingMock(true);
          if (data.error) setError(data.error);
        }
      } catch (e) {
        setJobs(
          MOCK_JOB_LISTINGS.map((j) => ({ ...j, id: String(j.id), role_type: j.role_type }))
        );
        setUsingMock(true);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered =
    roleFilter === "All"
      ? jobs
      : jobs.filter((j) => {
          if (roleFilter === "Data Engineer")
            return j.role_type === "data_engineer" || j.title.toLowerCase().includes("data engineer");
          if (roleFilter === "Data Analyst")
            return j.role_type === "data_analyst" || j.title.toLowerCase().includes("data analyst");
          if (roleFilter === "Big Data Engineer")
            return j.title.toLowerCase().includes("big data");
          return true;
        });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ margin: 0 }}>Job Openings</h2>
          <p className="caption">
            {usingMock
              ? "Showing sample listings — live listings load after first daily refresh."
              : `Live listings refreshed daily · Last updated: ${lastRefreshed || "recently"}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginTop: 8 }}>
          Warning: {error}
        </div>
      )}

      {/* Filter */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "12px 0" }}>
        <label className="field-label" style={{ margin: 0 }}>Filter:</label>
        {["All", "Data Engineer", "Data Analyst", "Big Data Engineer"].map((opt) => (
          <button
            key={opt}
            className={roleFilter === opt ? "primary" : ""}
            style={{ padding: "6px 14px" }}
            onClick={() => setRoleFilter(opt)}
          >
            {opt}
          </button>
        ))}
        <span className="caption" style={{ marginLeft: "auto" }}>
          {loading ? "Loading…" : `${filtered.length} listings`}
        </span>
      </div>

      <hr />

      {loading ? (
        <p className="muted"><span className="spinner" />Loading job listings…</p>
      ) : filtered.length === 0 ? (
        <div className="alert alert-info">No listings for this filter.</div>
      ) : (
        filtered.map((job) => (
          <JobCard key={job.id} job={job} />
        ))
      )}
    </div>
  );
}
