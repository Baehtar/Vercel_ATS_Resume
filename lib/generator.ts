// lib/generator.ts - Server-side AI generation with safe fallbacks (ported from resume_generator.py)
// This module is imported only by API routes and runs on the server. The OpenAI
// key is read from server-only env vars and never exposed to the browser.
import OpenAI from "openai";
import { getConfiguredPrompt } from "./promptConfig";
import { DEFAULT_PROMPT_TEMPLATES, renderPromptTemplate } from "./promptTemplates";

function getOpenAIKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

function getOpenAIBase(): string | undefined {
  return process.env.OPENAI_API_BASE || undefined;
}

function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || "gpt-3.5-turbo";
}

// ─── Role profiles ────────────────────────────────────────────────────────────
// Every prompt and fallback is parameterised by the candidate's target role so
// Data Engineers and Data Analysts each get tailored, believable output.

interface RoleProfile {
  /** Display label, e.g. "Data Engineer" */
  label: string;
  /** Discipline noun, e.g. "Data Engineering" / "Data Analysis" */
  discipline: string;
  /** Adjective form used in prompts, e.g. "Data Engineering" / "Data Analyst" */
  adjective: string;
  /** "Focus heavily on …" technology/skill list injected into the bullets prompt */
  focusTech: string;
  /** Default tool used by the offline fallback generator */
  fallbackTool: string;
  /** Action verbs preferred by the offline fallback generator */
  fallbackVerbs: string[];
  /** Generic fallback bullets (templated with the primary tool + domain) */
  genericBullets: (tool: string, domain: string) => string[];
  /** Short phrase for the story prompt's "shaped my approach to … work" line */
  storyDiscipline: string;
  /** Illustrative offline fallback story */
  fallbackStory: {
    title: string;
    body: (name: string, role: string) => string;
    talkingPoints: string[];
    followUp: string;
  };
}

