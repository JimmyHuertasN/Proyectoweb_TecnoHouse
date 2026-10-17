-- =====================================================================
-- datos_prueba.sql
-- Usuarios, dispositivos y servicios de ejemplo para probar la aplicación.
-- SOLO PARA DESARROLLO: no ejecutarlo en una base de datos con usuarios reales.
--
-- Cómo usarlo: Supabase → SQL Editor → pegar este archivo → Run.
-- Se puede ejecutar varias veces: si los datos ya existen, no los duplica.
--
-- Todas las cuentas usan la contraseña:  TecnoHouse2026
--
--   Rol       Correo                       Para probar
--   admin     admin@tecnohouse.test        Panel del administrador
--   tecnico   ana.torres@tecnohouse.test   Celulares (disponible)
--   tecnico   carlos.rojas@tecnohouse.test Computadores (disponible)
--   tecnico   laura.mendez@tecnohouse.test Consolas (no disponible)
--   cliente   maria.lopez@tecnohouse.test  Cotización pendiente, solicitud sin técnico
--   cliente   pedro.gomez@tecnohouse.test  Servicio en reparación y uno ya calificado
-- =====================================================================

-- Crea una cuenta de Supabase Auth ya confirmada (sin enviar correo) y su perfil.
create or replace function pg_temp.crear_usuario_prueba(p_id uuid, p_correo text, p_nombre text, p_telefono text)
returns void
language plpgsql
as $$
begin
    insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
    )
    values (
        '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_correo,
        extensions.crypt('TecnoHouse2026', extensions.gen_salt('bf')), now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('nombre', p_nombre, 'telefono', p_telefono),
        now(), now(), '', '', '', ''
    )
    on conflict (id) do nothing;

    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
        p_id::text, p_id,
        jsonb_build_object('sub', p_id::text, 'email', p_correo, 'email_verified', true),
        'email', now(), now(), now()
    )
    on conflict (provider_id, provider) do nothing;

    -- El trigger trg_crear_perfil normalmente ya creó el perfil; esto lo asegura.
    insert into public.perfiles (id, nombre, telefono)
    values (p_id, p_nombre, p_telefono)
    on conflict (id) do update set nombre = excluded.nombre, telefono = excluded.telefono;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. Usuarios
-- ---------------------------------------------------------------------
select pg_temp.crear_usuario_prueba('a0000000-0000-4000-8000-000000000001', 'admin@tecnohouse.test', 'Administrador TecnoHouse', '300 000 0000');
select pg_temp.crear_usuario_prueba('b0000000-0000-4000-8000-000000000001', 'ana.torres@tecnohouse.test', 'Ana Torres', '301 111 1111');
select pg_temp.crear_usuario_prueba('b0000000-0000-4000-8000-000000000002', 'carlos.rojas@tecnohouse.test', 'Carlos Rojas', '302 222 2222');
select pg_temp.crear_usuario_prueba('b0000000-0000-4000-8000-000000000003', 'laura.mendez@tecnohouse.test', 'Laura Méndez', '303 333 3333');
select pg_temp.crear_usuario_prueba('c0000000-0000-4000-8000-000000000001', 'maria.lopez@tecnohouse.test', 'María López', '310 444 4444');
select pg_temp.crear_usuario_prueba('c0000000-0000-4000-8000-000000000002', 'pedro.gomez@tecnohouse.test', 'Pedro Gómez', '311 555 5555');

-- ---------------------------------------------------------------------
-- 2. Roles (el admin y los técnicos se asignan aquí, nunca desde el registro)
-- ---------------------------------------------------------------------
update public.perfiles set rol = 'admin' where id = 'a0000000-0000-4000-8000-000000000001';
update public.perfiles set rol = 'tecnico'
where id in ('b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003');

insert into public.tecnicos (perfil_id, especialidad, disponible, calificacion_promedio)
values
    ('b0000000-0000-4000-8000-000000000001', 'Reparación de Celulares', true, 4.8),
    ('b0000000-0000-4000-8000-000000000002', 'Reparación de Computadoras y Laptops', true, 5.0),
    ('b0000000-0000-4000-8000-000000000003', 'Mantenimiento de Consolas de Videojuegos', false, 4.5)
on conflict (perfil_id) do update
set especialidad = excluded.especialidad, disponible = excluded.disponible, calificacion_promedio = excluded.calificacion_promedio;

-- ---------------------------------------------------------------------
-- 3. Dispositivos, servicios, diagnósticos, cotizaciones y calificaciones
-- ---------------------------------------------------------------------
do $$
declare
    maria  uuid := 'c0000000-0000-4000-8000-000000000001';
    pedro  uuid := 'c0000000-0000-4000-8000-000000000002';
    ana    uuid := 'b0000000-0000-4000-8000-000000000001';
    carlos uuid := 'b0000000-0000-4000-8000-000000000002';
    laura  uuid := 'b0000000-0000-4000-8000-000000000003';
    cel_maria bigint; pc_maria bigint; ps5_pedro bigint; cel_pedro bigint;
    servicio bigint; cotizacion bigint;
