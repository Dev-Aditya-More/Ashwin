-- Lets a client work/billed-amount entry carry its own bill number, same as
-- vendor bills already do — so it's visible on the ledger at payment time.
alter table client_work add column if not exists bill_no text;
