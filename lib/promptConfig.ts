import { createClient } from "@supabase/supabase-js";
import { DEFAULT_PROMPT_TEMPLATES, renderPromptTemplate, type PromptKey } from "./promptTemplates";

const PREFIX = "ai_prompt_";

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
    return renderPromptTemplate(value || fallback, values);
  } catch {
    return renderPromptTemplate(fallback, values);
  }
}

export { DEFAULT_PROMPT_TEMPLATES };
