-- ============================================================================
-- Modo desarrollador (impersonación): acceso del admin a las tablas que el
-- navegador lee/escribe directamente y que aún NO conceden acceso admin en su RLS.
--
-- Sin esto, al "Entrar como el negocio" esas secciones cargan VACÍAS y GUARDAR
-- falla en silencio (RLS bloquea la escritura del admin, que no es el dueño).
--
-- La política solo depende de is_admin() (no de business_id), así que es segura y
-- no toca el acceso de los negocios normales (sus políticas de dueño siguen igual).
-- El servidor (service_role) y las rutas /api ya funcionaban aparte.
-- ============================================================================

-- Asegura is_admin() (idéntica a la de la migración de las 9 tablas)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select
    lower(coalesce(auth.jwt() ->> 'email','')) = 'info@konecta3d.com'
    or exists (select 1 from public.admins where lower(email) = lower(nullif(auth.jwt() ->> 'email','')));
$$;

-- Concede al admin acceso total (lectura y escritura) a estas tablas.
-- Es una política PERMISIVA adicional: se suma (OR) a las de dueño ya existentes.
do $$
declare t text;
begin
  foreach t in array array[
    'lead_magnets',
    'benefits',
    'gpt_context_answers',
    'gpt_context_questions',
    'analytics_events',
    'leads',
    'fidelizacion_forms',
    'fidelizacion_feedback',
    'action_links'
  ] loop
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists admin_all_%I on public.%I', t, t);
      execute format(
        'create policy admin_all_%I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
        t, t
      );
    end if;
  end loop;
end $$;
