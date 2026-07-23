import { createClient } from "@supabase/supabase-js";
import { DEFAULT_PROMPT_TEMPLATES, renderPromptTemplate, type PromptKey } from "./promptTemplates";

const PREFIX = "ai_prompt_";

export function isLegacySummaryPrompt(key: PromptKey, value: string): boolean {
  if (key !== "summary") return false;
  const lower = value.toLowerCase();
  return lower.includes("exactly 2-sentence") ||
    lower.includes("exactly two sentences") ||
    lower.includes("must consist of exactly two sentences") ||
    (lower.includes("keep it to 2-3 concise sentences") && !lower.includes("implied first person")) ||
    lower.includes("produce exactly 3 bullet points") ||
    (lower.includes("bullet 1: who they are") && lower.includes("bullet 3: key skill set"));
}

export async function getConfiguredPrompt(
  key: PromptKey,
  fallback: string,
  values: Record<string, string> = {}
): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return renderPromptTemplate(fallback, values);

  try {
    const supabase = createClient(url, anonKey);
    const { data } = await supabase
      .from("signup_options")
      .select("items")
      .eq("category", `${PREFIX}${key}`)
      .single();
    const value = Array.isArray(data?.items) && typeof data.items[0] === "string" ? data.items[0].trim() : "";
    if (isLegacySummaryPrompt(key, value)) return renderPromptTemplate(fallback, values);
    return renderPromptTemplate(value || fallback, values);
  } catch {
    return renderPromptTemplate(fallback, values);
  }
}

export { DEFAULT_PROMPT_TEMPLATES };
