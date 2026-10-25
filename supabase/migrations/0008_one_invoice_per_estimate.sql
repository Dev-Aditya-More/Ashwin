-- One bill per estimate: an estimate is billed EITHER as a GST tax invoice (AE/…)
-- OR as a Non-GST bill of supply (AGS/…), never both.
--
-- Run once in the Supabase SQL editor. Safe to re-run.
-- If it fails with "could not create unique index", an estimate already has two
-- bills: delete the wrong one from GST & Invoices, then run this again.
create unique index if not exists gst_invoices_one_per_estimate
  on gst_invoices (estimate_id)
  where estimate_id is not null;
