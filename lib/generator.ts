// lib/generator.ts - Server-side AI generation with safe fallbacks (ported from resume_generator.py)
// This module is imported only by API routes and runs on the server. The OpenAI
// key is read from server-only env vars and never exposed to the browser.
import OpenAI from "openai";

function getOpenAIKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

function getOpenAIBase(): string | undefined {
  return process.env.OPENAI_API_BASE || undefined;
}

function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || "gpt-3.5-turbo";
}

export const BASE_PROMPT = `You are an expert Data Engineering Resume Writer with experience hiring Data Engineers at product companies, consulting firms, and Fortune 500 organizations.

Your task is to transform my actual work experience into highly professional, ATS-friendly, interview-ready Data Engineer experience bullet points.

### Instructions
1. Generate ONLY the Experience Section.
2. Do not create a resume summary, skills section, certifications, or projects.
3. Convert my existing responsibilities into Data Engineering-focused responsibilities wherever logically possible.
4. Maintain realism. Do not invent impossible achievements.
5. Make the experience sound genuine and believable to an experienced interviewer.
6. Use strong action verbs and professional corporate language.
7. Write each bullet point as if it was performed in a production environment.
8. Include measurable business impact whenever reasonable.
9. Create a coherent business story behind the work instead of listing random technologies.
10. If a client name is provided, naturally incorporate it into the experience.
11. If a domain is provided, create domain-specific data engineering use cases.

Focus heavily on Databricks, PySpark, Spark SQL, Delta Lake, Azure Data Factory, ADLS Gen2, Medallion Architecture, ETL/ELT, Incremental Loading, CDC, Data Quality, Orchestration, Data Modeling, Star Schema, SCD, Partitioning, Performance Optimization, Monitoring, SQL, Cloud Data Platforms, CI/CD, and Data Governance.

Write between 2 and 5 bullet points (vary the count based on how much real detail is provided — do not always return the same number). Every bullet should sound like real production work. Avoid generic phrases. If my experience has no direct Data Engineering exposure, intelligently reinterpret transferable responsibilities from a Data Engineering perspective while staying believable.`;

export const SUMMARY_PROMPT = `You are an expert Data Engineering Resume Writer with experience hiring Data Engineers at product companies, consulting firms, and Fortune 500 organizations.

Your task is to write a strong, ATS-friendly professional resume summary based on the candidate profile and experience details.

Return only valid JSON with a key named summary.`;

async function callOpenAI(promptText: string, systemPrompt?: string): Promise<string> {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new Error("API key not found. Set OPENAI_API_KEY in your environment.");
  }
  const client = new OpenAI({
    apiKey,
    baseURL: getOpenAIBase() || "https://api.openai.com/v1",
  });

  const resp = await client.chat.completions.create({
    model: getOpenAIModel(),
    messages: [
      { role: "system", content: systemPrompt || BASE_PROMPT },
      { role: "user", content: promptText },
    ],
    max_tokens: 1500,
    temperature: 0.4,
  });
  return resp.choices[0]?.message?.content || "";
}

