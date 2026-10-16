-- AIVA core schema. Apply to a dedicated AIVA Supabase project after review.
-- No privileged credentials or CV document contents are stored here.
create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country_code text,
  desired_role text,
  created_at timestamptz not null default now()
);
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 180),
  website text,
  status text not null default 'pending' check (status in ('pending','verified','suspended')),
  created_at timestamptz not null default now()
);
create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  kind text not null check (kind in ('job','internship','scholarship','grant','fellowship','startup_program')),
  title text not null check (char_length(trim(title)) between 3 and 240),
  description text,
  original_url text not null check (original_url ~ '^https://'),
  source_name text not null,
  source_external_id text,
  country_codes text[] not null default '{}',
  remote boolean not null default false,
  deadline_at timestamptz,
  fetched_at timestamptz,
  status text not null default 'draft' check (status in ('draft','pending','published','expired','rejected')),
  created_at timestamptz not null default now(),
  unique (source_name,source_external_id)
);
create index opportunities_public_idx on public.opportunities(kind,created_at desc) where status='published';
create table public.saved_opportunities (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);
create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default false,
  kinds text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.opportunities enable row level security;
alter table public.saved_opportunities enable row level security;
alter table public.notification_preferences enable row level security;

create policy profiles_read_own on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy preferences_read_own on public.notification_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy preferences_insert_own on public.notification_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy preferences_update_own on public.notification_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Public reads show published opportunity rows only; drafts remain private to privileged server operations.
create policy opportunities_read_public on public.opportunities for select to anon, authenticated using (status = 'published');
create policy organizations_read_verified on public.organizations for select to anon, authenticated using (status = 'verified');
-- Organization writes and membership grants are server-only until dedicated authorized RPC/API endpoints are built.
-- No end-user INSERT/UPDATE/DELETE policies are deliberately defined for organizations, members or opportunities.
create policy members_read_own on public.organization_members for select to authenticated using ((select auth.uid()) = user_id);

create policy saved_read_own on public.saved_opportunities for select to authenticated using ((select auth.uid()) = user_id);
create policy saved_insert_own on public.saved_opportunities for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.opportunities o where o.id = opportunity_id and o.status='published'));
create policy saved_delete_own on public.saved_opportunities for delete to authenticated using ((select auth.uid()) = user_id);

-- Table grants are separate from RLS. Do not grant public mutation access on administrative tables.
revoke all on public.organizations, public.organization_members, public.opportunities from anon, authenticated;
grant select on public.organizations, public.opportunities to anon, authenticated;
grant select on public.organization_members to authenticated;
grant select, insert, update on public.profiles, public.notification_preferences to authenticated;
grant select, insert, delete on public.saved_opportunities to authenticated;
