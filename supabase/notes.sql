-- ─── Lead notes table ──────────────────────────────────────────────────────────

create table if not exists lead_notes (
  id          uuid        primary key default gen_random_uuid(),
  lead_id     uuid        not null references leads(id) on delete cascade,
  content     text        not null,
  author_id   uuid        references auth.users(id) on delete set null,
  author_name text        not null,
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists lead_notes_lead_id_idx  on lead_notes(lead_id);
create index if not exists lead_notes_created_idx  on lead_notes(created_at desc);

-- RLS
alter table lead_notes enable row level security;

create policy "Authenticated can read notes"
  on lead_notes for select
  to authenticated
  using (true);

create policy "Authenticated can insert notes"
  on lead_notes for insert
  to authenticated
  with check (true);
