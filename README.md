# Console Flare — ATS Resume Builder & Interview Prep

A full-stack Next.js (App Router) + TypeScript application for building ATS-optimised resumes,
browsing live job listings, and practising role-specific interview questions.
Deployed on Vercel with Supabase as the database and auth provider.

---

## Features

### Resume Builder
- Sections: Personal info, Professional Summary, Experience, Education, Projects, Skills, Certifications
- Five resume templates: Modern, Professional, Graduate/Fresher, Executive, Two-Column
- AI-assisted summary and experience bullet generation via OpenAI (rule-based fallback when no API key is set)
- Client-side PDF export via the browser print dialog — produces a real text-based, ATS-parseable PDF

### ATS Scoring Engine
- Role-specific keyword analysis split into must-have (40 pts) and good-to-have (15 pts) categories
- Section completeness scoring (25 pts) and formatting checks (20 pts) — 100-point total
- Detects employment gaps, weak action verbs, emoji usage, and over/under-length resumes
- Full keyword audit showing matched and missing terms with suggested action verbs

### Job Board
- Live listings fetched daily from JSearch (RapidAPI) and cached in Supabase
- Filtered by role: Data Engineer, Data Analyst, Big Data Engineer
- Falls back to curated mock listings until the first daily cron run completes

### Interview Prep
- Role-specific question banks with difficulty ratings
- Hint reveal, write-your-own-answer textarea, and sample answer toggle

### Auth & Roles
- Email/password auth with Supabase (sign up, sign in, email verification, forgot/reset password)
- Demo Mode — skips auth when Supabase is not configured (cloud saving disabled)
- Admin role — dashboard to browse all students and view/print their resumes
- Configurable sign-up options and keyword options via an admin API

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Auth & DB | Supabase |
| AI | OpenAI API (`gpt-3.5-turbo` by default) |
| Job data | JSearch via RapidAPI |
| Hosting | Vercel |
| Styling | CSS custom properties (no UI library) |

---

## Local Development

```bash
npm install
cp .env.local.example .env.local   # fill in values (see table below)
npm run dev
```

Open <http://localhost:3000>.

---

## Environment Variables

| Variable | Side | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Supabase anon key |
| `NEXT_PUBLIC_AUTH_REDIRECT_URL` | client | Redirect target for verification / reset emails |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Service-role key for trusted admin writes (bypasses RLS) |
| `OPENAI_API_KEY` | server | OpenAI key — never exposed to the browser |
| `OPENAI_API_BASE` | server | Optional custom OpenAI-compatible base URL (e.g. Azure proxy) |
| `OPENAI_MODEL` | server | Model name (defaults to `gpt-3.5-turbo`) |
| `RAPIDAPI_KEY` | server | RapidAPI key for JSearch job listings |
| `CRON_SECRET` | server | Any random string — protects the `/api/cron/refresh-jobs` endpoint |

> **Tip:** Copy `.env.local.example` and fill in your values. In production, add all variables in
> Vercel → Project Settings → Environment Variables.

---

## Supabase Tables

| Table | Key columns |
|---|---|
| `resumes` | `id` (uuid, PK = auth user id), `resume_data` (jsonb) |
| `profiles` | `id` (uuid), `name`, `batch`, `course`, `role` |
| `shortlisted_resumes` | `student_id` (uuid, PK), `shortlisted_by` (uuid), `shortlisted_at` (timestamptz) |
| `job_listings` | `id` (text, PK = JSearch job_id), `title`, `company`, `location`, `role_type`, `description`, `tags`, `fetched_at`, … |

Domain notes are stored in the existing `signup_options` table with `category = 'domain_notes'`.

Apply Row Level Security so users can read/write only their own `resumes` row, and `admin`
profiles can read all `profiles`. The `job_listings` table is written by the cron route using
the service-role key and can be read publicly.

---

## Cron Job — Daily Job Refresh

The route `GET /api/cron/refresh-jobs` fetches ~3 JSearch queries (Data Engineer, Data Analyst,
Big Data Engineer) and upserts the results into `job_listings`. Stale listings older than 35 days
are automatically deleted.

Vercel triggers this automatically at **02:00 UTC** every day (configured in `vercel.json`).
The route is protected by `CRON_SECRET` — Vercel sends it as `Authorization: Bearer <CRON_SECRET>`.

To trigger it manually:

```bash
curl -H "Authorization: Bearer <your-cron-secret>" https://your-app.vercel.app/api/cron/refresh-jobs
```

---

## Deploying to Vercel

1. Push this repo to GitHub / GitLab / Bitbucket.
2. Import the repo in Vercel — framework is auto-detected as Next.js.
3. Add all environment variables listed above in Project Settings → Environment Variables.
4. Set `NEXT_PUBLIC_AUTH_REDIRECT_URL` to your Vercel deployment URL and add that URL to
   Supabase → Auth → URL Configuration → Redirect URLs.
5. Deploy. The cron job registers automatically from `vercel.json`.

---

## Project Structure

```
app/
  api/
    admin/          # keyword-options and signup-options config endpoints
    cron/           # daily job refresh cron route
    generate-*/     # AI generation routes (summary, bullets, experience)
    jobs/           # job listings read route
  layout.tsx
  page.tsx          # main app orchestrator
components/         # all UI components
lib/
  atsAnalyzer.ts    # ATS scoring engine
  generator.ts      # AI + rule-based content generator
  jobDb.ts          # mock job listings fallback
  prepDb.ts         # interview question banks
  resumeTemplates.ts
  resumeUtils.ts
  roleKeywords.ts   # must-have / good-to-have keywords per role
  supabaseClient.ts
  supabaseServer.ts
  types.ts
```

---

## PDF Export Note

WeasyPrint (server-side PDF) requires native libraries that are unavailable on Vercel serverless
functions. PDF export uses the browser's built-in print-to-PDF instead, which produces a real
text-based (ATS-friendly) PDF rather than a rasterised image.
