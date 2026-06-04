-- ─── Landings de presentación ────────────────────────────────────────────────
-- Páginas HTML autónomas que el admin crea, sube como código y comparte por link
-- público (/p/[slug]). Independientes de las landings de llaveros (/l/[slug]) y
-- de las campañas de captación (/c/[slug]).

create table if not exists public.landing_pages (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  html        text not null default '',
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists landing_pages_slug_idx on public.landing_pages (slug);

-- RLS: solo el service role (admin server-side) gestiona y lee estas páginas.
-- La ruta pública /p/[slug] usa service role, así que no hace falta política
-- de lectura anónima.
alter table public.landing_pages enable row level security;

drop policy if exists landing_pages_service_all on public.landing_pages;
create policy landing_pages_service_all
  on public.landing_pages
  for all
  to service_role
  using (true)
  with check (true);
