-- GST details on vendor (purchase) bills, filled by Scan Bill or typed by hand.
-- vendor_gstin = supplier's GSTIN; taxable_amount = value before tax; gst_amount = CGST+SGST+IGST.
-- `amount` stays the bill total (what you owe the vendor). Run once in the Supabase SQL editor. Safe to re-run.
alter table vendor_bills add column if not exists vendor_gstin text;
alter table vendor_bills add column if not exists taxable_amount numeric(12,2);
alter table vendor_bills add column if not exists gst_amount numeric(12,2);
