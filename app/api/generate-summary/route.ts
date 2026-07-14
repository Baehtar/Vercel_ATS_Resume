// app/api/generate-summary/route.ts - Generate a recruiter summary from the full profile
import { NextResponse } from "next/server";
import { generateProfessionalSummary, type SummaryInput } from "@/lib/generator";
import { getUserFromAuthHeader } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getUserFromAuthHeader(request);
  if (!user) {
    return NextResponse.json(
      { summary: "", api_used: false, api_error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }
  try {
    const input = (await request.json()) as SummaryInput;
    const result = await generateProfessionalSummary(input);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { summary: "", api_used: false, api_error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
