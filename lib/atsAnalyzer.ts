// lib/atsAnalyzer.ts - Role-based keyword scoring and resume compliance engine
// Ported from ats_analyzer.py
import { loadRoleKeywords } from "./roleKeywords";
import type { AtsReport, Resume } from "./types";

export { loadRoleKeywords };

/** Tokenize text into lowercase words, preserving tech terms. */
export function tokenize(text: string): string[] {
  if (!text) return [];
  const matches = text.toLowerCase().match(/[\w\-#+./]+/g) || [];
  return matches.filter((t) => t.length > 1);
}

/** Compile all resume content into a single text block for matching. */
export function getResumeFullText(resume: Resume): string {
  const personal = resume.personal || ({} as Resume["personal"]);
  const parts: string[] = [
    personal.fullName || "",
    personal.email || "",
    resume.summary || "",
  ];

  for (const exp of resume.experience || []) {
    parts.push(exp.company || "", exp.role || "", exp.location || "");
    parts.push(...(exp.bullets || []));
  }
  for (const edu of resume.education || []) {
    parts.push(edu.school || "", edu.degree || "", edu.details || "");
  }
  for (const proj of resume.projects || []) {
    parts.push(proj.name || "", proj.tech || "", proj.description || "");
  }
  for (const s of resume.skills || []) {
    parts.push(s.category || "", s.list || "");
  }
  for (const cert of resume.certifications || []) {
    parts.push(cert.name || "", cert.issuer || "");
  }
  return parts.filter(Boolean).join(" ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Analyze resume against the selected role's keyword requirements.
 * Returns a detailed report with score breakdown, matched/missing keywords, and warnings.
 */
export function analyzeResume(resume: Resume, selectedRole: string): AtsReport {
  const roleKeywords = loadRoleKeywords();
  const roleConfig = roleKeywords[selectedRole] || ({} as (typeof roleKeywords)[string]);

  const mustHave = roleConfig.must_have || [];
  const goodToHave = roleConfig.good_to_have || [];
  const actionVerbs = roleConfig.action_verbs || [];

  const analysis: AtsReport = {
    score: 0,
    breakdown: {
      must_have_keywords: 0,
      good_to_have_keywords: 0,
      sections: 0,
      formatting: 0,
    },
    must_have_matched: [],
    must_have_missing: [],
    good_to_have_matched: [],
    good_to_have_missing: [],
    formatting_warnings: [],
    verb_suggestions: [],
    word_count: 0,
  };

  const resumeText = getResumeFullText(resume);
  const resumeTextLower = resumeText.toLowerCase();
  const resumeTokens = tokenize(resumeText);
  analysis.word_count = resumeTokens.length;

  const matches = (kw: string): boolean => {
    const pattern = new RegExp(`\\b${escapeRegExp(kw.toLowerCase())}\\b`);
    return pattern.test(resumeTextLower) || resumeTextLower.includes(kw.toLowerCase());
  };

  // 1. Must-Have Keywords (40 points max)
  for (const kw of mustHave) {
    if (matches(kw)) analysis.must_have_matched.push(kw);
    else analysis.must_have_missing.push(kw);
  }
  if (mustHave.length) {
    const ratio = analysis.must_have_matched.length / mustHave.length;
    analysis.breakdown.must_have_keywords = Math.round(ratio * 40);
  }

  // 2. Good-to-Have Keywords (15 points max)
  for (const kw of goodToHave) {
    if (matches(kw)) analysis.good_to_have_matched.push(kw);
    else analysis.good_to_have_missing.push(kw);
  }
  if (goodToHave.length) {
    const ratio = analysis.good_to_have_matched.length / goodToHave.length;
    analysis.breakdown.good_to_have_keywords = Math.round(ratio * 15);
  }

  // 3. Section Completeness (25 points max)
  const personal = resume.personal || ({} as Resume["personal"]);
  let sectionPoints = 0;

  if (personal.fullName && (personal.email || personal.phone)) {
    sectionPoints += 5;
  } else {
    analysis.formatting_warnings.push({
      type: "error",
      message: "Missing contact details (Name + Email or Phone required).",
    });
  }

  const summary = resume.summary || "";
  if (summary && summary.trim().length > 30) {
    sectionPoints += 5;
  } else {
    analysis.formatting_warnings.push({
      type: "warning",
      message: "Professional summary is missing or too short. Write a 2-3 sentence pitch.",
    });
  }

  if ((resume.experience || []).length) {
    sectionPoints += 5;
  } else {
    analysis.formatting_warnings.push({
      type: "error",
      message: "Work/Internship Experience section is empty.",
    });
  }

  if ((resume.education || []).length) {
    sectionPoints += 5;
  } else {
    analysis.formatting_warnings.push({
      type: "warning",
      message: "Education section is empty.",
    });
  }

  const activeSkills = (resume.skills || []).filter((s) => (s.list || "").trim());
  if (activeSkills.length) {
    sectionPoints += 5;
  } else {
    analysis.formatting_warnings.push({
      type: "error",
      message: "Skills section is empty. ATS systems heavily index technical skills.",
    });
  }

  analysis.breakdown.sections = sectionPoints;

  // 4. Formatting Checks (20 points max)
  let fmtPoints = 20;

  if (analysis.word_count > 0 && analysis.word_count < 150) {
    fmtPoints -= 5;
    analysis.formatting_warnings.push({
      type: "warning",
      message: `Resume is too brief (${analysis.word_count} words). Add more detail to experience and projects.`,
    });
  } else if (analysis.word_count > 1000) {
    fmtPoints -= 5;
    analysis.formatting_warnings.push({
      type: "warning",
      message: `Resume is very long (${analysis.word_count} words). Condense to 1-2 pages.`,
    });
  }

  // Action verb usage in bullets
  let bulletCount = 0;
  let verbMatches = 0;
  const actionVerbsLower = actionVerbs.map((v) => v.toLowerCase());

  for (const exp of resume.experience || []) {
    for (const bullet of exp.bullets || []) {
      if (bullet.trim()) {
        bulletCount += 1;
        const words = tokenize(bullet);
        if (words.some((w) => actionVerbsLower.includes(w))) {
          verbMatches += 1;
        }
      }
    }
  }

  if (bulletCount > 0) {
    const verbRatio = verbMatches / bulletCount;
    if (verbRatio < 0.5) {
      fmtPoints -= 5;
      analysis.formatting_warnings.push({
        type: "warning",
        message: `Only ${Math.round(verbRatio * 100)}% of experience bullets use strong action verbs. Start bullets with verbs like: ${actionVerbs
          .slice(0, 5)
          .join(", ")}.`,
      });
    }
  }

  // Emoji check
  const emojiPattern = /[\u{10000}-\u{10ffff}\u2600-\u27bf]/u;
  if (emojiPattern.test(resumeText)) {
    fmtPoints -= 5;
    analysis.formatting_warnings.push({
      type: "warning",
      message: "Avoid emojis or special icons. They can break ATS parsing.",
    });
  }

  analysis.breakdown.formatting = Math.max(0, fmtPoints);

  // Total score
  analysis.score =
    analysis.breakdown.must_have_keywords +
    analysis.breakdown.good_to_have_keywords +
    analysis.breakdown.sections +
    analysis.breakdown.formatting;

  // Suggest unused action verbs
  const resumeTokensSet = new Set(resumeTokens);
  for (const verb of actionVerbs) {
    if (!resumeTokensSet.has(verb.toLowerCase()) && analysis.verb_suggestions.length < 6) {
      analysis.verb_suggestions.push(verb);
    }
  }

  return analysis;
}
