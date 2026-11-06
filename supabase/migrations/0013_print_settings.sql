-- Print look for Ashwin's documents (layout + colours). One shared row, id = 'default',
-- so every phone / laptop prints the same. No row means the built-in defaults.
create table if not exists print_settings (
  id text primary key default 'default',
  invoice_layout text not null default 'divine',
  accent text not null default '#f7941d',
  accent2 text not null default '#1c3f94',
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table print_settings enable row level security;

drop policy if exists "authenticated full access" on print_settings;
create policy "authenticated full access" on print_settings
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
