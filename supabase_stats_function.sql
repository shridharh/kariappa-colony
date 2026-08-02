-- Run this in Supabase SQL Editor after supabase_setup.sql has already
-- been run once. Safe to re-run (CREATE OR REPLACE).

create or replace function public.get_registry_stats()
returns table (
  total_count integer,
  total_amount numeric
)
language sql
security definer
set search_path = public
as $$
  select
    count(*)::integer as total_count,
    coalesce(sum(amount_paid), 0)::numeric as total_amount
  from public.complainants;
$$;

grant execute on function public.get_registry_stats() to anon;