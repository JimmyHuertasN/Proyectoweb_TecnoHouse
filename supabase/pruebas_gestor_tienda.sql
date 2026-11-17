-- =====================================================================
-- pruebas_gestor_tienda.sql
-- Verifica permisos del gestor de tienda, transiciones de pedidos, pagos y stock.
-- SOLO PARA DESARROLLO, con las cuentas de datos_prueba.sql y gestor_prueba.sql.
-- Necesita también pagos.sql, pagos_wompi.sql y pedidos_lectura_rls.sql.
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

-- Pedido de prueba del usuario actual con un producto y una cantidad.
create function pg_temp.nuevo_pedido(p_producto uuid, p_cantidad integer) returns uuid language plpgsql as $$
begin
    return (public.crear_pedido('María López', '3104444444', '', jsonb_build_array(jsonb_build_object('producto_id', p_producto, 'cantidad', p_cantidad)),
        'Calle 1 # 2-3', 'Valledupar', 'Cesar', 'CO', '3001234567') ->> 'id')::uuid;
end;
$$;

-- Intento de pago Wompi del pedido, como lo registra el API (monto = total en centavos).
create function pg_temp.iniciar_pago(p_pedido uuid) returns uuid language plpgsql as $$
begin
    return public.registrar_pago_wompi_pedido(p_pedido, 'PRUEBA-' || replace(gen_random_uuid()::text, '-', ''),
        (select round(total * 100)::bigint from public.pedidos where id = p_pedido));
end;
$$;

-- Lo que hace el API al recibir el webhook o la consulta de respaldo: PENDING → APPROVED una sola vez.
create function pg_temp.aprobar(p_pago uuid) returns void language sql as $$
    update public.pagos set estado = 'APPROVED', finalizado_en = now() where id = p_pago and estado = 'PENDING';
$$;