const ROLE_PROFILES: Record<string, RoleProfile> = {
  data_engineer: {
    label: "Data Engineer",
    discipline: "Data Engineering",
    adjective: "Data Engineering",
    focusTech:
      "Databricks, PySpark, Spark SQL, Delta Lake, Azure Data Factory, ADLS Gen2, Medallion Architecture, ETL/ELT, Incremental Loading, CDC, Data Quality, Orchestration, Data Modeling, Star Schema, SCD, Partitioning, Performance Optimization, Monitoring, SQL, Cloud Data Platforms, CI/CD, and Data Governance",
    fallbackTool: "PySpark",
    fallbackVerbs: [
      "Engineered", "Designed", "Implemented", "Optimized", "Automated",
      "Orchestrated", "Built", "Developed", "Streamlined", "Deployed",
    ],
    genericBullets: (tool, domain) => [
      `Designed and maintained data pipelines using ${tool} to support ${domain || "business"} analytics.`,
      `Automated ETL workflows with ${tool}, reducing manual processing time significantly.`,
      `Validated data quality and implemented monitoring checks for ${domain || "production"} data flows.`,
      `Collaborated with stakeholders to translate ${domain || "business"} requirements into data solutions.`,
      `Optimized ${tool} jobs and data models to improve reliability and performance.`,
    ],
    storyDiscipline: "data engineering",
    fallbackStory: {
      title: "The Pipeline That Taught Me Reliability",
      body: (name, role) =>
        `${name} started in ${role} work and quickly found myself responsible for a core data pipeline ` +
        `that the business relied on daily. Early on, the pipeline kept failing silently — data was landing ` +
        `in the warehouse but counts were off. I dug into the logs, traced it back to a schema drift issue ` +
        `upstream, and built a validation layer that caught mismatches before they propagated downstream. ` +
        `After that, I automated the alerting so the team got notified within minutes of any anomaly. ` +
        `It taught me that reliability is not an afterthought — it has to be built into the pipeline from ` +
        `day one. That experience shaped how I approach every data project now: I always ask "what breaks ` +
        `silently?" before I ask "what features can we add?"`,
      talkingPoints: [
        "Silent failure in a production pipeline",
        "Root-cause analysis and schema drift fix",
        "Built automated validation and alerting",
      ],
      followUp:
        "If asked for metrics, say you reduced data quality incidents by roughly 80% — frame it as an estimate if you don't have the exact number.",
    },
  },
  data_analyst: {
    label: "Data Analyst",
    discipline: "Data Analysis",
    adjective: "Data Analyst",
    focusTech:
      "SQL, Python (Pandas, NumPy), Excel, Power BI, Tableau, Looker, Data Visualization, Dashboards, KPI Reporting, A/B Testing, Statistical Analysis, Hypothesis Testing, Regression, Cohort & Funnel Analysis, Segmentation, EDA, Forecasting, Data Cleaning, Stakeholder Communication, and Data Storytelling",
    fallbackTool: "SQL",
    fallbackVerbs: [
      "Analyzed", "Identified", "Visualized", "Reported", "Quantified",
      "Evaluated", "Presented", "Recommended", "Forecasted", "Segmented",
    ],
    genericBullets: (tool, domain) => [
      `Built interactive dashboards in ${tool} to track key ${domain || "business"} KPIs for stakeholders.`,
      `Analyzed ${domain || "business"} datasets with ${tool} to surface trends and actionable insights.`,
      `Automated recurring reports, cutting manual reporting effort and improving turnaround.`,
      `Partnered with ${domain || "business"} stakeholders to define metrics and answer key questions with data.`,
      `Cleaned, validated, and modeled data to ensure accurate, decision-ready reporting.`,
    ],
    storyDiscipline: "data analysis",
    fallbackStory: {
      title: "The Metric That Was Lying",
      body: (name, role) =>
        `${name} stepped into ${role} work and was asked why a key conversion metric had suddenly dropped. ` +
        `Everyone assumed the product was broken. Instead of taking the dashboard at face value, I segmented ` +
        `the data by device, traffic source, and user cohort, and traced the drop to a single broken tracking ` +
        `event on mobile — the product was fine, the measurement wasn't. I worked with engineering to fix the ` +
        `event, then rebuilt the dashboard with a data-quality check so a silent tracking break would surface ` +
        `immediately. The "decline" disappeared and leadership avoided a costly overreaction. ` +
        `It taught me that an analyst's first job is to question the numbers before explaining them. ` +
        `Now I always validate the data pipeline behind a metric before I tell a story with it.`,
      talkingPoints: [
        "Questioned a suspicious metric instead of trusting it",
        "Segmented data to isolate a broken tracking event",
        "Added a data-quality check to catch future breaks",
      ],
      followUp:
        "If asked how you found the root cause, walk through your segmentation logic step by step — interviewers love seeing structured thinking.",
    },
  },
};

