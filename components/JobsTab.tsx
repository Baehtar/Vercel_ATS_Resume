// components/JobsTab.tsx - Reads pre-fetched job listings cached in Supabase
"use client";

import { useEffect, useState } from "react";
import { sortJobsByNewest } from "@/lib/jobSort";

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
  posted_at?: string;
  fetched_at?: string;
}

function JobCard({ job }: { job: Job }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="job-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h3 style={{ margin: "0 0 4px 0" }}>{job.title}</h3>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Company: {job.company}&nbsp;|&nbsp;Location: {job.location}&nbsp;|&nbsp;Salary: {job.salary_range}
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <small className="muted">Posted: {job.posted}</small><br />
          <small className="muted">{job.experience}</small>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        {(job.tags || []).map((tag) => (
          <span key={tag} className="job-tag">{tag}</span>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => setOpen((value) => !value)}
          style={{ padding: "6px 14px", fontSize: "0.85rem" }}
        >
          {open ? "Hide Description" : `View - ${job.title} at ${job.company}`}
        </button>

        {open && (
          <div className="expander-body" style={{ marginTop: 10, background: "var(--panel-2)", borderRadius: 8, padding: 16 }}>
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

export default function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("All");
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/jobs");
        const data = await response.json();

        if (data.jobs && data.jobs.length > 0) {
          const sortedJobs = sortJobsByNewest(data.jobs as Job[]);
          setJobs(sortedJobs);

          const latest = sortedJobs.reduce<string | null>((mostRecent, job) => {
            if (!job.fetched_at) return mostRecent;
            if (!mostRecent) return job.fetched_at;
            return Date.parse(job.fetched_at) > Date.parse(mostRecent)
              ? job.fetched_at
              : mostRecent;
          }, null);

          if (latest) {
            setLastRefreshed(
              new Date(latest).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            );
          }
        } else {
          setJobs([]);
          if (data.error) setError(data.error);
        }
      } catch (err) {
        setJobs([]);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered =
    roleFilter === "All"
      ? jobs
      : jobs.filter((job) => {
          if (roleFilter === "Data Engineer") {
            return job.role_type === "data_engineer" || job.title.toLowerCase().includes("data engineer");
          }
          if (roleFilter === "Data Analyst") {
            return job.role_type === "data_analyst" || job.title.toLowerCase().includes("data analyst");
          }
          if (roleFilter === "Big Data Engineer") {
            return job.title.toLowerCase().includes("big data");
          }
          return true;
        });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ margin: 0 }}>Job Openings</h2>
          <p className="caption">Live listings refreshed daily. Last updated: {lastRefreshed || "recently"}</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginTop: 8 }}>
          Warning: {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "12px 0", flexWrap: "wrap" }}>
        <label className="field-label" style={{ margin: 0 }}>Filter:</label>
        {["All", "Data Engineer", "Data Analyst", "Big Data Engineer"].map((option) => (
          <button
            key={option}
            className={roleFilter === option ? "primary" : ""}
            style={{ padding: "6px 14px" }}
            onClick={() => setRoleFilter(option)}
          >
            {option}
          </button>
        ))}
        <span className="caption" style={{ marginLeft: "auto" }}>
          {loading ? "Loading..." : `${filtered.length} listings`}
        </span>
      </div>

      <hr />

      {loading ? (
        <p className="muted"><span className="spinner" />Loading job listings...</p>
      ) : filtered.length === 0 ? (
        <div className="alert alert-info">No current openings available for this filter.</div>
      ) : (
        filtered.map((job) => <JobCard key={job.id} job={job} />)
      )}
    </div>
  );
}
