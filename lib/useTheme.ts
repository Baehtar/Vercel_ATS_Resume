// lib/useTheme.ts - Persisted light/dark theme toggle
"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "cf-theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>("dark");

  // On mount, read persisted preference
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial: Theme = saved === "light" ? "light" : "dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  };

  return [theme, toggle];
}
