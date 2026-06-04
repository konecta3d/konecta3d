-- ─── Editor visual de landings ───────────────────────────────────────────────
-- Añade soporte para landings construidas por bloques (modo "visual"),
-- manteniendo el modo "code" (HTML a mano) para landings a medida.

alter table public.landing_pages add column if not exists blocks jsonb;
alter table public.landing_pages add column if not exists theme  jsonb;
alter table public.landing_pages add column if not exists mode   text not null default 'visual';

-- Las landings que ya existían se crearon a código → marcarlas como 'code'.
update public.landing_pages set mode = 'code' where blocks is null;
