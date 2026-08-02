-- =====================================================================
-- Field Marshal Kariyappa Colony — Affected Buyers Registry
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- =====================================================================

create table if not exists public.complainants (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  mobile_number     text not null,
  plot_number       text,
  applicant_status  text,           -- 'serving_army' | 'retired_army' | 'family' | 'civilian' | 'other'
  amount_paid       numeric,
  purchase_year     int,
  village_taluk     text,
  notes             text,
  consent_given     boolean not null default false,
  consent_name      text not null,  -- typed name as digital acknowledgement
  created_at        timestamptz not null default now()
);

-- Basic sanity constraints
alter table public.complainants
  add constraint mobile_number_length check (char_length(mobile_number) >= 10);

-- Enable Row Level Security
alter table public.complainants enable row level security;

-- Anyone (anon key, i.e. the public website) can INSERT a new entry...
create policy "public can submit entries"
  on public.complainants
  for insert
  to anon
  with check (consent_given = true);

-- ...but nobody using the public anon key can read, edit, or delete.
-- This keeps names/mobile numbers/plot numbers private to you.
-- No SELECT / UPDATE / DELETE policy is created for the anon role,
-- so those are blocked by default once RLS is enabled.

-- To view or export the data yourself, use the Supabase Dashboard:
-- Table Editor -> complainants -> ... -> Export as CSV
-- (You're logged in as the project owner there, which bypasses RLS.)
