// app/page.tsx - Main application orchestrator
"use client";

import { useEffect, useState, useCallback } from "react";
import type { AppUser, Resume } from "@/lib/types";
import {
  getSupabaseClient,
  getUserRole,
  loadResume,
  signOutStudent,
} from "@/lib/supabaseClient";
import {
  getEmptySchema,
  getDefaultSample,
  getIdealTemplate,
} from "@/lib/resumeTemplates";
import Auth from "@/components/Auth";
import Sidebar from "@/components/Sidebar";
import AdminDashboard from "@/components/AdminDashboard";
import CVTab from "@/components/CVTab";
import JobsTab from "@/components/JobsTab";
import PrepTab from "@/components/PrepTab";

type Tab = "cv" | "jobs" | "prep";

export default function Home() {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<string>("student");
  const [resume, setResume] = useState<Resume>(getEmptySchema());
  const [targetRole, setTargetRole] = useState("data_engineer");
  const [activeTab, setActiveTab] = useState<Tab>("cv");
  const [toast, setToast] = useState<string | null>(null);
  const [resumeLoadedFromDb, setResumeLoadedFromDb] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const notify = useCallback((text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Disable browser autofill highlighting on all inputs (the white "Your Name"
  // box). Chrome paints empty autofill-candidate fields with a light background;
  // setting autocomplete off prevents it. A MutationObserver covers inputs that
  // render later inside expanders/tabs.
  useEffect(() => {
    const disableAutofill = () => {
      document.querySelectorAll("input").forEach((el) => {
        if (el.getAttribute("autocomplete") !== "off") {
          el.setAttribute("autocomplete", "off");
        }
      });
    };
    disableAutofill();
    const observer = new MutationObserver(disableAutofill);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Restore an existing Supabase session on first load.
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setBootstrapping(false);
      return;
    }
    (async () => {
      const { data } = await client.auth.getSession();
      const sessionUser = data.session?.user;
      // Don't auto-restore if a recovery flow is in progress.
      const params = new URLSearchParams(window.location.search);
      const recovering = params.get("reset") === "1" || params.get("type") === "recovery";
      if (sessionUser && !recovering) {
        setUser(sessionUser as unknown as AppUser);
      }
      setBootstrapping(false);
    })();
  }, []);

  // Resolve role + load saved resume once a user is present.
  useEffect(() => {
    if (!user) return;
    (async () => {
      if (user.id !== "demo-user") {
        const r = await getUserRole(user.id);
        setRole(r);
        if (r !== "admin" && !resumeLoadedFromDb) {
          const dbResume = await loadResume(user.id);
          if (dbResume) {
            setResume(dbResume);
            notify("CV loaded from Supabase ☁️");
          }
        }
      }
      setResumeLoadedFromDb(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSignOut = async () => {
    await signOutStudent();
    setUser(null);
    setRole("student");
    setResume(getEmptySchema());
    setResumeLoadedFromDb(false);
  };

  if (bootstrapping) {
    return (
      <div className="main">
        <p className="muted">
          <span className="spinner" />Loading…
        </p>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={(u) => setUser(u)} />;
  }

  if (role === "admin") {
    return <AdminDashboard onSignOut={handleSignOut} />;
  }

  const userName = user.user_metadata?.name || "Student";

  return (
    <div className="app-shell">
      {/* Floating open button — only visible when sidebar is collapsed */}
      {!sidebarOpen && (
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          title="Open sidebar"
          style={{ left: 12 }}
        >
          ▶
        </button>
      )}

      <Sidebar
        className={sidebarOpen ? "" : "collapsed"}
        onToggle={() => setSidebarOpen(false)}
        user={user}
        resume={resume}
        targetRole={targetRole}
        onTargetRoleChange={setTargetRole}
        onLoadSample={() => {
          setResume(getDefaultSample());
          notify("Sample resume loaded 📂");
        }}
        onClear={() => {
          setResume(getEmptySchema());
          notify("Resume cleared 🗑");
        }}
        onIdeal={() => {
          setResume(getIdealTemplate(targetRole));
          notify("Ideal resume template created ✨");
        }}
        onSignOut={handleSignOut}
        notify={notify}
      />

      <main className="main">
        <div style={{ textAlign: "right", color: "var(--blue-600)", fontSize: "1.1rem" }}>
          👋 Hello {userName}
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === "cv" ? "active" : ""}`}
            onClick={() => setActiveTab("cv")}
          >
            📝 My CV
          </button>
          <button
            className={`tab ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
            🔍 Job Openings
          </button>
          <button
            className={`tab ${activeTab === "prep" ? "active" : ""}`}
            onClick={() => setActiveTab("prep")}
          >
            🎓 Interview Prep
          </button>
        </div>

        {activeTab === "cv" && (
          <CVTab
            resume={resume}
            onResumeChange={setResume}
            targetRole={targetRole}
            notify={notify}
          />
        )}
        {activeTab === "jobs" && <JobsTab />}
        {activeTab === "prep" && <PrepTab />}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
