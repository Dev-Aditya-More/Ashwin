-- Quotation → Estimate → Detail Sheet → GST Invoice workflow, client GSTIN,
-- refunds, and the estimate item catalog (ported from the ASHWIN PWA starter).
--
-- Run this once in the Supabase SQL editor (existing projects only — a fresh
-- install via supabase/schema.sql should run this file afterwards too).
-- Safe to re-run.

-- ============================================================
-- 1. CLIENT: GSTIN + status/work
-- ============================================================
alter table clients add column if not exists gstin text;
alter table clients add column if not exists work_status text;

-- ============================================================
-- 2. REFUNDS
-- A refund is a payment flowing the opposite way (money returned to a client,
-- or returned to us by a vendor/labourer). It is stored on the payment tables
-- with is_refund = true and counts NEGATIVE in "total paid", so the balance
-- moves back up by the refunded amount.
-- ============================================================
alter table client_payments add column if not exists is_refund boolean not null default false;
alter table labour_payments add column if not exists is_refund boolean not null default false;
alter table vendor_payments add column if not exists is_refund boolean not null default false;

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
  select client_id, sum(case when is_refund then -amount else amount end) as total_paid
  from client_payments group by client_id
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
  select labourer_id, sum(case when is_refund then -amount else amount end) as total_paid
  from labour_payments group by labourer_id
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
  select vendor_id, sum(case when is_refund then -amount else amount end) as total_paid
  from vendor_payments group by vendor_id
) p on p.vendor_id = v.id;

-- Unified activity feed: same shape as before plus payment_mode, note and
-- is_refund appended at the end (create-or-replace may only add trailing columns).
create or replace view all_transactions as
select id, 'client_work' as kind, client_id as entity_id, project_id, financial_year_id,
       description, amount, work_date as txn_date, created_at, created_by,
       false as is_refund, null::text as payment_mode, bill_no as note
from client_work
union all
select id, 'client_payment' as kind, client_id as entity_id, project_id, financial_year_id,
       coalesce(note, case when is_refund then 'Refund' else 'Payment received' end) as description,
       amount, payment_date as txn_date, created_at, created_by,
       is_refund, payment_mode, note
from client_payments
union all
select id, 'labour_work' as kind, labourer_id as entity_id, project_id, financial_year_id,
       description, amount, work_date as txn_date, created_at, created_by,
       false as is_refund, null::text as payment_mode, null::text as note
from labour_work
union all
select id, 'labour_payment' as kind, labourer_id as entity_id, null::uuid as project_id, financial_year_id,
       coalesce(note, case when is_refund then 'Refund' else 'Payment made' end) as description,
       amount, payment_date as txn_date, created_at, created_by,
       is_refund, payment_mode, note
from labour_payments
union all
select id, 'vendor_bill' as kind, vendor_id as entity_id, project_id, financial_year_id,
       description, amount, bill_date as txn_date, created_at, created_by,
       false as is_refund, null::text as payment_mode, bill_no as note
from vendor_bills
union all
select id, 'vendor_payment' as kind, vendor_id as entity_id, null::uuid as project_id, financial_year_id,
       coalesce(note, case when is_refund then 'Refund' else 'Payment made' end) as description,
       amount, payment_date as txn_date, created_at, created_by,
       is_refund, payment_mode, note
from vendor_payments;

alter view client_balances set (security_invoker = on);
alter view labour_balances set (security_invoker = on);
alter view vendor_balances set (security_invoker = on);
alter view all_transactions set (security_invoker = on);

-- ============================================================
-- 3. QUOTATIONS (Description / Unit / Rate only — no dimensions or amounts)
-- ============================================================
create table if not exists quotations (
  id uuid primary key default gen_random_uuid(),
  no text not null unique,
  doc_date date not null default current_date,
  client_id uuid not null references clients(id) on delete cascade,
  financial_year_id uuid references financial_years(id) on delete set null,
  site_name text,
  work_type text,
  note text,
  lines jsonb not null default '[]'::jsonb,   -- [{ name, unit, rate }]
  created_at timestamptz not null default now(),
  created_by text
);

