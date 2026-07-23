import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromAuthHeader } from "@/lib/supabaseServer";
import { DEFAULT_PROMPT_TEMPLATES, PROMPT_LABELS, type PromptKey } from "@/lib/promptTemplates";
import { isLegacySummaryPrompt } from "@/lib/promptConfig";

export const runtime = "nodejs";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

function anonClient() { return createClient(SUPABASE_URL, ANON); }
function serviceClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE!, { auth: { autoRefreshToken: false, persistSession: false } });
}

const keys = Object.keys(PROMPT_LABELS) as PromptKey[];

async function isAdmin(request: Request): Promise<boolean> {
  const user = await getUserFromAuthHeader(request);
  if (!user) return false;
  const { data } = await anonClient().from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin";
}

export async function GET() {
  const values: Record<string, string> = { ...DEFAULT_PROMPT_TEMPLATES };
  if (SUPABASE_URL && ANON) {
    const { data } = await anonClient().from("signup_options").select("category, items").like("category", "ai_prompt_%");
    for (const row of data || []) {
      const key = row.category.replace("ai_prompt_", "") as PromptKey;
      if (keys.includes(key) && Array.isArray(row.items) && typeof row.items[0] === "string" && row.items[0].trim()) {
        const prompt = row.items[0].trim();
        values[key] = isLegacySummaryPrompt(key, prompt) ? DEFAULT_PROMPT_TEMPLATES[key] : prompt;
      }
    }
  }
  return NextResponse.json({ prompts: values, labels: PROMPT_LABELS });
}

export async function POST(request: Request) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!SERVICE_ROLE) return NextResponse.json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY env variable." }, { status: 500 });

  const body = await request.json() as { key?: string; prompt?: string };
  const key = body.key as PromptKey;
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!keys.includes(key) || !prompt) return NextResponse.json({ error: "A valid prompt and key are required." }, { status: 400 });

  const { error } = await serviceClient().from("signup_options").upsert(
    { category: `ai_prompt_${key}`, items: [prompt], updated_at: new Date().toISOString() },
    { onConflict: "category" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