function getRoleProfile(targetRole?: string): RoleProfile {
  return ROLE_PROFILES[targetRole || "data_engineer"] || ROLE_PROFILES.data_engineer;
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

export function buildBasePrompt(targetRole?: string): string {
  const p = getRoleProfile(targetRole);
  return `You are an expert ${p.discipline} Resume Writer with experience hiring ${p.label}s at product companies, consulting firms, and Fortune 500 organizations.

Your task is to transform my actual work experience into highly professional, ATS-friendly, interview-ready ${p.label} experience bullet points.

### Instructions
1. Generate ONLY the Experience Section.
2. Do not create a resume summary, skills section, certifications, or projects.
3. Convert my existing responsibilities into ${p.adjective}-focused responsibilities wherever logically possible.
4. Maintain realism. Do not invent impossible achievements.
5. Make the experience sound genuine and believable to an experienced interviewer.
6. Use strong action verbs and professional corporate language.
7. Write each bullet point as if it was performed in a real production / business environment.
8. Include measurable business impact whenever reasonable.
9. Create a coherent business story behind the work instead of listing random technologies.
10. If a client name is provided, naturally incorporate it into the experience.
11. If a domain is provided, create domain-specific ${p.storyDiscipline} use cases.

Focus heavily on ${p.focusTech}.

Write between 2 and 5 bullet points (vary the count based on how much real detail is provided — do not always return the same number). Every bullet should sound like real ${p.storyDiscipline} work. Avoid generic phrases. If my experience has no direct ${p.discipline} exposure, intelligently reinterpret transferable responsibilities from a ${p.discipline} perspective while staying believable.`;
}

export function buildSummaryPrompt(targetRole?: string): string {
  const p = getRoleProfile(targetRole);
  return `You are an expert ${p.discipline} Resume Writer with experience hiring ${p.label}s at product companies, consulting firms, and Fortune 500 organizations.

Task:
Read the full resume text provided and write one polished professional summary as a single paragraph.
Use standard resume voice with an implied first person. Do not use the candidate's name or pronouns such as I, my, they, their, he, she, or "the candidate."

Constraint rules:
1. Open with the target professional identity, domain, and experience level when supported by the resume.
2. Establish the candidate's specialization and business domain, then include technical scale such as data volume, users, systems, or workload when available.
3. Highlight the strongest end-to-end responsibilities, core platforms and tools, and relevant architecture, modeling, orchestration, or loading techniques.
4. Connect the strongest quantified achievement to a production, operational, or business outcome.
5. Include relevant certifications and close with the most important technical or business differentiator.
6. Write 70-110 words in 3-5 well-connected sentences as one paragraph.
7. Ground every statement only in the resume content. Do not add assumptions, tools, metrics, domains, or filler.
8. Deduplicate repeated source content and mention each fact only once.
9. Prioritize specific titles, tools, numbers, certifications, projects, and domains over vague adjectives.

Output only the summary paragraph. No bullets, header, labels, first-person pronouns, third-person language, or extra commentary.`;
}

// Backward-compatible default constants (Data Engineer flavour).
export const BASE_PROMPT = buildBasePrompt("data_engineer");
export const SUMMARY_PROMPT = buildSummaryPrompt("data_engineer");

async function callOpenAI(
  promptText: string,
  systemPrompt?: string,
  options: { json?: boolean; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new Error("API key not found. Set OPENAI_API_KEY in your environment.");
  }
  const client = new OpenAI({
    apiKey,
    baseURL: getOpenAIBase() || "https://api.openai.com/v1",
  });

  const request = {
    model: getOpenAIModel(),
    messages: [
      { role: "system" as const, content: systemPrompt || BASE_PROMPT },
      { role: "user" as const, content: promptText },
    ],
    max_tokens: options.maxTokens || 1500,
    temperature: 0.4,
    ...(options.json ? { response_format: { type: "json_object" as const } } : {}),
  };

  let resp;
  try {
    resp = await client.chat.completions.create(request);
  } catch (error) {
    // Keep compatibility with OpenAI-compatible providers that do not implement JSON mode.
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const jsonModeUnsupported = message.includes("response_format") ||
      message.includes("json_object") || message.includes("unsupported");
    if (!options.json || !jsonModeUnsupported) throw error;
    const { response_format: _responseFormat, ...withoutJsonMode } = request;
    resp = await client.chat.completions.create(withoutJsonMode);
  }

  const choice = resp.choices[0];
  if (choice?.finish_reason === "length") {
    throw new Error("OpenAI response was truncated. Increase the completion token limit or shorten the prompt output.");
  }
  const content = choice?.message?.content || "";
  if (!content.trim()) throw new Error("OpenAI returned an empty response");
  return content;
}

function parseOpenAIJson(raw: string): Record<string, unknown> {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // JSON mode normally makes this unnecessary, but this also handles older saved prompts
    // that still cause a short preamble or code fence to be returned.
    const start = cleaned.indexOf("{");
    if (start === -1) throw new Error("OpenAI response did not return valid JSON");

    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < cleaned.length; i += 1) {
      const char = cleaned[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(cleaned.slice(start, i + 1)) as Record<string, unknown>;
          } catch {
            break;
          }
        }
      }
    }
    throw new Error("OpenAI response did not return complete JSON");
  }
}

