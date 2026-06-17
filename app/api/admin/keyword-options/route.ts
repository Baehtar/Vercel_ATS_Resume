// app/api/admin/keyword-options/route.ts
// GET  ?role=data_engineer  — returns { tools: string[], skills: string[] }
// POST { role_key, category, items } — upserts one category for a role (admin only)
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromAuthHeader } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Anonymous client — for public reads */
function anonClient() {
  return createClient(URL, ANON);
}

/** Authenticated client — carries the user's JWT so auth.uid() resolves in RLS */
function authedClient(jwt: string) {
  return createClient(URL, ANON, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

function extractToken(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

async function isAdmin(request: Request): Promise<boolean> {
  const user = await getUserFromAuthHeader(request);
  if (!user) return false;
  const { data } = await anonClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return (data as { role?: string } | null)?.role === "admin";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "data_engineer";

  const { data, error } = await anonClient()
    .from("keyword_options")
    .select("category, items")
    .eq("role_key", role);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result: Record<string, string[]> = { tools: [], skills: [] };
  for (const row of data || []) {
    result[row.category] = row.items as string[];
  }
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  }

  const { role_key, category, items } = await request.json();
  if (!role_key || !category || !Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Use the authenticated client so auth.uid() resolves and RLS allows the write
  const { error } = await authedClient(token)
    .from("keyword_options")
    .upsert(
      { role_key, category, items, updated_at: new Date().toISOString() },
      { onConflict: "role_key,category" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
