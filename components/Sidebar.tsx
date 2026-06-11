// components/Sidebar.tsx - Branding & global controls
"use client";

import { useState } from "react";
import { loadRoleKeywords } from "@/lib/roleKeywords";
import type { AppUser } from "@/lib/types";
import { saveResume } from "@/lib/supabaseClient";
import type { Resume } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";

interface Props {
  user: AppUser;
  resume: Resume;
  targetRole: string;
  onTargetRoleChange: (role: string) => void;
  onLoadSample: () => void;
  onClear: () => void;
  onIdeal: () => void;
  onSignOut: () => void;
  notify: (text: string) => void;
  className?: string;
  onToggle: () => void;
}

export default function Sidebar({
  user,
  resume,
  targetRole,
  onTargetRoleChange,
  onLoadSample,
  onClear,
  onIdeal,
  onSignOut,
  notify,
  className,
  onToggle,
}: Props) {
  const roleKeywords = loadRoleKeywords();
  const roleOptions = Object.fromEntries(
    Object.entries(roleKeywords).map(([k, v]) => [k, v.title || k])
  );
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const isDemo = user.id === "demo-user";

  const doSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    const res = await saveResume(user.id, resume);
    setSaving(false);
    setSaveMsg(
      res.ok
        ? { ok: true, text: "Resume saved successfully!" }
        : { ok: false, text: `Failed to save resume: ${res.error}` }
    );
  };

  return (
    <aside className={`sidebar ${className || ""}`}>
      {/* Collapse button sits inside the sidebar at the top */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <img
          src="/consoleflare-logo.svg"
          alt="ConsoleFlare"
          style={{ height: 36, width: "auto" }}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ThemeToggle />
          <button
            onClick={onToggle}
            title="Collapse sidebar"
            style={{ width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            ◀
          </button>
        </div>
      </div>
      <p className="caption">Your launchpad to data science careers</p>
      <hr />

      <h4>🎯 Target Role</h4>
      <label className="field-label">I am applying for:</label>
      <select value={targetRole} onChange={(e) => onTargetRoleChange(e.target.value)}>
        {Object.keys(roleOptions).map((k) => (
          <option key={k} value={k}>
            {roleOptions[k]}
          </option>
        ))}
      </select>

      <hr />
      <h4>📂 Resume Data</h4>
      <div className="btn-row">
        <button onClick={onLoadSample}>Load Sample</button>
        <button className="primary" onClick={onClear}>
          Clear All
        </button>
      </div>
      <button className="full" style={{ marginTop: 8 }} onClick={onIdeal}>
        ✨ Create Ideal Resume Template
      </button>

      <hr />
      <h4>☁️ Cloud Storage</h4>
      {isDemo ? (
        <div className="alert alert-warning">Running in Demo Mode. Cloud saving is disabled.</div>
      ) : (
        <>
          <button className="primary full" onClick={doSave} disabled={saving}>
            {saving && <span className="spinner" />}💾 Save Resume to Cloud
          </button>
          {saveMsg && (
            <div className={`alert ${saveMsg.ok ? "alert-success" : "alert-error"}`}>
              {saveMsg.text}
            </div>
          )}
        </>
      )}

      <hr />
      <h4>👤 Student Profile</h4>
      <p style={{ margin: "4px 0" }}>
        <strong>Name:</strong> {user.user_metadata?.name || "Student"}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>Email:</strong> {user.email}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>Batch:</strong> {user.user_metadata?.batch || "N/A"}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>Course:</strong> {user.user_metadata?.course || "N/A"}
      </p>

      <hr />
      <button className="full" onClick={onSignOut}>
        🚪 Sign Out
      </button>
    </aside>
  );
}