interface FallbackInfo {
  daily_activities?: string;
  tools?: string;
  client?: string;
  domain?: string;
  years?: string;
  target_role?: string;
}

function fallbackGeneration(info: FallbackInfo): {
  summary: string;
  bullets: string[];
  project_story: string;
} {
  const profile = getRoleProfile(info.target_role);
  const verbs = profile.fallbackVerbs;
  const domain = info.domain || "";
  const tools = info.tools || "";
  const daily = info.daily_activities || "";
  const client = info.client || "";

  const primaryTool = tools ? tools.split(",")[0].trim() : profile.fallbackTool;
  const clientCtx = client.trim() ? ` for ${client.trim()}` : "";

  const bullets: string[] = [];
  const fragments = daily
    .split(/[.\n]+/)
    .map((f) => f.trim().replace(/^[.\s]+|[.\s]+$/g, ""))
    .filter(Boolean);

  // Target a variable number of bullets (2–5) based on how much detail was given.
  const target = Math.min(5, Math.max(2, fragments.length || 2));

  fragments.slice(0, target).forEach((frag, i) => {
    const verb = verbs[i % verbs.length];
    const cleanFrag = frag ? frag[0].toLowerCase() + frag.slice(1) : frag;
    bullets.push(`${verb} ${cleanFrag} using ${primaryTool}${clientCtx}.`);
  });

  const generic = profile.genericBullets(primaryTool, domain);
  let gi = 0;
  while (bullets.length < target && gi < generic.length) {
    bullets.push(generic[gi]);
    gi += 1;
  }

  const summary = `${profile.label} with ${info.years || "several"} years of experience in ${domain || "data"} projects. Skilled in ${tools || primaryTool}.`;
  const projectStory = `Delivered end-to-end ${profile.storyDiscipline} work${clientCtx} in the ${domain || "data"} domain: ${summary}`;
  return { summary, bullets, project_story: projectStory };
}

interface PersonalLike {
  fullName?: string;
  headline?: string;
}

function fallbackSummary(input: SummaryInput): { summary: string } {
  const personal = input.personal || {};
  const title =
    (personal.headline || "").trim() ||
    input.target_role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const expCount = input.experience.length;
  const roleLabel = input.target_role.replace(/_/g, " ");
  const projectNames = input.projects.map((p) => p.name).filter(Boolean).slice(0, 2).join(", ");
  const skills = input.skills.map((s) => s.list).filter(Boolean).join(", ");
  const primarySkill = skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4).join(", ");
  const certification = (input.certifications || []).find((c) => c.name || c.issuer);
  const education = input.education.find((e) => e.degree || e.school);
  const impact = input.experience
    .flatMap((entry) => entry.bullets || [])
    .map((bullet) =>
      bullet
        .trim()
        .replace(/^(?:[-*\u2022]\s+|\d+[.)]\s+)/, "")
        .replace(/[.!?]+$/, "")
    )
    .find(Boolean);
  const experienceLevel = expCount
    ? `experience across ${expCount} relevant role${expCount === 1 ? "" : "s"} or internship${expCount === 1 ? "" : "s"}`
    : "an entry-level background";
  const achievement = projectNames
    ? `Experienced in delivering practical projects including ${projectNames}, with work aligned to ${roleLabel} responsibilities.`
    : expCount
      ? `Experienced in applying role-relevant capabilities across professional and project environments.`
      : education
        ? `Backed by ${[education.degree, education.school].filter(Boolean).join(" from ")}, with a foundation relevant to ${roleLabel} opportunities.`
        : `Focused on building practical capability for ${roleLabel} opportunities.`;
  const credential = certification
    ? `${[certification.name, certification.issuer ? `from ${certification.issuer}` : ""].filter(Boolean).join(" ")}.`
    : education
      ? `Academic background includes ${[education.degree, education.school ? `from ${education.school}` : ""].filter(Boolean).join(" ")}.`
      : "";
  const impactSentence = impact ? `${impact}.` : "";
  const differentiator = primarySkill
    ? `Skilled in ${primarySkill}, with a focused toolkit for ${roleLabel} work.`
    : `Equipped with a focused combination of education, practical exposure, and role-relevant capabilities.`;
  const summary = `${title} with ${experienceLevel} aligned with ${roleLabel} work. ${achievement} ${impactSentence} ${credential} ${differentiator}`
    .replace(/\s+/g, " ")
    .trim();
  return { summary };
}

