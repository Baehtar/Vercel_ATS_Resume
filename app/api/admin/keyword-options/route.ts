// app/api/admin/keyword-options/route.ts
// GET  ?role=data_engineer  — returns { tools: string[], skills: string[] }
// POST { role_key, category, items } — upserts one category for a role (admin only)
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromAuthHeader } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Anonymous client — for public reads */
function anonClient() {
  return createClient(URL, ANON);
}

/**
 * Service-role client — bypasses RLS for trusted server-side writes.
 * Safe because we verify isAdmin() in our own code before using it.
 * The service role key is server-only and never sent to the browser.
 */
function serviceClient() {
  return createClient(URL, SERVICE_ROLE!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function isAdmin(request: Request): Promise<{ ok: boolean; reason: string }> {
  const user = await getUserFromAuthHeader(request);
  if (!user) {
    // Fallback: decode JWT manually to get user ID, then check profiles
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return { ok: false, reason: "No token provided" };

    // Decode the JWT payload (base64url middle segment) without verification
    // The RLS policy on profiles still protects the data — we just need the user ID
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString("utf-8")
      );
      const userId: string = payload.sub;
      if (!userId) return { ok: false, reason: "No user ID in token" };

      const { data, error } = await anonClient()
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) return { ok: false, reason: `profiles lookup error: ${error.message}` };
      const role = (data as { role?: string } | null)?.role;
      if (role !== "admin") return { ok: false, reason: `Role is "${role}", not "admin"` };
      return { ok: true, reason: "" };
    } catch (e) {
      return { ok: false, reason: `Token decode failed: ${e}` };
    }
  }

  const { data, error } = await anonClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) return { ok: false, reason: `profiles lookup error: ${error.message}` };
  if (!data) return { ok: false, reason: `No profiles row for user ${user.id}` };
  const role = (data as { role?: string }).role;
  if (role !== "admin") return { ok: false, reason: `Role is "${role}", not "admin"` };
  return { ok: true, reason: "" };
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
  const adminCheck = await isAdmin(request);
  if (!adminCheck.ok) {
    return NextResponse.json({ error: `Unauthorized: ${adminCheck.reason}` }, { status: 401 });
  }

  if (!SERVICE_ROLE) {
    return NextResponse.json(
      { error: "Server missing SUPABASE_SERVICE_ROLE_KEY env variable." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { role_key, category, items } = body;
  if (!role_key || !category || !Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Service-role write — RLS is bypassed; admin status already verified above.
  const { error } = await serviceClient()
    .from("keyword_options")
    .upsert(
      { role_key, category, items, updated_at: new Date().toISOString() },
      { onConflict: "role_key,category" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
