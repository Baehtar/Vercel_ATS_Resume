// app/api/generate-bullets/route.ts - Generate ATS bullets for one experience entry
import { NextResponse } from "next/server";
import { generateEntryBullets, type EntryInfo } from "@/lib/generator";
import { getUserFromAuthHeader } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getUserFromAuthHeader(request);
  if (!user) {
    return NextResponse.json(
      { bullets: [], api_used: false, api_error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }
  try {
    const entry = (await request.json()) as EntryInfo;
    const result = await generateEntryBullets(entry);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { bullets: [], api_used: false, api_error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
