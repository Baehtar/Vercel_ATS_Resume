// lib/roleKeywords.ts - Loads the role keyword config (ported from role_keywords.json)
import roleKeywordsJson from "../role_keywords.json";
import type { RoleKeywords } from "./types";

export const ROLE_KEYWORDS = roleKeywordsJson as unknown as RoleKeywords;

/** Mirror of ats_analyzer.load_role_keywords() */
export function loadRoleKeywords(): RoleKeywords {
  return ROLE_KEYWORDS;
}

export function getKeywordOptions(targetRole: string): string[] {
  const role = ROLE_KEYWORDS[targetRole] || ({} as RoleKeywords[string]);
  const keywords = [...(role.must_have || []), ...(role.good_to_have || [])];
  return Array.from(new Set(keywords)).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
}

export function getSkillOptions(targetRole: string): string[] {
  const role = ROLE_KEYWORDS[targetRole] || ({} as RoleKeywords[string]);
  return Array.from(new Set(role.skills || [])).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
}