export interface EntryInfo {
  company?: string;
  role?: string;
  domain?: string;
  client?: string;
  details?: string;
  tools?: string;
  years?: string;
  target_role?: string;
}

export async function generateEntryBullets(entry: EntryInfo) {
  const promptText =
    `Company:\n${entry.company || ""}\n` +
    `Designation:\n${entry.role || ""}\n` +
    `Industry/Domain:\n${entry.domain || ""}\n` +
    `Client (if any):\n${entry.client || ""}\n` +
    `Actual Responsibilities:\n${entry.details || ""}\n` +
    `Tools Used:\n${entry.tools || ""}\n` +
    `Years of Experience:\n${entry.years || ""}\n` +
    `Target Role:\n${entry.target_role || "data_engineer"}\n\n` +
    "Please generate between 2 and 5 ATS-friendly experience bullet points for this role. " +
    "Vary the number of bullets based on the depth of the information provided — do not always return the same count. " +
    "Return valid JSON only with a key named bullets containing an array of strings.";

  let apiError: string | null = null;
  try {
    const p = getRoleProfile(entry.target_role);
    const systemPrompt = await getConfiguredPrompt("experience", buildBasePrompt(entry.target_role), {
      discipline: p.discipline, label: p.label, adjective: p.adjective,
      storyDiscipline: p.storyDiscipline, focusTech: p.focusTech,
    });
    const raw = await callOpenAI(promptText, systemPrompt, { json: true });
    const data = parseOpenAIJson(raw);
    let bullets = (data.bullets as string[]) || [];
    bullets = bullets.filter((b) => b && typeof b === "string").map((b) => b.trim());
    // Clamp to a maximum of 5 bullets so entries never get overly long.
    bullets = bullets.slice(0, 5);
    return { bullets, api_used: true, api_error: null };
  } catch (e) {
    apiError = e instanceof Error ? e.message : String(e);
  }

  const fb = fallbackGeneration({
    daily_activities: entry.details || "",
    tools: entry.tools || "",
    client: entry.client || entry.company || "",
    domain: entry.domain || "",
    years: entry.years || "",
    target_role: entry.target_role,
  });
  return { bullets: fb.bullets, api_used: false, api_error: apiError };
}

export interface SummaryInput {
  profile_statement?: string;
  personal: PersonalLike & {
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  experience: {
    role?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    bullets?: string[];
  }[];
  education: {
    degree?: string;
    school?: string;
    location?: string;
    date?: string;
    details?: string;
  }[];
  projects: {
    name?: string;
    tech?: string;
    link?: string;
    description?: string;
  }[];
  skills: { category?: string; list?: string }[];
  certifications?: { name?: string; issuer?: string; date?: string }[];
  target_role: string;
}

function joinNonEmpty(parts: Array<string | undefined>, separator = " | "): string {
  return parts.map((part) => (part || "").trim()).filter(Boolean).join(separator);
}

function cleanSummaryLine(line: string): string {
  return line
    .trim()
    .replace(/^[-*\u2022\d.)\s]+/, "")
    .trim();
}

function normalizeSummaryOutput(summary: string): string {
  const cleaned = summary.trim();
  if (!cleaned) return "";

  const lines = cleaned
    .split(/\r?\n+/)
    .map(cleanSummaryLine)
    .filter(Boolean);

  return lines.join(" ") || cleanSummaryLine(cleaned);
}

