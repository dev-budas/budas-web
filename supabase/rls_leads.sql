-- ─── RLS policies for leads table ─────────────────────────────────────────────
-- Run this in Supabase SQL Editor.
-- The service role key (used by all API routes) bypasses these policies.
-- These act as a backstop for any direct authenticated or anon access.

-- SELECT: admins see all, agents see their own + unassigned
create policy "Agents and admins select leads"
  on leads for select to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or assigned_agent = auth.uid()::text
    or assigned_agent is null
  );

-- UPDATE: admins update all, agents update only their own leads
create policy "Agents and admins update leads"
  on leads for update to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or assigned_agent = auth.uid()::text
  );

-- INSERT: blocked for anon/authenticated — only service role (API routes) can insert
-- No insert policy needed: absence of policy = deny for non-service-role callers
