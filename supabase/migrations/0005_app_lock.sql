-- App Lock — an extra PIN gate on top of email/password sign-in, so a
-- device where the browser already remembers the Supabase session can't be
-- opened by anyone who picks up the phone/laptop. One row, id = 'default'.
-- No row (or a null pin_hash) means the PIN lock is simply off.
create table if not exists app_lock (
  id text primary key default 'default',
  pin_hash text,
  salt text,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table app_lock enable row level security;

drop policy if exists "authenticated full access" on app_lock;
create policy "authenticated full access" on app_lock
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
