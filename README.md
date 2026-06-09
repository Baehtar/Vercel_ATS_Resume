# Console Flare — ATS Resume Builder & Interview Prep (Next.js)

A Vercel-ready rewrite of the original Streamlit app. Same features, now as a
Next.js (App Router) + TypeScript application.

## Features

- Email/password auth with Supabase (sign in, sign up, email verification, forgot/reset password, demo mode)
- Admin dashboard to browse students and view/print their resumes
- Resume builder with Personal, Summary, Experience, Education, Projects, Skills, Certifications
- AI assistance (OpenAI) for professional summary and experience bullets, with rule-based fallback when no API key is set
- Live ATS scoring engine (must-have / good-to-have keywords, section completeness, formatting) with keyword audit
- Four resume templates (Modern, Professional, Graduate/Fresher, Executive)
- Client-side PDF export via the browser print dialog (keeps text selectable and ATS-parseable)
- Curated job board with filtering
- Role-based interview prep question banks

## Local development

```bash
npm install
cp .env.local.example .env.local   # then fill in values
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Supabase anon key |
| `NEXT_PUBLIC_AUTH_REDIRECT_URL` | client | Redirect target for verification/reset emails (your deployed URL) |
| `OPENAI_API_KEY` | server | OpenAI key (kept server-side only) |
| `OPENAI_API_BASE` | server | Optional custom OpenAI-compatible base URL |
| `OPENAI_MODEL` | server | Model name (default `gpt-3.5-turbo`) |

If Supabase is not configured, the app offers a "Demo Mode" that skips auth
(cloud saving is disabled in demo mode). If OpenAI is not configured, AI
generation transparently falls back to a deterministic generator.

## Supabase tables expected

- `resumes` — columns: `id` (uuid, PK = auth user id), `resume_data` (jsonb)
- `profiles` — columns include `id` (uuid), `name`, `batch`, `course`, `role`

Add Row Level Security policies so users can read/write only their own
`resumes` row, and so `admin` profiles can read all `profiles`.

## Deploying to Vercel

1. Push this folder to a Git repository.
2. Import the repo in Vercel (framework auto-detected as Next.js).
3. Add the environment variables above in Project Settings → Environment Variables.
4. Set `NEXT_PUBLIC_AUTH_REDIRECT_URL` to your Vercel URL and add that URL to
   Supabase Auth → URL Configuration → Redirect URLs.
5. Deploy.

## Notes on the migration

- WeasyPrint (server PDF) required native libraries that don't run on Vercel
  serverless functions. PDF export now uses the browser's print-to-PDF, which
  produces a real text-based (ATS-friendly) PDF instead of a rasterized image.
- The original Python modules remain in the repo for reference; the live app is
  fully driven by the `app/`, `components/`, and `lib/` directories.
