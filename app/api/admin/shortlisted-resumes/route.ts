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

async function getAdmin(request: Request) {
  const user = await getUserFromAuthHeader(request);
  if (!user) return null;

  const { data } = await anonClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return data?.role === "admin" ? user : null;
}

export async function GET(request: Request) {
  if (!(await getAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!SERVICE_ROLE) {
    return NextResponse.json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY env variable." }, { status: 500 });
  }

  const adminClient = serviceClient();
  const { data: flags, error: flagsError } = await adminClient
    .from("shortlisted_resumes")
    .select("student_id, shortlisted_at")
    .order("shortlisted_at", { ascending: false });

  if (flagsError) return NextResponse.json({ error: flagsError.message }, { status: 500 });

  const studentIds = (flags || []).map((flag) => flag.student_id);
  if (!studentIds.length) return NextResponse.json({ items: [] });

  const [{ data: profiles, error: profilesError }, { data: resumes, error: resumesError }] = await Promise.all([
    adminClient.from("profiles").select("*").in("id", studentIds),
    adminClient.from("resumes").select("id, resume_data").in("id", studentIds),
  ]);

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });
  if (resumesError) return NextResponse.json({ error: resumesError.message }, { status: 500 });

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const resumeMap = new Map((resumes || []).map((resume) => [resume.id, resume.resume_data]));

  const items = (flags || []).map((flag) => {
    const profile = profileMap.get(flag.student_id);
    const resume = resumeMap.get(flag.student_id) || null;
    return {
      student_id: flag.student_id,
      shortlisted_at: flag.shortlisted_at,
      student: profile
        ? {
            ...profile,
            phone: profile.phone || resume?.personal?.phone,
            qualification: profile.qualification || resume?.education?.[0]?.degree,
            domain: profile.domain || profile.course,
            has_resume: Boolean(resume),
            experience_count: resume?.experience?.length || 0,
            resume,
          }
        : null,
    };
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!SERVICE_ROLE) {
    return NextResponse.json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY env variable." }, { status: 500 });
  }

  const body = await request.json() as { student_id?: string };
  if (!body.student_id) return NextResponse.json({ error: "student_id is required." }, { status: 400 });

  const { error } = await serviceClient().from("shortlisted_resumes").upsert(
    { student_id: body.student_id, shortlisted_by: admin.id, shortlisted_at: new Date().toISOString() },
    { onConflict: "student_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await getAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!SERVICE_ROLE) {
    return NextResponse.json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY env variable." }, { status: 500 });
  }

  const body = await request.json() as { student_id?: string };
  if (!body.student_id) return NextResponse.json({ error: "student_id is required." }, { status: 400 });

  const { error } = await serviceClient()
    .from("shortlisted_resumes")
    .delete()
    .eq("student_id", body.student_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