begin
    if exists (select 1 from public.dispositivos where cliente_id in (maria, pedro)) then
        raise notice 'Los datos de prueba ya existen; no se agregó nada.';
        return;
    end if;

    insert into public.dispositivos (cliente_id, tipo, marca, modelo, serial) values (maria, 'celular', 'Samsung', 'Galaxy A54', 'R58T1234567') returning id into cel_maria;
    insert into public.dispositivos (cliente_id, tipo, marca, modelo, serial) values (maria, 'computador', 'Lenovo', 'IdeaPad 3', 'PF3ABC12') returning id into pc_maria;
    insert into public.dispositivos (cliente_id, tipo, marca, modelo, serial) values (pedro, 'consola', 'Sony', 'PlayStation 5', null) returning id into ps5_pedro;
    insert into public.dispositivos (cliente_id, tipo, marca, modelo, serial) values (pedro, 'celular', 'Xiaomi', 'Redmi Note 12', null) returning id into cel_pedro;

    -- María: celular cotizado, esperando que ella apruebe o rechace la cotización.
    insert into public.servicios (cliente_id, dispositivo_id, tecnico_id, problema, gravedad, categoria, estado, creado_en)
    values (maria, cel_maria, ana, 'La pantalla se quedó en negro después de una caída, pero el celular vibra y suena.', 'alta', 'Pantalla', 'cotizado', now() - interval '5 days')
    returning id into servicio;
    insert into public.diagnosticos (servicio_id, hallazgos, recomendaciones, creado_en)
    values (servicio, 'El panel AMOLED está fracturado internamente; la placa funciona bien.', 'Cambiar la pantalla completa.', now() - interval '4 days');
    insert into public.cotizaciones (servicio_id, total, estado, creado_en) values (servicio, 350000, 'pendiente', now() - interval '3 days') returning id into cotizacion;
    insert into public.cotizacion_items (cotizacion_id, concepto, precio) values (cotizacion, 'Pantalla AMOLED original', 300000), (cotizacion, 'Mano de obra', 50000);

    -- María: portátil recién solicitado, todavía sin técnico (para que un técnico lo acepte).
    insert into public.servicios (cliente_id, dispositivo_id, problema, gravedad, categoria, estado, creado_en)
    values (maria, pc_maria, 'Se calienta mucho y se apaga solo cuando abro varios programas.', 'media', 'Temperatura', 'solicitado', now() - interval '1 day');

    -- Pedro: PS5 en reparación, con la cotización ya aprobada.
    insert into public.servicios (cliente_id, dispositivo_id, tecnico_id, problema, gravedad, categoria, estado, creado_en)
    values (pedro, ps5_pedro, laura, 'No lee los discos y hace un ruido extraño al insertarlos.', 'media', 'Lectura de discos', 'en_reparacion', now() - interval '8 days')
    returning id into servicio;
    insert into public.diagnosticos (servicio_id, hallazgos, recomendaciones, creado_en)
    values (servicio, 'El lector óptico tiene el láser desgastado.', 'Reemplazar el lector y limpiar el sistema de ventilación.', now() - interval '7 days');
    insert into public.cotizaciones (servicio_id, total, estado, creado_en) values (servicio, 280000, 'aprobada', now() - interval '6 days') returning id into cotizacion;
    insert into public.cotizacion_items (cotizacion_id, concepto, precio) values (cotizacion, 'Lector óptico KEM-497', 200000), (cotizacion, 'Limpieza interna', 30000), (cotizacion, 'Mano de obra', 50000);

    -- Pedro: celular ya reparado y calificado.
    insert into public.servicios (cliente_id, dispositivo_id, tecnico_id, problema, gravedad, categoria, estado, creado_en)
    values (pedro, cel_pedro, ana, 'La batería dura muy poco, menos de medio día.', 'baja', 'Batería y carga', 'calificado', now() - interval '20 days')
    returning id into servicio;
    insert into public.diagnosticos (servicio_id, hallazgos, recomendaciones, creado_en)
    values (servicio, 'La batería está al 61 % de su capacidad original.', 'Cambiar la batería.', now() - interval '19 days');
    insert into public.cotizaciones (servicio_id, total, estado, creado_en) values (servicio, 120000, 'aprobada', now() - interval '19 days') returning id into cotizacion;
    insert into public.cotizacion_items (cotizacion_id, concepto, precio) values (cotizacion, 'Batería original 5000 mAh', 90000), (cotizacion, 'Mano de obra', 30000);
    insert into public.calificaciones (servicio_id, puntuacion, comentario, creado_en)
    values (servicio, 5, 'Muy rápida y amable. El celular quedó como nuevo.', now() - interval '15 days');

    -- María: portátil reparado antes, finalizado y todavía sin calificar (para probar "Calificar").
    insert into public.servicios (cliente_id, dispositivo_id, tecnico_id, problema, gravedad, categoria, estado, creado_en)
    values (maria, pc_maria, carlos, 'No enciende; solo parpadea la luz de carga.', 'alta', 'No enciende', 'finalizado', now() - interval '40 days');

    raise notice 'Datos de prueba creados.';
end;
$$;
