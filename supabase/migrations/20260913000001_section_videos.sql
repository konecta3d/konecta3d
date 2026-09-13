-- Vídeos tutoriales por SECCIÓN (fuera de los pasos de Landing/Recursos).
-- Permite poner un botón "Vídeo tutorial" en cualquier pantalla del panel
-- (contexto, formularios, campañas, clientes, captación…). Cada sección puede
-- tener una lista de vídeos. Lectura pública (contenido de ayuda); escritura solo
-- desde el servidor con service role (ruta admin).
create table if not exists public.section_videos (
  id          uuid primary key default gen_random_uuid(),
  section_key text not null,
  title       text not null,
  video_url   text not null,
  sort_order  integer not null default 0,
  enabled     boolean not null default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists section_videos_key_idx
  on public.section_videos (section_key, sort_order);

alter table public.section_videos enable row level security;

drop policy if exists leer_section_videos on public.section_videos;
create policy leer_section_videos on public.section_videos for select using (true);

drop policy if exists service_role_section_videos on public.section_videos;
create policy service_role_section_videos on public.section_videos for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
