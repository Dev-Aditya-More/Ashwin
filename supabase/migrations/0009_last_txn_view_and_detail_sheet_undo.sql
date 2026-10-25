-- 1. party_last_txn: the single most recent transaction per party (client / labourer / vendor).
--    The WhatsApp wording only needs this one row per party, so the party lists read a few
--    hundred rows at most instead of scanning thousands of transactions.
-- 2. Undo a Detail Sheet when its ledger Due entry is deleted, so the estimate can be
--    converted again instead of staying "confirmed" with nothing in the ledger.
--
-- Run once in the Supabase SQL editor (after 0007). Safe to re-run.

create or replace view party_last_txn as
select distinct on (entity_id)
  entity_id, kind, amount, txn_date, is_refund, note
from all_transactions
order by entity_id, txn_date desc, created_at desc;

alter view party_last_txn set (security_invoker = on);

create or replace function unconfirm_detail_sheet() returns trigger
language plpgsql as $$
begin
  update estimates
     set confirmed_at = null,
         client_work_id = null
   where client_work_id = old.id;
  return old;
end $$;

drop trigger if exists client_work_unconfirm_detail_sheet on client_work;
create trigger client_work_unconfirm_detail_sheet
  before delete on client_work
  for each row execute function unconfirm_detail_sheet();