function parseSummaryResponse(raw: string): string {
  try {
    const data = parseOpenAIJson(raw);
    if (typeof data.summary === "string") {
      return normalizeSummaryOutput(data.summary);
    }
    if (Array.isArray(data.summary)) {
      return normalizeSummaryOutput(data.summary.filter((item) => typeof item === "string").join("\n"));
    }
    if (Array.isArray(data.bullets)) {
      return normalizeSummaryOutput(data.bullets.filter((item) => typeof item === "string").join("\n"));
    }
  } catch {
    // Admins can intentionally request plain summary text instead of JSON.
  }
  return normalizeSummaryOutput(raw);
}

export async function generateProfessionalSummary(input: SummaryInput) {
  const experienceSummary = input.experience
    .filter((e) => e.role || e.company || e.bullets?.some((bullet) => bullet.trim()))
    .map((e) => {
      const header = joinNonEmpty([
        e.role,
        e.company ? `at ${e.company}` : "",
        e.location,
        joinNonEmpty([e.startDate, e.endDate], " to "),
      ]);
      const bullets = (e.bullets || [])
        .map((bullet) => bullet.trim())
        .filter(Boolean)
        .map((bullet) => `  - ${bullet}`)
        .join("\n");
      return [header, bullets].filter(Boolean).join("\n");
    })
    .join("\n\n");
  const educationSummary = input.education
    .filter((e) => e.degree || e.school || e.details)
    .map((e) => joinNonEmpty([e.degree, e.school ? `from ${e.school}` : "", e.location, e.date, e.details]))
    .join("\n");
  const projectsSummary = input.projects
    .filter((p) => p.name || p.tech || p.description)
    .map((p) => joinNonEmpty([p.name, p.tech ? `Tech: ${p.tech}` : "", p.description, p.link ? `Link: ${p.link}` : ""]))
    .join("\n");
  const skillsSummary = input.skills
    .filter((s) => s.list)
    .map((s) => `${s.category || ""} | ${s.list || ""}`)
    .join("\n");
  const certificationSummary = (input.certifications || [])
    .filter((c) => c.name || c.issuer)
    .map((c) => joinNonEmpty([c.name, c.issuer ? `Issuer: ${c.issuer}` : "", c.date]))
    .join("\n");
  const personalSummary = joinNonEmpty([
    input.personal.fullName,
    input.personal.headline,
    input.personal.location,
    input.personal.linkedin,
    input.personal.github,
    input.personal.website,
  ]);

  const profile = getRoleProfile(input.target_role);
  const promptText =
    `Use the resume content below to generate the candidate screening summary for a ${profile.label} role. ` +
    `Follow the summary instructions from the system prompt exactly.\n\n` +
    `Personal:\n${personalSummary}\n` +
    `Experience:\n${experienceSummary}\n` +
    `Education:\n${educationSummary}\n` +
    `Projects:\n${projectsSummary}\n` +
    `Skills:\n${skillsSummary}\n` +
    `Certifications:\n${certificationSummary}\n` +
    `Target Role:\n${input.target_role}\n`;

  let apiError: string | null = null;
  try {
    const p = getRoleProfile(input.target_role);
    const systemPrompt = await getConfiguredPrompt("summary", buildSummaryPrompt(input.target_role), {
      discipline: p.discipline, label: p.label,
    });
    const raw = await callOpenAI(promptText, systemPrompt);
    return {
      summary: parseSummaryResponse(raw),
      api_used: true,
      api_error: null,
    };
  } catch (e) {
    apiError = e instanceof Error ? e.message : String(e);
  }

  const fb = fallbackSummary(input);
  return { summary: fb.summary, api_used: false, api_error: apiError };
}

// ─── Interview Story ──────────────────────────────────────────────────────────