-- ============================================================
-- 4. ESTIMATES (measured items, half-foot rounding, discount/transport/hamali/GST)
-- A confirmed estimate (confirmed_at set) IS the Detail Sheet; confirming it also
-- books the total as a client_work (Due) entry in the client's ledger.
-- ============================================================
create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  no text not null unique,
  doc_date date not null default current_date,
  client_id uuid not null references clients(id) on delete cascade,
  financial_year_id uuid references financial_years(id) on delete set null,
  site_name text,
  work_type text,
  note text,
  lines jsonb not null default '[]'::jsonb,   -- measured items, see lib/doc-calc.ts
  subtotal numeric(14,2) not null default 0,
  discount_pct numeric(6,2) not null default 0,
  discount numeric(14,2) not null default 0,
  after_discount numeric(14,2) not null default 0,
  transport numeric(14,2) not null default 0,
  hamali numeric(14,2) not null default 0,
  taxable numeric(14,2) not null default 0,
  gst_rate numeric(5,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  source_quote_id uuid references quotations(id) on delete set null,
  confirmed_at timestamptz,
  client_work_id uuid references client_work(id) on delete set null,
  created_at timestamptz not null default now(),
  created_by text
);

-- ============================================================
-- 5. GST / NON-GST INVOICES (created from a saved estimate)
-- ============================================================
create table if not exists gst_invoices (
  id uuid primary key default gen_random_uuid(),
  no text not null unique,
  doc_date date not null default current_date,
  client_id uuid not null references clients(id) on delete cascade,
  estimate_id uuid references estimates(id) on delete set null,
  estimate_no text,
  financial_year_id uuid references financial_years(id) on delete set null,
  invoice_type text not null default 'GST',   -- 'GST' | 'Non-GST'
  site_name text,
  work_type text,
  client_mobile text,
  client_address text,
  client_gstin text,
  lines jsonb not null default '[]'::jsonb,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  transport numeric(14,2) not null default 0,
  hamali numeric(14,2) not null default 0,
  taxable numeric(14,2) not null default 0,
  gst_rate numeric(5,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  received numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  created_by text
);

-- ============================================================
-- 6. ESTIMATE ITEM CATALOG (the dropdown options on the Estimate form)
-- ============================================================
create table if not exists item_catalog (
  id uuid primary key default gen_random_uuid(),
  category text not null,   -- product | sheet | material | glass | shade | floor
  value text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists item_catalog_unique on item_catalog (category, lower(value));

insert into item_catalog (category, value) values
  ('product','Domal Window'),('product','18 x 60 Window'),('product','Sliding Window'),
  ('product','Fixed Window'),('product','System Window'),('product','UPVC Window'),
  ('product','Door'),('product','Partition'),('product','Other'),
  ('material','Glass'),('material','Aluminium'),('material','Aluminium Window'),
  ('material','System Window'),('material','UPVC Window'),('material','SS / MS'),('material','Other'),
  ('glass','Reflective Glass - 3.5 mm'),('glass','Reflective Glass - 4 mm'),
  ('glass','Reflective Glass - 5 mm'),('glass','Clear Glass'),('glass','Toughened Glass'),
  ('glass','Laminated Glass'),('glass','Frosted Glass'),('glass','Other'),
  ('shade','Powder Coating'),('shade','Anodizing'),('shade','Wood Finish'),('shade','Other'),
  ('floor','Ground Floor'),('floor','1st Floor'),('floor','2nd Floor'),
  ('floor','3rd Floor'),('floor','4th Floor'),('floor','Other'),
  ('sheet','2 Track'),('sheet','3 Track'),('sheet','4 Track'),('sheet','Fixed'),
  ('sheet','Sliding'),('sheet','Casement'),('sheet','Other')
on conflict do nothing;

-- ============================================================
-- 7. INDEXES + RLS
-- ============================================================
create index if not exists idx_quotations_client on quotations(client_id);
create index if not exists idx_estimates_client on estimates(client_id);
create index if not exists idx_invoices_client on gst_invoices(client_id);

alter table quotations enable row level security;
alter table estimates enable row level security;
alter table gst_invoices enable row level security;
alter table item_catalog enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['quotations','estimates','gst_invoices','item_catalog'])
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
