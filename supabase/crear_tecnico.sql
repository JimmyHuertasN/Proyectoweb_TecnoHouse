-- =====================================================================
-- crear_tecnico.sql
-- Función para que el administrador cree técnicos desde la aplicación.
--
-- Crea la cuenta de Supabase Auth ya confirmada (sin enviar correo), le pone
-- el rol "tecnico" y guarda su especialidad, todo en un solo paso: si algo
-- falla, no se guarda nada.
--
-- Cómo usarlo: Supabase → SQL Editor → pegar este archivo → Run.
-- Se puede ejecutar varias veces: reemplaza la función si ya existe.
-- =====================================================================

create or replace function public.crear_tecnico(
    p_nombre text,
    p_correo text,
    p_telefono text,
    p_especialidad text,
    p_contrasena text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_id uuid := gen_random_uuid();
    v_correo text := lower(trim(p_correo));
begin
    if public.rol_actual() is distinct from 'admin' then
        raise exception 'Solo un administrador puede crear técnicos.';
    end if;

    if length(trim(coalesce(p_nombre, ''))) < 3 then
        raise exception 'El nombre debe tener al menos 3 caracteres.';
    end if;

    if trim(coalesce(p_especialidad, '')) = '' then
        raise exception 'Escribe la especialidad del técnico.';
    end if;

    if length(coalesce(p_contrasena, '')) < 8 then
        raise exception 'La contraseña debe tener al menos 8 caracteres.';
    end if;

    if exists (select 1 from auth.users where email = v_correo) then
        raise exception 'Ese correo ya tiene una cuenta.';
    end if;

    -- Cuenta ya confirmada. El trigger de auth.users crea su fila en "perfiles" con rol "cliente".
    insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
    )
    values (
        '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_correo,
        extensions.crypt(p_contrasena, extensions.gen_salt('bf')), now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('nombre', trim(p_nombre), 'telefono', trim(p_telefono)),
        now(), now(), '', '', '', ''
    );

    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
        v_id::text, v_id,
        jsonb_build_object('sub', v_id::text, 'email', v_correo, 'email_verified', true),
        'email', now(), now(), now()
    );

    -- Al cambiar el rol, el trigger crear_fila_tecnico crea su fila en "tecnicos".
    update public.perfiles set rol = 'tecnico' where id = v_id;
    update public.tecnicos set especialidad = trim(p_especialidad) where perfil_id = v_id;

    return v_id;
end;
$$;

-- Solo los usuarios con sesión pueden llamarla (y adentro se verifica que sea admin).
revoke execute on function public.crear_tecnico(text, text, text, text, text) from public, anon;
grant execute on function public.crear_tecnico(text, text, text, text, text) to authenticated;
