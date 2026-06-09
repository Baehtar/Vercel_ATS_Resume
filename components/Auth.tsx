// components/Auth.tsx - Sign in / sign up / forgot + reset password / demo mode
"use client";

import { useEffect, useState } from "react";
import {
  isConfigured,
  signInStudent,
  signUpStudent,
  resetPasswordStudent,
  updatePasswordAfterRecovery,
  getSupabaseClient,
} from "@/lib/supabaseClient";
import type { AppUser } from "@/lib/types";

const BATCH_OPTIONS = [
  "Select your batch...",
  "Data Science Fellowship - Jan 2026",
  "Data Science Fellowship - Mar 2026",
  "Data Engineering Bootcamp - Jan 2026",
  "Data Engineering Bootcamp - Mar 2026",
  "Generative AI Specialist - Feb 2026",
];
const COURSE_OPTIONS = ["Select your course...", "Data Engineer", "Data Analyst"];

interface Props {
  onLogin: (user: AppUser) => void;
}

type Msg = { kind: "success" | "error" | "warning" | "info"; text: string } | null;

export default function Auth({ onLogin }: Props) {
  const ready = isConfigured();
  const [isRecovery, setIsRecovery] = useState(false);
  const [activeTab, setActiveTab] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [verifiedBanner, setVerifiedBanner] = useState(false);

  // Sign in
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Sign up
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regBatch, setRegBatch] = useState(BATCH_OPTIONS[0]);
  const [regCourse, setRegCourse] = useState(COURSE_OPTIONS[0]);
  const [regPass, setRegPass] = useState("");
  const [regPassConf, setRegPassConf] = useState("");

  // Reset
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Detect recovery / verified state from URL and Supabase auth events.
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (
      params.get("reset") === "1" ||
      params.get("type") === "recovery" ||
      hash.get("type") === "recovery"
    ) {
      setIsRecovery(true);
    }
    if (params.get("verified") === "1" || hash.get("type") === "signup") {
      setVerifiedBanner(true);
    }

    const client = getSupabaseClient();
    if (!client) return;
    const { data: sub } = client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const clearQuery = () => {
    window.history.replaceState({}, "", window.location.pathname);
  };

  const enterDemo = () => {
    onLogin({
      id: "demo-user",
      email: "student@demo.com",
      user_metadata: {
        name: "Demo Student",
        batch: "Data Science Fellowship - Jan 2026",
        course: "Data Engineer",
      },
    });
  };

  const doLogin = async () => {
    if (!loginEmail || !loginPass) {
      setMsg({ kind: "error", text: "Please enter both email and password." });
      return;
    }
    setBusy(true);
    const res = await signInStudent(loginEmail, loginPass);
    setBusy(false);
    if (res.error) {
      setMsg({ kind: "error", text: res.error });
    } else if (res.user) {
      onLogin(res.user as AppUser);
    }
  };

  const doForgot = async () => {
    if (!loginEmail) {
      setMsg({ kind: "warning", text: "Please enter your email to reset password." });
      return;
    }
    setBusy(true);
    const res = await resetPasswordStudent(loginEmail);
    setBusy(false);
    setMsg(
      res.error
        ? { kind: "error", text: res.error }
        : { kind: "success", text: "Password reset email sent. Check your inbox." }
    );
  };

  const doSignup = async () => {
    if (
      !regName ||
      !regEmail ||
      regBatch === BATCH_OPTIONS[0] ||
      regCourse === COURSE_OPTIONS[0] ||
      !regPass ||
      !regPassConf
    ) {
      setMsg({ kind: "error", text: "Please fill in all fields and select a batch and course." });
      return;
    }
    if (regPass !== regPassConf) {
      setMsg({ kind: "error", text: "Passwords do not match." });
      return;
    }
    if (regPass.length < 6) {
      setMsg({ kind: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setBusy(true);
    const res = await signUpStudent(regEmail, regPass, regName, regBatch, regCourse);
    setBusy(false);
    if (res.error) {
      setMsg({ kind: "error", text: res.error });
    } else if (res.confirmation_required) {
      setMsg({
        kind: "success",
        text: "Account created. Please check your inbox and confirm your email before signing in.",
      });
      setActiveTab("in");
    } else {
      setMsg({
        kind: "success",
        text: "Account created. Please sign in using the Sign In tab.",
      });
      setActiveTab("in");
    }
  };

  const doReset = async () => {
    if (!newPassword || !confirmPassword) {
      setMsg({ kind: "error", text: "Please enter and confirm your new password." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ kind: "error", text: "Passwords do not match." });
      return;
    }
    setBusy(true);
    const res = await updatePasswordAfterRecovery(newPassword);
    setBusy(false);
    if (res.error) {
      setMsg({ kind: "error", text: res.error });
    } else {
      clearQuery();
      setIsRecovery(false);
      setMsg({
        kind: "success",
        text: "Password updated successfully. Please sign in with your new password.",
      });
    }
  };

  return (
    <div className="auth-wrap">
      <h2 className="center" style={{ color: "#3b82f6", marginTop: 30 }}>
        🚀 Console Flare Portal
      </h2>
      <p className="center muted">Sign in to access your ATS Resume Builder & Career Tools</p>

      {msg && <div className={`alert alert-${msg.kind}`}>{msg.text}</div>}

      {isRecovery ? (
        <div className="panel">
          <h4>Set New Password</h4>
          <p className="caption">Enter a new password for your Console Flare account.</p>
          <label className="field-label">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <label className="field-label">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div style={{ marginTop: 12 }}>
            <button className="primary full" onClick={doReset} disabled={busy}>
              {busy && <span className="spinner" />}Update Password
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            <button
              className="full ghost"
              onClick={() => {
                clearQuery();
                setIsRecovery(false);
                setMsg(null);
              }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      ) : !ready ? (
        <div className="panel">
          <div className="alert alert-warning">⚠️ Supabase Connection Pending</div>
          <p className="caption">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment (see{" "}
            <code>.env.local.example</code>) to activate authentication.
          </p>
          <button className="primary full" onClick={enterDemo}>
            🔓 Enter Demo Mode (Skip Auth)
          </button>
        </div>
      ) : (
        <div className="panel">
          {verifiedBanner && (
            <div className="alert alert-success">
              Your email is verified. Please sign in to continue.
            </div>
          )}
          <div className="tabs">
            <button
              className={`tab ${activeTab === "in" ? "active" : ""}`}
              onClick={() => setActiveTab("in")}
            >
              🔒 Sign In
            </button>
            <button
              className={`tab ${activeTab === "up" ? "active" : ""}`}
              onClick={() => setActiveTab("up")}
            >
              📝 Sign Up
            </button>
          </div>

          {activeTab === "in" ? (
            <div>
              <h4>Student Login</h4>
              <label className="field-label">Email Address</label>
              <input
                type="email"
                placeholder="student@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <label className="field-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
              />
              <div style={{ marginTop: 12 }}>
                <button className="full" onClick={doForgot} disabled={busy}>
                  Forgot Password
                </button>
              </div>
              <div style={{ marginTop: 8 }}>
                <button className="primary full" onClick={doLogin} disabled={busy}>
                  {busy && <span className="spinner" />}Log In
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h4>Register Student Account</h4>
              <label className="field-label">Full Name</label>
              <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} />
              <label className="field-label">Email Address</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
              <label className="field-label">Batch Name/Number</label>
              <select value={regBatch} onChange={(e) => setRegBatch(e.target.value)}>
                {BATCH_OPTIONS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
              <label className="field-label">Course Name</label>
              <select value={regCourse} onChange={(e) => setRegCourse(e.target.value)}>
                {COURSE_OPTIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <label className="field-label">Password (min 6 characters)</label>
              <input
                type="password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
              />
              <label className="field-label">Confirm Password</label>
              <input
                type="password"
                value={regPassConf}
                onChange={(e) => setRegPassConf(e.target.value)}
              />
              <div style={{ marginTop: 12 }}>
                <button className="primary full" onClick={doSignup} disabled={busy}>
                  {busy && <span className="spinner" />}Create Account
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
