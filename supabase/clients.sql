-- ─── Clients feature migrations ────────────────────────────────────────────
-- Run in Supabase SQL Editor in order.

-- 1. Add 'cliente' status to lead_status enum
alter type lead_status add value if not exists 'cliente' after 'visita_agendada';

-- 2. Add reminder_sent column to visits
alter table visits add column if not exists reminder_sent boolean not null default false;

-- 3. Lead files metadata table
create table if not exists lead_files (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  filename    text not null,
  storage_path text not null,
  content_type text not null default 'application/octet-stream',
  size_bytes  integer,
  uploaded_by uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

create index if not exists lead_files_lead_id_idx on lead_files(lead_id);

alter table lead_files enable row level security;

-- Authenticated users can read + insert + delete their own uploads
create policy "Team can read lead files"
  on lead_files for select to authenticated
  using (true);

create policy "Team can insert lead files"
  on lead_files for insert to authenticated
  with check (true);

create policy "Team can delete lead files"
  on lead_files for delete to authenticated
  using (true);

-- ─── Supabase Storage ────────────────────────────────────────────────────────
-- After running the SQL above, manually create the storage bucket:
--
--   Dashboard → Storage → New bucket
--   Name: lead-files
--   Public: OFF  (private — access via signed URLs only)
--
-- Then add these storage policies via Dashboard → Storage → lead-files → Policies:
--
--   Policy 1 — authenticated users can upload:
--     Operation: INSERT
--     Target roles: authenticated
--     USING: bucket_id = 'lead-files'
--
--   Policy 2 — authenticated users can read/download:
--     Operation: SELECT
--     Target roles: authenticated
--     USING: bucket_id = 'lead-files'
--
--   Policy 3 — authenticated users can delete:
--     Operation: DELETE
--     Target roles: authenticated
--     USING: bucket_id = 'lead-files'
