create table if not exists campaign_state (
  id boolean primary key default true check (id),
  campaigns jsonb not null default '[]'::jsonb check (jsonb_typeof(campaigns) = 'array'),
  updated_at timestamptz not null default now()
);
