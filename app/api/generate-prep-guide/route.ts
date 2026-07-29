// app/api/generate-prep-guide/route.ts
// Generates a resume-specific interview preparation guide.
import { NextResponse } from "next/server";
import { generateInterviewPrep, type InterviewPrepInput } from "@/lib/generator";
import { getUserFromAuthHeader } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getUserFromAuthHeader(request);
  if (!user) {
    return NextResponse.json(
      { api_used: false, api_error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }

  try {
    const input = (await request.json()) as InterviewPrepInput;
    const result = await generateInterviewPrep(input);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { api_used: false, api_error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
