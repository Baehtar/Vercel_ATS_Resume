// app/api/admin/signup-options/route.ts
// GET  ?category=batches  — returns { items: string[] }  (public read)
// POST { category, items } — overwrites a category (admin only, service-role write)
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromAuthHeader } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

function anonClient() {
  return createClient(SUPABASE_URL, ANON);
}

function serviceClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function isAdmin(request: Request): Promise<{ ok: boolean; reason: string }> {
  const user = await getUserFromAuthHeader(request);
  let userId: string | undefined = user?.id;

  if (!userId) {
    // Fallback: decode JWT payload to get the user id
    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return { ok: false, reason: "No token provided" };
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf-8"));
      userId = payload.sub;
    } catch (e) {
      return { ok: false, reason: `Token decode failed: ${e}` };
    }
  }
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
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "batches";

  const { data, error } = await anonClient()
    .from("signup_options")
    .select("items")
    .eq("category", category)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: (data?.items as string[]) || [] });
}

export async function POST(request: Request) {
  const adminCheck = await isAdmin(request);
  if (!adminCheck.ok) {
    return NextResponse.json({ error: `Unauthorized: ${adminCheck.reason}` }, { status: 401 });
  }
  if (!SERVICE_ROLE) {
    return NextResponse.json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY env variable." }, { status: 500 });
  }

  const { category, items } = await request.json();
  if (!category || !Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error } = await serviceClient()
    .from("signup_options")
    .upsert(
      { category, items, updated_at: new Date().toISOString() },
      { onConflict: "category" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
