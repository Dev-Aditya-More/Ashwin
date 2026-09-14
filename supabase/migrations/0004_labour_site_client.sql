-- Lets a labour work entry carry its own Site/Location and Client Name
-- directly, instead of requiring a formal Project to be created and
-- linked first. If a project IS linked, its site_address/client name
-- are still used as a fallback when these are left blank.
--
-- Run this once in the Supabase SQL editor (existing projects only —
-- a fresh install via supabase/schema.sql already includes this).
-- Safe to re-run.

alter table labour_work add column if not exists site_location text;
alter table labour_work add column if not exists client_name text;