do $$
declare
    admin   constant uuid := 'a0000000-0000-4000-8000-000000000001';
    tecnico constant uuid := 'b0000000-0000-4000-8000-000000000001';
    cliente constant uuid := 'c0000000-0000-4000-8000-000000000001';
    gestor  uuid;
    producto constant uuid := 'e0000000-0000-4000-8000-0000000000aa';
    pedido_a uuid; pedido_b uuid; pedido_c uuid; pedido_d uuid;
    pedido_e uuid; pedido_f uuid; pedido_g uuid; pedido_h uuid; pedido_i uuid;
    pago_e uuid; pago_f uuid; pago_g uuid; pago_h uuid; pago_i uuid;
    estado_pago text;
    mensaje text;
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

    -- 9. Pagos de Wompi. El editor SQL hace de API: cambia el estado del pago y el
    --    trigger pagos_confirma_pedido confirma el pedido y descuenta el stock.
    update public.productos set stock = 10 where id = producto;
    perform pg_temp.como(cliente);
    pedido_e := pg_temp.nuevo_pedido(producto, 2); pago_e := pg_temp.iniciar_pago(pedido_e);
    pedido_f := pg_temp.nuevo_pedido(producto, 3); pago_f := pg_temp.iniciar_pago(pedido_f);
    pedido_g := pg_temp.nuevo_pedido(producto, 4); pago_g := pg_temp.iniciar_pago(pedido_g);
    pedido_h := pg_temp.nuevo_pedido(producto, 4); pago_h := pg_temp.iniciar_pago(pedido_h);
    pedido_i := pg_temp.nuevo_pedido(producto, 1); pago_i := pg_temp.iniciar_pago(pedido_i);
    perform pg_temp.debe_fallar('Cliente no puede aprobar su propio pago', format('update public.pagos set estado = ''APPROVED'' where id = %L', pago_e));

    perform pg_temp.como(gestor);
    perform pg_temp.anotar('Gestor ve el pago de un pedido', pg_temp.contar(format('select 1 from public.pagos where id = %L', pago_e)) = 1);
    perform pg_temp.anotar('Gestor no ve pagos de cotizaciones', pg_temp.contar('select 1 from public.pagos where cotizacion_id is not null') = 0);
    perform pg_temp.anotar('Gestor no ve los eventos de Wompi', pg_temp.contar('select 1 from public.wompi_eventos') = 0);
    perform pg_temp.debe_fallar('Gestor no puede aprobar ni modificar pagos', format('update public.pagos set estado = ''APPROVED'' where id = %L', pago_e));
    perform pg_temp.debe_fallar('Gestor no puede crear pagos', format('insert into public.pagos (referencia, pedido_id, monto_centavos) values (''PRUEBA-GESTOR'', %L, 100)', pedido_e));
    perform pg_temp.debe_fallar('Gestor no puede iniciar el pago de un pedido ajeno', format('select pg_temp.iniciar_pago(%L)', pedido_e));
    perform pg_temp.como(null);

    -- Pago aprobado: confirma y descuenta una vez, aunque el aviso llegue repetido.
    perform pg_temp.aprobar(pago_e);
    select p.estado into estado from public.pedidos p where id = pedido_e;
    select p.stock into stock from public.productos p where id = producto;
    perform pg_temp.anotar('Pago aprobado confirma el pedido y descuenta stock (10 - 2)', estado = 'confirmado' and stock = 8, format('%s, stock = %s', estado, stock));
    perform pg_temp.aprobar(pago_e);
    update public.pagos set estado = 'APPROVED' where id = pago_e;
    select p.stock into stock from public.productos p where id = producto;
    perform pg_temp.anotar('Repetir el webhook o la consulta no descuenta otra vez', stock = 8, format('stock = %s', stock));
    perform pg_temp.como(gestor);
    perform public.cambiar_estado_pedido(pedido_e, 'confirmado');
    perform public.cambiar_estado_pedido(pedido_e, 'entregado');
    perform pg_temp.como(null);
    select p.estado into estado from public.pedidos p where id = pedido_e;
    select p.stock into stock from public.productos p where id = producto;
    perform pg_temp.anotar('Confirmar a mano un pedido ya pagado y entregarlo no descuenta otra vez', estado = 'entregado' and stock = 8, format('%s, stock = %s', estado, stock));

    -- Confirmación manual primero y el pago aprobado después.
    perform pg_temp.como(gestor);
    perform public.cambiar_estado_pedido(pedido_f, 'confirmado');
    perform pg_temp.como(null);
    perform pg_temp.aprobar(pago_f);
    select p.estado into estado from public.pedidos p where id = pedido_f;
    select p.stock into stock from public.productos p where id = producto;
    perform pg_temp.anotar('Confirmar a mano y recibir después el pago descuenta una sola vez (8 - 3)', estado = 'confirmado' and stock = 5, format('%s, stock = %s', estado, stock));
    perform pg_temp.como(cliente);
    perform pg_temp.debe_fallar('No se puede iniciar otro pago de un pedido ya pagado', format('select pg_temp.iniciar_pago(%L)', pedido_f));
    perform pg_temp.como(null);

    -- Cancelar un pedido pagado devuelve unidades, pero el pago sigue aprobado (no es un reembolso).
    perform pg_temp.aprobar(pago_g);
    perform pg_temp.como(gestor);
    perform public.cambiar_estado_pedido(pedido_g, 'cancelado');
    perform public.cambiar_estado_pedido(pedido_g, 'cancelado');
    perform pg_temp.como(null);
    select p.stock into stock from public.productos p where id = producto;
    select pa.estado::text into estado_pago from public.pagos pa where id = pago_g;
    perform pg_temp.anotar('Cancelar un pedido pagado devuelve las unidades una vez y el pago no cambia', stock = 5 and estado_pago = 'APPROVED', format('stock = %s, pago %s', stock, estado_pago));

    -- Pago aprobado sin inventario: el pedido espera revisión y el pago se conserva.
    update public.productos set stock = 2 where id = producto;
    perform pg_temp.aprobar(pago_h);
    select p.estado into estado from public.pedidos p where id = pedido_h;
    select p.stock into stock from public.productos p where id = producto;
    select pa.estado::text, pa.mensaje_estado into estado_pago, mensaje from public.pagos pa where id = pago_h;
    perform pg_temp.anotar('Pago aprobado sin stock: el pedido sigue pendiente y el stock igual', estado = 'pendiente' and stock = 2, format('%s, stock = %s', estado, stock));
    perform pg_temp.anotar('Ese pago queda aprobado y con la incidencia anotada', estado_pago = 'APPROVED' and mensaje like '%falta inventario%', coalesce(mensaje, 'sin mensaje'));

    -- Pago aprobado de un pedido que ya se había cancelado.
    perform pg_temp.como(gestor);
    perform public.cambiar_estado_pedido(pedido_i, 'cancelado');
    perform pg_temp.como(null);
    perform pg_temp.aprobar(pago_i);
    select p.estado into estado from public.pedidos p where id = pedido_i;
    select p.stock into stock from public.productos p where id = producto;
    select pa.mensaje_estado into mensaje from public.pagos pa where id = pago_i;
    perform pg_temp.anotar('Pago aprobado de un pedido cancelado no descuenta y queda para revisión', estado = 'cancelado' and stock = 2 and mensaje like '%revisión manual%', coalesce(mensaje, 'sin mensaje'));

    -- Limpieza: primero los pagos y los pedidos (el producto no se puede borrar mientras aparezca en ellos).
    delete from public.pagos where pedido_id in (pedido_e, pedido_f, pedido_g, pedido_h, pedido_i);
    delete from public.pedidos where id in (pedido_a, pedido_b, pedido_c, pedido_d, pedido_e, pedido_f, pedido_g, pedido_h, pedido_i);
    delete from public.productos where id = producto;
end;
$$;

select paso, prueba, paso_bien, detalle from resultados order by paso;
