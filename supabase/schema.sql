-- Ashwin Enterprises internal admin dashboard — database schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query → paste → Run).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.

-- ============================================================
-- 1. FINANCIAL YEARS
-- ============================================================
create table if not exists financial_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,          -- e.g. "FY 2026-27"
  start_date date not null,            -- e.g. 2026-04-01
  end_date date not null,              -- e.g. 2027-03-31
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. PEOPLE / ORGANISATIONS
-- ============================================================
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists labourers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  default_rate numeric(12,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  category text,                       -- e.g. "Glass", "Hardware", "Aluminium"
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. PROJECTS / SITES
-- ============================================================
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  financial_year_id uuid references financial_years(id) on delete set null,
  name text not null,
  site_address text,
  status text not null default 'ongoing',  -- ongoing | completed | on_hold
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. CLIENT WORK & PAYMENTS
-- ============================================================
create table if not exists client_work (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  financial_year_id uuid references financial_years(id) on delete set null,
  bill_no text,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  work_date date not null default current_date,
  created_at timestamptz not null default now(),
  created_by text
);

create table if not exists client_payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  financial_year_id uuid references financial_years(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_date date not null default current_date,
  note text,
  payment_mode text,
  created_at timestamptz not null default now(),
  created_by text
);

-- ============================================================
-- 5. LABOUR WORK & PAYMENTS
-- ============================================================
create table if not exists labour_work (
  id uuid primary key default gen_random_uuid(),
  labourer_id uuid not null references labourers(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  financial_year_id uuid references financial_years(id) on delete set null,
  site_location text,
  client_name text,
  description text not null,
  quantity numeric(12,2) not null default 1,
  rate numeric(12,2) not null default 0,
  amount numeric(12,2) not null check (amount >= 0),
  work_date date not null default current_date,
  created_at timestamptz not null default now(),
  created_by text
);

create table if not exists labour_payments (
  id uuid primary key default gen_random_uuid(),
  labourer_id uuid not null references labourers(id) on delete cascade,
  financial_year_id uuid references financial_years(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_date date not null default current_date,
  note text,
  payment_mode text,
  entry_type text not null default 'Payment', -- 'Payment' | 'Advance'
  created_at timestamptz not null default now(),
  created_by text
);

-- ============================================================
-- 6. VENDOR BILLS & PAYMENTS
-- ============================================================
create table if not exists vendor_bills (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  financial_year_id uuid references financial_years(id) on delete set null,
  bill_no text,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  bill_date date not null default current_date,
  created_at timestamptz not null default now(),
  created_by text
);

create table if not exists vendor_payments (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  financial_year_id uuid references financial_years(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_date date not null default current_date,
  note text,
  payment_mode text,
  created_at timestamptz not null default now(),
  created_by text
);

-- ============================================================
-- 6.5. APP LOCK — extra PIN gate on top of email/password sign-in
-- ============================================================
create table if not exists app_lock (
  id text primary key default 'default',
  pin_hash text,
  salt text,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- ============================================================
-- 7. INDEXES
-- ============================================================
create index if not exists idx_projects_client on projects(client_id);
create index if not exists idx_client_work_client on client_work(client_id);
create index if not exists idx_client_work_fy on client_work(financial_year_id);
create index if not exists idx_client_payments_client on client_payments(client_id);
create index if not exists idx_client_payments_fy on client_payments(financial_year_id);
create index if not exists idx_labour_work_labourer on labour_work(labourer_id);
create index if not exists idx_labour_work_fy on labour_work(financial_year_id);
create index if not exists idx_labour_payments_labourer on labour_payments(labourer_id);
create index if not exists idx_labour_payments_fy on labour_payments(financial_year_id);
create index if not exists idx_vendor_bills_vendor on vendor_bills(vendor_id);
create index if not exists idx_vendor_bills_fy on vendor_bills(financial_year_id);
create index if not exists idx_vendor_payments_vendor on vendor_payments(vendor_id);
create index if not exists idx_vendor_payments_fy on vendor_payments(financial_year_id);

-- ============================================================
-- 8. BALANCE VIEWS (computed from transactions — never stored)
-- ============================================================
create or replace view client_balances as
select
  c.id as client_id,
  c.name,
  coalesce(w.total_work, 0) as total_work,
  coalesce(p.total_paid, 0) as total_paid,
  coalesce(w.total_work, 0) - coalesce(p.total_paid, 0) as balance
from clients c
left join (
  select client_id, sum(amount) as total_work from client_work group by client_id
) w on w.client_id = c.id
left join (
  select client_id, sum(amount) as total_paid from client_payments group by client_id
) p on p.client_id = c.id;

create or replace view labour_balances as
select
  l.id as labourer_id,
  l.name,
  coalesce(w.total_work, 0) as total_work,
  coalesce(p.total_paid, 0) as total_paid,
  coalesce(w.total_work, 0) - coalesce(p.total_paid, 0) as balance
from labourers l
left join (
  select labourer_id, sum(amount) as total_work from labour_work group by labourer_id
) w on w.labourer_id = l.id
left join (
  select labourer_id, sum(amount) as total_paid from labour_payments group by labourer_id
) p on p.labourer_id = l.id;

create or replace view vendor_balances as
select
  v.id as vendor_id,
  v.name,
  coalesce(b.total_billed, 0) as total_billed,
  coalesce(p.total_paid, 0) as total_paid,
  coalesce(b.total_billed, 0) - coalesce(p.total_paid, 0) as balance
from vendors v
left join (
  select vendor_id, sum(amount) as total_billed from vendor_bills group by vendor_id
) b on b.vendor_id = v.id
left join (
  select vendor_id, sum(amount) as total_paid from vendor_payments group by vendor_id
) p on p.vendor_id = v.id;

-- Unified activity feed — every money-moving event in one shape, newest first.
create or replace view all_transactions as
select id, 'client_work' as kind, client_id as entity_id, project_id, financial_year_id,
       description, amount, work_date as txn_date, created_at, created_by
from client_work
union all
select id, 'client_payment' as kind, client_id as entity_id, project_id, financial_year_id,
       coalesce(note, 'Payment received') as description, amount, payment_date as txn_date, created_at, created_by
from client_payments
union all
select id, 'labour_work' as kind, labourer_id as entity_id, project_id, financial_year_id,
       description, amount, work_date as txn_date, created_at, created_by
from labour_work
union all
select id, 'labour_payment' as kind, labourer_id as entity_id, null::uuid as project_id, financial_year_id,
       coalesce(note, 'Payment made') as description, amount, payment_date as txn_date, created_at, created_by
from labour_payments
union all
select id, 'vendor_bill' as kind, vendor_id as entity_id, project_id, financial_year_id,
       description, amount, bill_date as txn_date, created_at, created_by
from vendor_bills
union all
select id, 'vendor_payment' as kind, vendor_id as entity_id, null::uuid as project_id, financial_year_id,
       coalesce(note, 'Payment made') as description, amount, payment_date as txn_date, created_at, created_by
from vendor_payments;

-- ============================================================
-- 9. ROW LEVEL SECURITY — only signed-in users may touch business data
-- ============================================================
alter table financial_years enable row level security;
alter table clients enable row level security;
alter table labourers enable row level security;
alter table vendors enable row level security;
alter table projects enable row level security;
alter table client_work enable row level security;
alter table client_payments enable row level security;
alter table labour_work enable row level security;
alter table labour_payments enable row level security;
alter table vendor_bills enable row level security;
alter table vendor_payments enable row level security;
alter table app_lock enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'financial_years','clients','labourers','vendors','projects',
    'client_work','client_payments','labour_work','labour_payments',
    'vendor_bills','vendor_payments','app_lock'
  ])
  loop
    execute format(
      'drop policy if exists "authenticated full access" on %I;
       create policy "authenticated full access" on %I
       for all
       using (auth.role() = ''authenticated'')
       with check (auth.role() = ''authenticated'');',
      t, t
    );
  end loop;
end $$;

-- Views inherit the security_invoker behaviour of Postgres 15+/Supabase by
-- running with the caller's privileges, so the RLS policies above already
-- protect client_balances / labour_balances / vendor_balances / all_transactions.
alter view client_balances set (security_invoker = on);
alter view labour_balances set (security_invoker = on);
alter view vendor_balances set (security_invoker = on);
alter view all_transactions set (security_invoker = on);

-- ============================================================
-- 10. SEED: first financial year (edit dates/label if needed)
-- ============================================================
insert into financial_years (label, start_date, end_date, is_active)
values ('FY 2026-27', '2026-04-01', '2027-03-31', true)
on conflict (label) do nothing;
