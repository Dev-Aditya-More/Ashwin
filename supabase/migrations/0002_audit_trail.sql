-- Adds a lightweight "who added this" audit trail to every
-- money-moving table, and surfaces it through all_transactions.
--
-- Run this once in the Supabase SQL editor (existing projects only —
-- a fresh install via supabase/schema.sql already includes this).
-- Safe to re-run.

alter table client_work    add column if not exists created_by text;
alter table client_payments add column if not exists created_by text;
alter table labour_work     add column if not exists created_by text;
alter table labour_payments add column if not exists created_by text;
alter table vendor_bills    add column if not exists created_by text;
alter table vendor_payments add column if not exists created_by text;

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

alter view all_transactions set (security_invoker = on);
