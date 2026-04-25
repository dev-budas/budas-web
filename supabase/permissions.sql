-- ─── Role-level base permissions ───────────────────────────────────────────────

create table role_permissions (
  role            text primary key check (role in ('admin', 'agent')),
  see_all_leads   boolean not null default true,
  reassign_leads  boolean not null default false,
  delete_leads    boolean not null default false,
  view_stats      boolean not null default true,
  manage_pipeline boolean not null default false,
  updated_at      timestamptz not null default now()
);

-- Default values
insert into role_permissions (role, see_all_leads, reassign_leads, delete_leads, view_stats, manage_pipeline)
values
  ('admin', true, true, true, true, true),
  ('agent', true, false, false, true, false)
on conflict (role) do nothing;

-- RLS
alter table role_permissions enable row level security;

create policy "Authenticated read role permissions"
  on role_permissions for select to authenticated using (true);

create policy "Admins update role permissions"
  on role_permissions for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ─── Per-user permission overrides ─────────────────────────────────────────────
-- null on any column means "inherit from role_permissions"

create table user_permissions (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  see_all_leads   boolean,
  reassign_leads  boolean,
  delete_leads    boolean,
  view_stats      boolean,
  manage_pipeline boolean,
  updated_at      timestamptz not null default now()
);

-- RLS
alter table user_permissions enable row level security;

create policy "Authenticated read user permissions"
  on user_permissions for select to authenticated using (true);

create policy "Admins manage user permissions"
  on user_permissions for all to authenticated
  using   (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
