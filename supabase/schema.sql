-- ─── Leads table ──────────────────────────────────────────────────────────────

create type lead_status as enum (
  'nuevo',
  'bot_enviado',
  'respondio',
  'calificado',
  'no_calificado',
  'en_seguimiento',
  'visita_agendada',
  'captado',
  'perdido'
);

create type property_type as enum (
  'piso',
  'casa',
  'chalet',
  'local_comercial',
  'terreno',
  'otro'
);

create type sell_urgency as enum (
  'inmediato',
  '3_meses',
  '6_meses',
  'sin_prisa'
);

create table leads (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- Contact
  name                 text not null,
  phone                text not null,
  email                text,

  -- Property
  property_type        property_type,
  property_address     text,
  property_city        text,
  estimated_value      numeric(12, 2),

  -- Qualification
  status               lead_status not null default 'nuevo',
  urgency              sell_urgency,
  has_mortgage         boolean,
  is_owner             boolean,
  notes                text,

  -- Attribution
  utm_source           text,
  utm_campaign         text,
  utm_medium           text,

  -- WhatsApp bot
  whatsapp_conversation jsonb default '[]'::jsonb,
  bot_qualified_at      timestamptz,
  assigned_agent        text
);

-- Trigger: keep updated_at in sync
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();

-- Indexes
create index leads_phone_idx on leads(phone);
create index leads_status_idx on leads(status);
create index leads_created_at_idx on leads(created_at desc);

-- RLS: Service role has full access, anon has none
alter table leads enable row level security;

-- Only server-side (service role) can read/write leads
-- No public policies — all access goes through API routes

-- ─── Comments ──────────────────────────────────────────────────────────────────
comment on table leads is 'Leads captados desde la landing page o formularios';
comment on column leads.whatsapp_conversation is 'Array de mensajes {id, role, content, timestamp}';