export function buildStoryPrompt(targetRole?: string): string {
  const p = getRoleProfile(targetRole);
  return renderPromptTemplate(DEFAULT_PROMPT_TEMPLATES.story, {
    label: p.label,
    storyDiscipline: p.storyDiscipline,
  });
  /*
8. Keep it to 150-220 words — long enough to be substantial, short enough to say in under 90 seconds.
9. Avoid generic phrases like "I'm passionate about data" or "I love solving problems." Make it specific and concrete.
10. If multiple experience entries exist, choose the most compelling/relevant one to build the story around, but you may briefly reference others for context.

Return ONLY valid JSON with this structure:
{"story_title": "A short 4-6 word title for this story (e.g. 'The Pipeline That Almost Failed')","story": "The full first-person interview story (150-220 words)","key_talking_points": ["point 1", "point 2", "point 3"],"follow_up_tip": "One sentence tip on how to handle a likely follow-up question about this story"}`;
  */
}

// Backward-compatible default constant (Data Engineer flavour).
export const STORY_PROMPT = buildStoryPrompt("data_engineer");

export interface StoryInput {
  full_name: string;
  target_role: string;
  headline: string;
  summary: string;
  experience_text: string;
  projects_text: string;
  skills_text: string;
}

export interface StoryOutput {
  story_title: string;
  story: string;
  key_talking_points: string[];
  follow_up_tip: string;
  resume_understanding: string;
  main_interview_introduction: string;
  career_storytelling: string;
  project_or_experience_story: ProjectOrExperienceStory;
  difficult_areas_to_prepare: DifficultArea[];
  easy_to_remember_version: string;
  speaking_guidance: string[];
  api_used: boolean;
  api_error: string | null;
}

export interface ProjectOrExperienceStory {
  business_situation: string;
  candidate_responsibility: string;
  tools_and_approach: string;
  challenges_handled: string;
  final_outcome_or_learning: string;
}

export interface DifficultArea {
  area: string;
  interview_safe_explanation: string;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

function normalizeProjectStory(value: unknown): ProjectOrExperienceStory {
  const project = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    business_situation: asString(project.business_situation),
    candidate_responsibility: asString(project.candidate_responsibility),
    tools_and_approach: asString(project.tools_and_approach),
    challenges_handled: asString(project.challenges_handled),
    final_outcome_or_learning: asString(project.final_outcome_or_learning),
  };
}

function normalizeDifficultAreas(value: unknown): DifficultArea[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const area = item as Record<string, unknown>;
    const normalized = {
      area: asString(area.area),
      interview_safe_explanation: asString(area.interview_safe_explanation),
    };
    return normalized.area || normalized.interview_safe_explanation ? [normalized] : [];
  });
}

function normalizeStoryData(data: Record<string, unknown>): Omit<StoryOutput, "api_used" | "api_error"> | null {
  const mainIntroduction = asString(data.main_interview_introduction) || asString(data.story);
  if (!mainIntroduction) return null;

  const difficultAreas = normalizeDifficultAreas(data.difficult_areas_to_prepare);
  const talkingPoints = asStringArray(data.key_talking_points);
  const projectStory = normalizeProjectStory(data.project_or_experience_story);
  const derivedTalkingPoints = [
    asString(data.resume_understanding),
    asString(data.career_storytelling),
    projectStory.final_outcome_or_learning,
  ].filter(Boolean).slice(0, 3);

  return {
    story_title: asString(data.story_title) || "Tell Me About Yourself",
    story: mainIntroduction,
    key_talking_points: talkingPoints.length ? talkingPoints : derivedTalkingPoints,
    follow_up_tip: asString(data.follow_up_tip) || difficultAreas[0]?.interview_safe_explanation || "Be ready to explain the project decisions and outcomes in more detail.",
    resume_understanding: asString(data.resume_understanding),
    main_interview_introduction: mainIntroduction,
    career_storytelling: asString(data.career_storytelling),
    project_or_experience_story: projectStory,
    difficult_areas_to_prepare: difficultAreas,
    easy_to_remember_version: asString(data.easy_to_remember_version),
    speaking_guidance: asStringArray(data.speaking_guidance),
  };
}

