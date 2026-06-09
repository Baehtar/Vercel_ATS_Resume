// app/api/generate-experience/route.ts - Generate summary + bullets + project story
import { NextResponse } from "next/server";
import { generateExperience, type ExperienceInput } from "@/lib/generator";
import { getUserFromAuthHeader } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getUserFromAuthHeader(request);
  if (!user) {
    return NextResponse.json(
      {
        summary: "",
        bullets: [],
        project_story: "",
        api_used: false,
        api_error: "Unauthorized. Please sign in.",
      },
      { status: 401 }
    );
  }
  try {
    const input = (await request.json()) as ExperienceInput;
    const result = await generateExperience(input);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        summary: "",
        bullets: [],
        project_story: "",
        api_used: false,
        api_error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
