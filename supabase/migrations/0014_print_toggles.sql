-- Which blocks of the Tax Invoice to print (terms, amount in words, HSN summary, bank, QR, signatures, thank-you).
-- Stored as {"terms": false, ...}; anything missing counts as "show".
alter table print_settings add column if not exists invoice_toggles jsonb not null default '{}'::jsonb;
