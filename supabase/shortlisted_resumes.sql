-- Run this once in Supabase SQL Editor.
create table if not exists public.shortlisted_resumes (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  shortlisted_by uuid references public.profiles(id) on delete set null,
  shortlisted_at timestamptz not null default timezone('utc', now())
);

alter table public.shortlisted_resumes enable row level security;

-- The application accesses this table through the server-side service role.
-- No direct browser policy is needed for the admin dump.
