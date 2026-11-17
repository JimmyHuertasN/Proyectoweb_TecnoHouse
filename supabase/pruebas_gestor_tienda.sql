-- =====================================================================
-- pruebas_gestor_tienda.sql
-- Verifica permisos del gestor de tienda, transiciones de pedidos y stock.
-- SOLO PARA DESARROLLO, con las cuentas de datos_prueba.sql y gestor_prueba.sql.
--
-- Simula cada rol dentro de la base: cambia a "authenticated" y pone el id
-- del usuario en el JWT, igual que hacen Supabase y el API. Crea un producto y
-- pedidos de prueba y los borra al final. Si algo falla de forma inesperada, el
-- editor deshace todo el bloque. El resultado es una tabla con cada prueba y si pasó.
-- Nota: cada pedido de prueba usa un número; esos números no se reutilizan.
-- =====================================================================

create temporary table resultados (paso serial, prueba text, paso_bien boolean, detalle text) on commit drop;
grant insert, select on resultados to authenticated;
grant usage on sequence resultados_paso_seq to authenticated;

-- Actúa como el usuario indicado (null = vuelve al usuario del editor SQL).
create function pg_temp.como(p_usuario uuid) returns void language plpgsql as $$
begin
    if p_usuario is null then
        perform set_config('role', 'none', true);
        perform set_config('request.jwt.claims', '', true);
        perform set_config('request.jwt.claim.sub', '', true);
        return;
    end if;
    perform set_config('request.jwt.claims', json_build_object('sub', p_usuario, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', p_usuario::text, true);
    perform set_config('role', 'authenticated', true);
end;
$$;

create function pg_temp.anotar(p_prueba text, p_bien boolean, p_detalle text default '') returns void language sql as $$
    insert into resultados (prueba, paso_bien, detalle) values (p_prueba, p_bien, p_detalle);
$$;

-- Ejecuta una sentencia que DEBE fallar. Anota si falló y con qué mensaje.
create function pg_temp.debe_fallar(p_prueba text, p_sql text) returns void language plpgsql as $$
begin
    execute p_sql;
    perform pg_temp.anotar(p_prueba, false, 'No falló');
exception when others then
    perform pg_temp.anotar(p_prueba, true, sqlerrm);
end;
$$;

-- Cuántas filas devuelve una consulta para el usuario actual.
create function pg_temp.contar(p_sql text) returns bigint language plpgsql as $$
declare v bigint;
begin
    execute format('select count(*) from (%s) as consulta', p_sql) into v;
    return v;
end;
$$;

do $$
declare
    admin   constant uuid := 'a0000000-0000-4000-8000-000000000001';
    tecnico constant uuid := 'b0000000-0000-4000-8000-000000000001';
    cliente constant uuid := 'c0000000-0000-4000-8000-000000000001';
    gestor  uuid;
    producto constant uuid := 'e0000000-0000-4000-8000-0000000000aa';
    pedido_a uuid; pedido_b uuid; pedido_c uuid; pedido_d uuid;
    quien text;
    stock integer;
    estado text;
    entrega constant text[] := array['Calle 1 # 2-3', 'Valledupar', 'Cesar', 'CO', '3001234567'];
begin
    select id into gestor from auth.users where email = 'gestor.tienda@tecnohouse.test';
    if gestor is null or (select rol::text from public.perfiles where id = gestor) <> 'gestor_tienda' then
        raise exception 'Falta la cuenta gestor.tienda@tecnohouse.test con rol gestor_tienda (ejecuta gestor_prueba.sql).';
    end if;

    insert into public.productos (id, nombre, categoria, precio, stock, activo)
    values (producto, 'Producto de prueba del gestor', 'Otros', 10000, 5, true);

    -- 1. Crear pedidos (cliente): quedan pendientes y no tocan el stock.
    perform pg_temp.como(cliente);
    pedido_a := (public.crear_pedido('María López', '3104444444', '', jsonb_build_array(jsonb_build_object('producto_id', producto, 'cantidad', 3)), entrega[1], entrega[2], entrega[3], entrega[4], entrega[5]) ->> 'id')::uuid;
    pedido_b := (public.crear_pedido('María López', '3104444444', '', jsonb_build_array(jsonb_build_object('producto_id', producto, 'cantidad', 2)), entrega[1], entrega[2], entrega[3], entrega[4], entrega[5]) ->> 'id')::uuid;
    pedido_c := (public.crear_pedido('María López', '3104444444', '', jsonb_build_array(jsonb_build_object('producto_id', producto, 'cantidad', 4)), entrega[1], entrega[2], entrega[3], entrega[4], entrega[5]) ->> 'id')::uuid;
    perform pg_temp.como(null);
    select p.stock into stock from public.productos p where id = producto;
    perform pg_temp.anotar('Crear pedidos pendientes no descuenta stock', stock = 5, format('stock = %s', stock));

    -- 2. Cliente y técnico no administran la tienda.
    foreach quien in array array['Cliente', 'Técnico'] loop
        perform pg_temp.como(case quien when 'Cliente' then cliente else tecnico end);
        perform pg_temp.debe_fallar(format('%s no puede cambiar el estado de un pedido', quien), format('select public.cambiar_estado_pedido(%L, %L)', pedido_a, 'confirmado'));
        perform pg_temp.debe_fallar(format('%s no puede ajustar stock', quien), format('select public.ajustar_stock_producto(%L, 1)', producto));
        perform pg_temp.anotar(format('%s no lee la tabla completa de productos', quien), pg_temp.contar('select 1 from public.productos') = 0);
        perform pg_temp.debe_fallar(format('%s no puede listar gestores', quien), 'select * from public.listar_gestores_tienda()');
        perform pg_temp.como(null);
    end loop;

    -- 3. Lo que el gestor sí puede hacer.
    perform pg_temp.como(gestor);
    perform pg_temp.anotar('Gestor lee todos los productos', pg_temp.contar('select 1 from public.productos') >= 1);
    perform pg_temp.anotar('Gestor lee todos los pedidos', pg_temp.contar(format('select 1 from public.pedidos where id in (%L, %L, %L)', pedido_a, pedido_b, pedido_c)) = 3);
    perform pg_temp.anotar('Gestor ajusta stock (+2)', public.ajustar_stock_producto(producto, 2) = 7);
    perform pg_temp.debe_fallar('Gestor no puede restar más unidades de las que hay', format('select public.ajustar_stock_producto(%L, -100)', producto));
    perform pg_temp.anotar('Gestor fija stock con el valor que veía (7 → 9)', public.fijar_stock_producto(producto, 9, 7) = 9);
    perform pg_temp.debe_fallar('Fijar stock con un valor viejo se rechaza (otro lo cambió)', format('select public.fijar_stock_producto(%L, 4, 7)', producto));
    perform pg_temp.debe_fallar('El stock no se puede escribir directamente', format('update public.productos set stock = 100 where id = %L', producto));
    update public.productos set nombre = 'Producto de prueba del gestor (editado)' where id = producto;
    perform pg_temp.anotar('Gestor edita datos del producto', found);

    -- 4. Transiciones de pedidos.
    perform public.cambiar_estado_pedido(pedido_a, 'confirmado');
    select p.stock into stock from public.productos p where id = producto;
    perform pg_temp.anotar('Confirmar descuenta stock (9 - 3)', stock = 6, format('stock = %s', stock));
    perform public.cambiar_estado_pedido(pedido_a, 'confirmado');
    select p.stock into stock from public.productos p where id = producto;
    perform pg_temp.anotar('Repetir la confirmación no descuenta otra vez', stock = 6, format('stock = %s', stock));
    perform public.cambiar_estado_pedido(pedido_a, 'entregado');
    select p.stock into stock from public.productos p where id = producto;
    perform pg_temp.anotar('Entregar no vuelve a descontar', stock = 6, format('stock = %s', stock));
    perform pg_temp.debe_fallar('Entregado es final: no se puede cancelar', format('select public.cambiar_estado_pedido(%L, %L)', pedido_a, 'cancelado'));

    perform public.cambiar_estado_pedido(pedido_b, 'cancelado');
    select p.stock into stock from public.productos p where id = producto;
    perform pg_temp.anotar('Cancelar un pendiente no toca el stock', stock = 6, format('stock = %s', stock));
    perform pg_temp.debe_fallar('Cancelado es final: no se puede confirmar', format('select public.cambiar_estado_pedido(%L, %L)', pedido_b, 'confirmado'));

    perform public.cambiar_estado_pedido(pedido_c, 'confirmado');
    perform public.cambiar_estado_pedido(pedido_c, 'cancelado');
    perform public.cambiar_estado_pedido(pedido_c, 'cancelado');
    select p.stock into stock from public.productos p where id = producto;
    perform pg_temp.anotar('Cancelar un confirmado devuelve las unidades una sola vez', stock = 6, format('stock = %s', stock));

    -- 5. Stock insuficiente al confirmar: el pedido sigue pendiente y el stock no cambia.
    perform pg_temp.como(cliente);
    pedido_d := (public.crear_pedido('María López', '3104444444', '', jsonb_build_array(jsonb_build_object('producto_id', producto, 'cantidad', 5)), entrega[1], entrega[2], entrega[3], entrega[4], entrega[5]) ->> 'id')::uuid;
    perform pg_temp.como(gestor);
    perform public.fijar_stock_producto(producto, 2, 6);
    perform pg_temp.debe_fallar('No se confirma un pedido sin stock suficiente', format('select public.cambiar_estado_pedido(%L, %L)', pedido_d, 'confirmado'));
    select p.estado into estado from public.pedidos p where id = pedido_d;
    select p.stock into stock from public.productos p where id = producto;
    perform pg_temp.anotar('Tras el rechazo el pedido sigue pendiente y el stock igual', estado = 'pendiente' and stock = 2, format('%s, stock = %s', estado, stock));

    -- 6. Borrar un producto con pedidos se rechaza.
    perform pg_temp.debe_fallar('No se borra un producto que aparece en pedidos', format('delete from public.productos where id = %L', producto));

    -- 7. Lo que el gestor no puede hacer.
    perform pg_temp.anotar('Gestor no ve servicios', pg_temp.contar('select 1 from public.servicios') = 0);
    perform pg_temp.anotar('Gestor no ve dispositivos', pg_temp.contar('select 1 from public.dispositivos') = 0);
    perform pg_temp.anotar('Gestor no ve diagnósticos ni cotizaciones', pg_temp.contar('select 1 from public.diagnosticos union all select 1 from public.cotizaciones') = 0);
    perform pg_temp.anotar('Gestor no ve mensajes de servicios', pg_temp.contar('select 1 from public.mensajes_servicio') = 0);
    perform pg_temp.anotar('Gestor no ve perfiles de clientes', pg_temp.contar('select 1 from public.perfiles where rol = ''cliente''') = 0);
    perform pg_temp.debe_fallar('Gestor no puede listar gestores', 'select * from public.listar_gestores_tienda()');
    perform pg_temp.debe_fallar('Gestor no puede dar el rol de gestor', 'select public.conceder_rol_gestor(''maria.lopez@tecnohouse.test'')');
    perform pg_temp.debe_fallar('Gestor no puede cambiarse el rol', format('update public.perfiles set rol = ''admin'' where id = %L', gestor));
    update public.perfiles set telefono = telefono where id = gestor;
    perform pg_temp.anotar('Gestor puede editar sus propios datos', found);
    perform pg_temp.como(null);

    -- 8. El administrador conserva la tienda y administra gestores.
    perform pg_temp.como(admin);
    perform pg_temp.anotar('Admin sigue viendo productos y pedidos', pg_temp.contar('select 1 from public.productos') >= 1 and pg_temp.contar('select 1 from public.pedidos') >= 1);
    perform pg_temp.anotar('Admin lista gestores', pg_temp.contar('select * from public.listar_gestores_tienda()') >= 1);
    perform pg_temp.debe_fallar('No se puede dar el rol de gestor a un técnico', 'select public.conceder_rol_gestor(''ana.torres@tecnohouse.test'')');
    perform public.retirar_rol_gestor(gestor);
    perform pg_temp.como(gestor);
    perform pg_temp.debe_fallar('Sin el rol, la misma sesión pierde la tienda en la siguiente operación', format('select public.ajustar_stock_producto(%L, 1)', producto));
    perform pg_temp.como(admin);
    perform pg_temp.anotar('Admin devuelve el rol de gestor', public.conceder_rol_gestor('gestor.tienda@tecnohouse.test') = gestor);
    perform pg_temp.como(null);

    -- Limpieza: primero los pedidos (el producto no se puede borrar mientras aparezca en ellos).
    delete from public.pedidos where id in (pedido_a, pedido_b, pedido_c, pedido_d);
    delete from public.productos where id = producto;
end;
$$;

select paso, prueba, paso_bien, detalle from resultados order by paso;
