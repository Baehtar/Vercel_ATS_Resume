// lib/useTheme.ts - Persisted light/dark theme toggle with spill transition
"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "cf-theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Toggle theme with a circular "spill" reveal originating from (x, y).
 * Uses the View Transitions API when available; falls back to instant swap.
 */
function applyThemeWithSpill(next: Theme, originX: number, originY: number) {
  // Fallback for browsers without View Transitions
  if (!document.startViewTransition) {
    applyTheme(next);
    return;
  }

  // Max radius needed to cover the entire viewport from the origin point
  const maxRadius = Math.hypot(
    Math.max(originX, window.innerWidth - originX),
    Math.max(originY, window.innerHeight - originY)
  );

  const transition = document.startViewTransition(() => {
    applyTheme(next);
  });

  transition.ready.then(() => {
    const isDark = next === "dark";

    // Expanding from a point: start collapsed at origin, expand to full screen.
    // When going dark, new layer expands. When going light, same — new layer is light.
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${originX}px ${originY}px)`,
          `circle(${maxRadius}px at ${originX}px ${originY}px)`,
        ],
      },
      {
        duration: 520,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        pseudoElement: "::view-transition-new(root)",
      }
    );

    // Old layer fades out slightly while new one expands
    document.documentElement.animate(
      { opacity: [1, isDark ? 0.6 : 0.8] },
      {
        duration: 520,
        easing: "ease-in",
        pseudoElement: "::view-transition-old(root)",
      }
    );
  });
}

export function useTheme(): [Theme, (originX: number, originY: number) => void] {
  const [theme, setTheme] = useState<Theme>("dark");

  // On mount, read persisted preference (no animation on load)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial: Theme = saved === "light" ? "light" : "dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = (originX: number, originY: number) => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      applyThemeWithSpill(next, originX, originY);
      return next;
    });
  };

  return [theme, toggle];
}