function parseOpenAIJson(raw: string): Record<string, unknown> {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || start >= end) {
    throw new Error("OpenAI response did not return valid JSON");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

interface FallbackInfo {
  daily_activities?: string;
  tools?: string;
  client?: string;
  domain?: string;
  years?: string;
}

function fallbackGeneration(info: FallbackInfo): {
  summary: string;
  bullets: string[];
  project_story: string;
} {
  const verbs = [
    "Engineered", "Designed", "Implemented", "Optimized", "Automated",
    "Orchestrated", "Built", "Developed", "Streamlined", "Deployed",
  ];
  const domain = info.domain || "";
  const tools = info.tools || "";
  const daily = info.daily_activities || "";
  const client = info.client || "";

  const primaryTool = tools ? tools.split(",")[0].trim() : "PySpark";
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

  const generic = [
    `Designed and maintained data pipelines using ${primaryTool} to support ${domain || "business"} analytics.`,
    `Automated ETL workflows with ${primaryTool}, reducing manual processing time significantly.`,
    `Validated data quality and implemented monitoring checks for ${domain || "production"} data flows.`,
    `Collaborated with stakeholders to translate ${domain || "business"} requirements into data solutions.`,
    `Optimized ${primaryTool} jobs and data models to improve reliability and performance.`,
  ];
  let gi = 0;
  while (bullets.length < target && gi < generic.length) {
    bullets.push(generic[gi]);
    gi += 1;
  }

  const summary = `Data professional with ${info.years || "several"} years of experience in ${domain || "data"} projects. Skilled in ${tools || primaryTool}.`;
  const projectStory = `Built end-to-end data solutions${clientCtx} in the ${domain || "data"} domain: ${summary}`;
  return { summary, bullets, project_story: projectStory };
}

interface PersonalLike {
  fullName?: string;
  headline?: string;
}

function fallbackSummary(
  personal: PersonalLike,
  experience: unknown[],
  targetRole: string
): { summary: string } {
  const name = (personal.fullName || "").trim();
  const title =
    (personal.headline || "").trim() ||
    targetRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const expCount = experience.length;
  let summary =
    `${title} with ${expCount} experience entries and a strong focus on ${targetRole.replace(/_/g, " ")}. ` +
    `Skilled at translating technical work into business impact and building ATS-friendly resumes.`;
  if (name) summary = `${name} is ${summary}`;
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
    const raw = await callOpenAI(promptText);
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
  });
  return { bullets: fb.bullets, api_used: false, api_error: apiError };
}

export interface SummaryInput {
  profile_statement?: string;
  personal: PersonalLike;
  experience: { role?: string; company?: string }[];
  education: { degree?: string; school?: string }[];
  projects: { name?: string; tech?: string }[];
  skills: { category?: string; list?: string }[];
  target_role: string;
}

export async function generateProfessionalSummary(input: SummaryInput) {
  const experienceSummary = input.experience
    .filter((e) => e.role || e.company)
    .map((e) => `${e.role || ""} at ${e.company || ""}`)
    .join("\n");
  const educationSummary = input.education
    .filter((e) => e.degree || e.school)
    .map((e) => `${e.degree || ""} from ${e.school || ""}`)
    .join("\n");
  const projectsSummary = input.projects
    .filter((p) => p.name)
    .map((p) => `${p.name || ""} (${p.tech || ""})`)
    .join("\n");
  const skillsSummary = input.skills
    .filter((s) => s.list)
    .map((s) => `${s.category || ""} | ${s.list || ""}`)
    .join("\n");

  const promptText =
    "You are an expert Data Engineering Resume Writer with experience hiring Data Engineers at product companies, consulting firms, and Fortune 500 organizations. " +
    "Write a strong professional resume summary based on the complete candidate profile below. " +
    "Use concise, ATS-friendly language and highlight transferable technical strengths, impact, and role fit. " +
    "Return only valid JSON with a key named summary.\n\n" +
    `Profile Headline:\n${input.personal.headline || ""}\n` +
    `Current Profile Statement:\n${input.profile_statement || ""}\n` +
    `Experience:\n${experienceSummary}\n` +
    `Education:\n${educationSummary}\n` +
    `Projects:\n${projectsSummary}\n` +
    `Skills:\n${skillsSummary}\n` +
    `Target Role:\n${input.target_role}\n`;

  let apiError: string | null = null;
  try {
    const raw = await callOpenAI(promptText, SUMMARY_PROMPT);
    const data = parseOpenAIJson(raw);
    return {
      summary: ((data.summary as string) || "").trim(),
      api_used: true,
      api_error: null,
    };
  } catch (e) {
    apiError = e instanceof Error ? e.message : String(e);
  }

  const fb = fallbackSummary(input.personal, input.experience, input.target_role);
  return { summary: fb.summary, api_used: false, api_error: apiError };
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
    const raw = await callOpenAI(promptText);
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
