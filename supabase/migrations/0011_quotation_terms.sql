-- Per-quotation Terms & Conditions. NULL = use the built-in default terms.
-- Run once in the Supabase SQL editor. Safe to re-run.
alter table quotations add column if not exists terms text;
