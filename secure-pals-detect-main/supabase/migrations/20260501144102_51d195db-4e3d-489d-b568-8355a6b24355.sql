create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_local_id text,
  user_email text,
  module text not null,
  label text not null,
  confidence numeric not null,
  details text,
  input_snippet text,
  source text,
  destination text,
  source_ip text,
  user_agent text,
  ipfs_cid text,
  ipfs_url text,
  status text not null default 'Confirmed'
);

alter table public.incidents enable row level security;

create policy "Anyone can read incidents"
  on public.incidents for select
  using (true);

create policy "Anyone can insert incidents"
  on public.incidents for insert
  with check (true);

create index idx_incidents_created_at on public.incidents (created_at desc);
create index idx_incidents_module on public.incidents (module);