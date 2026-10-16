-- Apply only after core schema, on the dedicated AIVA project.
create table public.billing_customers(user_id uuid primary key references auth.users(id) on delete cascade,stripe_customer_id text unique not null);
create table public.subscriptions(stripe_subscription_id text primary key,user_id uuid not null references auth.users(id) on delete cascade,plan text not null check(plan in ('pro','business','unknown')),status text not null,updated_at timestamptz not null default now());
create table public.stripe_events(id text primary key,type text not null,processed_at timestamptz not null default now());
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;
revoke all on public.billing_customers,public.subscriptions,public.stripe_events from anon,authenticated;
-- Billing tables are accessible only via trusted server-side service credentials.
create index subscriptions_user_idx on public.subscriptions(user_id);