function fallbackStory(input: StoryInput): StoryOutput {
  const profile = getRoleProfile(input.target_role);
  const role = profile.label;
  const name = input.full_name || "I";
  const fb = profile.fallbackStory;

  return {
    story_title: fb.title,
    story: fb.body(name, role),
    key_talking_points: fb.talkingPoints,
    follow_up_tip: fb.followUp,
    resume_understanding: "",
    main_interview_introduction: fb.body(name, role),
    career_storytelling: "",
    project_or_experience_story: {
      business_situation: "",
      candidate_responsibility: "",
      tools_and_approach: "",
      challenges_handled: "",
      final_outcome_or_learning: "",
    },
    difficult_areas_to_prepare: [],
    easy_to_remember_version: fb.body(name, role),
    speaking_guidance: [],
    api_used: false,
    api_error: "OpenAI unavailable — showing illustrative story. Generate again once API key is set.",
  };
}

export async function generateInterviewStory(input: StoryInput): Promise<StoryOutput> {
  const promptText =
    `### Candidate Resume Data\n` +
    `Name: ${input.full_name}\n` +
    `Target Role: ${input.target_role}\n` +
    `Headline: ${input.headline}\n` +
    `Recruiter Summary:\n${input.summary}\n\n` +
    `Experience:\n${input.experience_text}\n\n` +
    `Projects:\n${input.projects_text}\n\n` +
    `Skills:\n${input.skills_text}\n`;

  let apiError: string | null = null;
  try {
    const p = getRoleProfile(input.target_role);
    const systemPrompt = await getConfiguredPrompt("story", buildStoryPrompt(input.target_role), {
      label: p.label, storyDiscipline: p.storyDiscipline,
    });
    const raw = await callOpenAI(promptText, systemPrompt, { json: true, maxTokens: 3000 });
    const data = parseOpenAIJson(raw);
    const normalized = normalizeStoryData(data);
    if (normalized) {
      return {
        ...normalized,
        api_used: true,
        api_error: null,
      };
    }
    throw new Error("Incomplete JSON from OpenAI");
  } catch (e) {
    apiError = e instanceof Error ? e.message : String(e);
  }

  const fb = fallbackStory(input);
  return { ...fb, api_error: apiError };
}

export interface ExperienceInput {
  current_role?: string;
  domain?: string;
  daily_activities?: string;
  tools?: string;
  client?: string;
  years?: string;
  target_role?: string;
}

export async function generateExperience(info: ExperienceInput) {
  const infoBlock =
    "My Information:\n" +
    `Current Role: ${info.current_role || ""}\n` +
    `Industry / Domain: ${info.domain || ""}\n` +
    `Daily Activities: ${info.daily_activities || ""}\n` +
    `Tools I Actually Use: ${info.tools || ""}\n` +
    `Client Name (Optional): ${info.client || ""}\n` +
    `Years of Experience: ${info.years || ""}\n` +
    `Target Role: ${info.target_role || "data_engineer"}\n`;

  const promptText =
    infoBlock +
    "\nPlease return a JSON object with keys: summary, bullets, project_story. bullets should be an array of 8-12 strings.";

  let apiError: string | null = null;
  try {
    const p = getRoleProfile(info.target_role);
    const systemPrompt = await getConfiguredPrompt("experience_package", buildBasePrompt(info.target_role), {
      discipline: p.discipline, label: p.label, adjective: p.adjective,
      storyDiscipline: p.storyDiscipline, focusTech: p.focusTech,
    });
    const raw = await callOpenAI(promptText, systemPrompt, { json: true });
    const data = parseOpenAIJson(raw);
    let bullets = (data.bullets as string[]) || [];
    bullets = bullets.filter((b) => b && typeof b === "string").map((b) => b.trim());
    return {
      summary: (data.summary as string) || "",
      bullets,
      project_story: (data.project_story as string) || "",
      api_used: true,
      api_error: null,
    };
  } catch (e) {
    apiError = e instanceof Error ? e.message : String(e);
  }

  const fb = fallbackGeneration(info);
  return { ...fb, api_used: false, api_error: apiError };
}
