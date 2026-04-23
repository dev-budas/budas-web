-- ─── Profiles table ───────────────────────────────────────────────────────────

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null default 'agent' check (role in ('admin', 'agent')),
  created_at  timestamptz not null default now()
);

-- Auto-create profile when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'agent')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS on profiles
alter table profiles enable row level security;

create policy "Authenticated users can view all profiles"
  on profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on profiles for update to authenticated using (auth.uid() = id);

-- ─── RLS policies on leads ─────────────────────────────────────────────────────

-- All authenticated users can read all leads
create policy "Authenticated users can view all leads"
  on leads for select to authenticated using (true);

-- Admins can update any lead
create policy "Admins can update any lead"
  on leads for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Agents can only update leads assigned to them
create policy "Agents can update assigned leads"
  on leads for update to authenticated
  using (assigned_agent = auth.uid()::text);

-- Only admins can delete leads
create policy "Admins can delete leads"
  on leads for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
