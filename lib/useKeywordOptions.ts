// lib/useKeywordOptions.ts
// Fetches tools + skills dropdown options from Supabase keyword_options table.
// Falls back to the bundled role_keywords.json if Supabase is unavailable.
"use client";

import { useEffect, useState } from "react";
import { getKeywordOptions as jsonTools, getSkillOptions as jsonSkills } from "./roleKeywords";

interface KeywordCache {
  tools: string[];
  skills: string[];
}

// Module-level cache so multiple components sharing the same role don't re-fetch
const cache: Record<string, KeywordCache> = {};

export function useKeywordOptions(targetRole: string): KeywordCache {
  const [data, setData] = useState<KeywordCache>(() => ({
    tools: jsonTools(targetRole),
    skills: jsonSkills(targetRole),
  }));

  useEffect(() => {
    if (!targetRole) return;

    // Return from cache immediately if already fetched
    if (cache[targetRole]) {
      setData(cache[targetRole]);
      return;
    }

    fetch(`/api/admin/keyword-options?role=${encodeURIComponent(targetRole)}`)
      .then((r) => r.json())
      .then((json: { tools?: string[]; skills?: string[]; error?: string }) => {
        if (json.error || (!json.tools?.length && !json.skills?.length)) {
          // Supabase table empty or not configured — stay on JSON fallback
          return;
        }
        const result: KeywordCache = {
          tools: json.tools?.length ? json.tools : jsonTools(targetRole),
          skills: json.skills?.length ? json.skills : jsonSkills(targetRole),
        };
        cache[targetRole] = result;
        setData(result);
      })
      .catch(() => {
        // Network error — silently stay on JSON fallback
      });
  }, [targetRole]);

  return data;
}
