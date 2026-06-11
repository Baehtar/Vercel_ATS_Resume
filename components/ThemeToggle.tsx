// components/ThemeToggle.tsx - Sliding light/dark mode toggle
"use client";

import { useTheme } from "@/lib/useTheme";

export default function ThemeToggle() {
  const [theme, toggleTheme] = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        /* reset button defaults */
        border: "none",
        padding: 0,
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
      }}
    >
      {/* Sun icon */}
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={isDark ? "var(--text-muted)" : "var(--amber)"}
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: "stroke 0.2s" }}
      >
        <circle cx="12" cy="12" r="4"/>
        <line x1="12" y1="2"  x2="12" y2="5"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="4.22" y1="4.22"  x2="6.34" y2="6.34"/>
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
        <line x1="2"  y1="12" x2="5"  y2="12"/>
        <line x1="19" y1="12" x2="22" y2="12"/>
        <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
        <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"/>
      </svg>

      {/* Track */}
      <span style={{
        position: "relative",
        display: "inline-flex",
        width: 40,
        height: 22,
        borderRadius: 999,
        background: isDark ? "var(--blue-600)" : "var(--gray-300)",
        transition: "background 0.25s",
        flexShrink: 0,
      }}>
        {/* Thumb */}
        <span style={{
          position: "absolute",
          top: 3,
          left: isDark ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "var(--white)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          transition: "left 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        }} />
      </span>

      {/* Moon icon */}
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke={isDark ? "var(--blue-600)" : "var(--text-muted)"}
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: "stroke 0.2s" }}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
  );
}
