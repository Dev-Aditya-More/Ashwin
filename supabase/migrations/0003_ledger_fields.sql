-- Adds the extra fields needed for the detailed per-entity "Ledger"
-- view (Payment Mode everywhere, Bill No. for vendors, Entry Type
-- for labour advances).
--
-- Run this once in the Supabase SQL editor (existing projects only —
-- a fresh install via supabase/schema.sql already includes this).
-- Safe to re-run.

alter table client_payments add column if not exists payment_mode text;
alter table labour_payments add column if not exists payment_mode text;
alter table vendor_payments add column if not exists payment_mode text;

alter table vendor_bills add column if not exists bill_no text;

alter table labour_payments add column if not exists entry_type text not null default 'Payment';
