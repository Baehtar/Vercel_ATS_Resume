// app/api/cron/refresh-jobs/route.ts
// Called once daily by Vercel Cron (see vercel.json).
// Fetches 3 fixed queries from JSearch (~3 API calls) and upserts into Supabase.
// Protected by CRON_SECRET so only Vercel's scheduler (or you) can trigger it.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const QUERIES = [
  { query: "Data Engineer",       roleType: "data_engineer" },
  { query: "Data Analyst",        roleType: "data_analyst"  },
  { query: "Big Data Engineer",   roleType: "data_engineer" },
];

const LOCATION = "India";
const DATE_POSTED = "month"; // last 30 days each refresh
const MAX_EXPERIENCE_MONTHS = 60; // 0–5 years only

const TECH_KEYWORDS = [
  "Python","SQL","Spark","Kafka","AWS","Azure","GCP","Airflow","Docker",
  "Kubernetes","Snowflake","Databricks","ETL","dbt","Power BI","Tableau",
  "Pandas","PySpark","Redshift","BigQuery","Hadoop","Hive","Scala","Java",
  "Terraform","PostgreSQL","MongoDB","Redis","Delta Lake","Excel",
  "Machine Learning",
];

function extractTags(text: string): string[] {
  const lower = text.toLowerCase();
  return TECH_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).slice(0, 8);
}

interface JSearchResult {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_description?: string;
  job_apply_link?: string;
  job_posted_at_datetime_utc?: string;
  job_employment_type?: string;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_currency?: string | null;
  job_salary_period?: string | null;
  job_required_experience?: { required_experience_in_months?: number };
}

async function fetchQuery(apiKey: string, query: string): Promise<JSearchResult[]> {
  const searchQuery = `${query} in ${LOCATION}`;
  const res = await fetch(
    `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&page=1&num_pages=1&date_posted=${DATE_POSTED}`,
    {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    }
  );
  if (!res.ok) throw new Error(`JSearch ${res.status} for query "${query}"`);
  const data = await res.json();
  return data.data || [];
}

function normalizeJob(r: JSearchResult, roleType: string) {
  const location = [r.job_city, r.job_state, r.job_country].filter(Boolean).join(", ");
  const salary =
    r.job_min_salary && r.job_max_salary
      ? `${r.job_salary_currency || "₹"}${r.job_min_salary.toLocaleString()} – ${r.job_max_salary.toLocaleString()} / ${r.job_salary_period || "year"}`
      : "Not disclosed";
  const posted = r.job_posted_at_datetime_utc
    ? new Date(r.job_posted_at_datetime_utc).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "Recently";
  const experience = r.job_required_experience?.required_experience_in_months
    ? `${Math.round(r.job_required_experience.required_experience_in_months / 12)}+ years`
    : "Not specified";
  const tags = extractTags(
    r.job_title + " " + (r.job_description || "")
  );

  return {
    id: r.job_id,
    title: r.job_title || "",
    company: r.employer_name || "",
    location,
    role_type: roleType,
    experience,
    posted,
    salary_range: salary,
    source: "JSearch",
    apply_url: r.job_apply_link || "#",
    description: (r.job_description || "").slice(0, 3000),
    tags,
    fetched_at: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron or an authorised manual trigger
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RAPIDAPI_KEY not configured" }, { status: 500 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results: { query: string; count: number; error?: string }[] = [];
  let totalUpserted = 0;

  for (const { query, roleType } of QUERIES) {
    try {
      const raw = await fetchQuery(apiKey, query);
      // Keep only jobs requiring 0–5 years experience (or unspecified)
      const filtered = raw.filter((r) => {
        const months = r.job_required_experience?.required_experience_in_months;
        return months === undefined || months === null || months <= MAX_EXPERIENCE_MONTHS;
      });
      const jobs = filtered.map((r) => normalizeJob(r, roleType));

      if (jobs.length) {
        const { error } = await supabase
          .from("job_listings")
          .upsert(jobs, { onConflict: "id" });

        if (error) throw new Error(error.message);
      }

      results.push({ query, count: jobs.length });
      totalUpserted += jobs.length;

      // Small delay between requests to be respectful of rate limits
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      results.push({ query, count: 0, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // Delete stale listings older than 35 days to keep the table clean
  await supabase
    .from("job_listings")
    .delete()
    .lt("fetched_at", new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString());

  return NextResponse.json({
    ok: true,
    total_upserted: totalUpserted,
    results,
    ran_at: new Date().toISOString(),
  });
}
