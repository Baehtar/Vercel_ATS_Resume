// app/api/jobs/route.ts
// Returns cached job listings from Supabase (populated by the daily cron).
// Students never hit JSearch directly — zero RapidAPI quota consumed here.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sortJobsByNewest } from "@/lib/jobSort";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ jobs: [], error: "Supabase not configured", source: "none" });
  }

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("job_listings")
      .select("*")
      .order("fetched_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      return NextResponse.json({ jobs: [], error: null, source: "empty" });
    }

    return NextResponse.json({
      jobs: sortJobsByNewest(data).slice(0, 50),
      error: null,
      source: "supabase",
    });
  } catch (e) {
    return NextResponse.json({
      jobs: [],
      error: e instanceof Error ? e.message : String(e),
      source: "error",
    });
  }
}
