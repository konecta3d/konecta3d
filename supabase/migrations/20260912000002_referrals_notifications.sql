-- ============================================================================
-- "Invita a un amigo" (referidos) + notificaciones del negocio.
--
-- referrals: cada vez que un cliente genera su enlace personal en la landing,
--   se crea una fila con su nombre y un id opaco (el token que viaja en la URL;
--   NUNCA el nombre, para no meter datos personales en el enlace).
-- leads.referral_id: cuando el amigo se capta, su lead queda atribuido al referido.
-- notifications: aviso al negocio ("X ha traído a un amigo") que se ve en su panel.
--
-- Acceso: todo pasa por rutas de servidor con service_role (que se salta RLS).
-- Por eso activamos RLS SIN políticas: el navegador/anon no accede directo a
-- estas tablas, y el servidor sí. Máxima seguridad, sin depender de funciones RLS.
-- ============================================================================

create table if not exists public.referrals (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid references public.businesses(id) on delete cascade,
  referrer_name text not null,
  created_at    timestamptz default now()
);

alter table public.leads
  add column if not exists referral_id uuid references public.referrals(id);

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid references public.businesses(id) on delete cascade,
  type         text not null default 'info',
  title        text not null,
  body         text,
  read         boolean default false,
  created_at   timestamptz default now()
);

create index if not exists notifications_business_idx
  on public.notifications (business_id, read, created_at desc);

-- RLS activado sin políticas: solo el servidor (service_role) accede a estas tablas.
alter table public.referrals enable row level security;
alter table public.notifications enable row level security;
