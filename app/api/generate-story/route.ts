// app/api/generate-story/route.ts
// Generates a personalised interview story from the candidate's resume data.
import { NextResponse } from "next/server";
import { generateInterviewStory, type StoryInput } from "@/lib/generator";
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
    const input = (await request.json()) as StoryInput;
    const result = await generateInterviewStory(input);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { api_used: false, api_error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
