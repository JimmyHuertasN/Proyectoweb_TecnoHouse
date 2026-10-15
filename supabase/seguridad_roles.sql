-- =====================================================================
-- seguridad_roles.sql
-- Impide que un usuario cambie su propio rol (por ejemplo, ponerse "admin").
--
-- La aplicación nunca envía el rol, pero cualquiera con la clave pública
-- podría llamar a la API de Supabase directamente. Este trigger lo bloquea
-- en la base de datos, sin importar cómo estén escritas las políticas RLS.
--
-- Quién SÍ puede cambiar roles:
--   - Un usuario con rol "admin" (desde la aplicación).
--   - El editor SQL de Supabase y la clave secreta (service_role).
--   - El registro de Supabase Auth (el trigger trg_crear_perfil).
--
-- Cómo usarlo: Supabase → SQL Editor → pegar este archivo → Run.
-- Se puede ejecutar varias veces sin problema.
-- =====================================================================

create or replace function public.proteger_rol_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    -- 'anon' o 'authenticated' = petición que viene desde el navegador.
    -- NULL = editor SQL o procesos internos de Supabase.
    rol_peticion text := coalesce(auth.role(), '');
    es_admin boolean;
begin
    if rol_peticion not in ('anon', 'authenticated') then
        return new;
    end if;

    select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin') into es_admin;

    if tg_op = 'INSERT' and new.rol <> 'cliente' and not es_admin then
        raise exception 'Solo un administrador puede crear usuarios con rol %.', new.rol;
    end if;

    if tg_op = 'UPDATE' and new.rol is distinct from old.rol and not es_admin then
        raise exception 'Solo un administrador puede cambiar el rol de un usuario.';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_proteger_rol on public.perfiles;

create trigger trg_proteger_rol
before insert or update on public.perfiles
for each row execute function public.proteger_rol_perfil();
