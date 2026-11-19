-- =====================================================================
-- gestor_prueba.sql   (paso 3 de 3 del rol "Gestor de tienda")
-- Crea SOLO la cuenta de prueba del gestor de tienda en una base de
-- DESARROLLO que ya tiene datos, sin volver a cargar datos_prueba.sql.
--
--   Correo:      gestor.tienda@tecnohouse.test
--   Contraseña:  TecnoHouse2026 (la misma de las demás cuentas de prueba)
--   Rol:         gestor_tienda
--
-- Se puede ejecutar varias veces:
--   - Busca la cuenta por correo. Si ya existe, NO cambia su contraseña ni su id.
--   - Solo le da el rol si la cuenta es "cliente"; si tiene otro rol, avisa y no la toca.
--   - La deja confirmada para poder entrar sin recibir correos (el dominio .test no existe).
--
-- Requiere rol_gestor_tienda.sql ejecutado antes (en otro "Run").
-- =====================================================================

do $$
declare
    v_correo constant text := 'gestor.tienda@tecnohouse.test';
    v_nombre constant text := 'Gestor de Tienda TecnoHouse';
    v_telefono constant text := '304 666 6666';
    v_id uuid;
    v_rol text;
begin
    select id into v_id from auth.users where lower(email) = v_correo;

    if v_id is null then
        -- Id fijo, el mismo que usa datos_prueba.sql, para no duplicar la cuenta.
        v_id := 'd0000000-0000-4000-8000-000000000001';

        insert into auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token, email_change_token_new, email_change
        )
        values (
            '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_correo,
            extensions.crypt('TecnoHouse2026', extensions.gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            jsonb_build_object('nombre', v_nombre, 'telefono', v_telefono),
            now(), now(), '', '', '', ''
        );

        insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        values (
            v_id::text, v_id,
            jsonb_build_object('sub', v_id::text, 'email', v_correo, 'email_verified', true),
            'email', now(), now(), now()
        );

        raise notice 'Se creó la cuenta %.', v_correo;
    else
        update auth.users set email_confirmed_at = now() where id = v_id and email_confirmed_at is null;
        raise notice 'La cuenta % ya existía: se conservó su contraseña.', v_correo;
    end if;

    -- El trigger de auth.users normalmente ya creó el perfil; esto lo asegura.
    insert into public.perfiles (id, nombre, telefono)
    values (v_id, v_nombre, v_telefono)
    on conflict (id) do nothing;

    select rol::text into v_rol from public.perfiles where id = v_id;

    if v_rol = 'cliente' then
        update public.perfiles set rol = 'gestor_tienda' where id = v_id;
        raise notice 'La cuenta % ahora es gestor de tienda.', v_correo;
    elsif v_rol <> 'gestor_tienda' then
        raise notice 'La cuenta % tiene el rol %; no se cambió.', v_correo, v_rol;
    end if;
end;
$$;
