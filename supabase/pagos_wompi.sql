-- Registra el proveedor del intento de pago. En la tabla existente, pedido_id
-- puede ser NULL porque pagos también admite intentos asociados a cotizaciones.
-- Orden: pedidos.sql → pagos.sql → este archivo → pedidos_lectura_rls.sql
begin;

alter table public.pagos
  add column if not exists proveedor text not null default 'wompi';

-- Al aprobar un pago de pedido, confirma el pedido y descuenta inventario de
-- manera atómica. Si el inventario ya no alcanza o el pedido es terminal,
-- conserva el pago aprobado y deja una nota para revisión manual.
create or replace function public.pagos_confirmar_pedido()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
    v_estado_pedido text;
    v_linea record;
begin
    if new.estado = 'APPROVED'
       and new.pedido_id is not null then

        if tg_op = 'UPDATE' then
            if old.estado is not distinct from 'APPROVED' then
                return new;
            end if;
        end if;

        select p.estado::text
        into v_estado_pedido
        from public.pedidos as p
        where p.id = new.pedido_id
        for update;

        if not found then
            return new;
        end if;

        if v_estado_pedido = 'pendiente' then
            -- Bloquea cada producto en orden determinista para evitar carreras y deadlocks.
            for v_linea in
                select pr.id
                from public.productos as pr
                where exists (
                    select 1
                    from public.pedido_items as i
                    where i.pedido_id = new.pedido_id
                      and i.producto_id = pr.id
                )
                order by pr.id
                for update of pr
            loop
                null;
            end loop;

            -- Comprueba el total requerido por producto, incluso si hay líneas repetidas.
            for v_linea in
                select
                    i.producto_id,
                    sum(i.cantidad)::integer as cantidad,
                    min(i.producto_nombre) as producto_nombre,
                    pr.stock
                from public.pedido_items as i
                join public.productos as pr on pr.id = i.producto_id
                where i.pedido_id = new.pedido_id
                group by i.producto_id, pr.stock
                order by i.producto_id
            loop
                if v_linea.stock < v_linea.cantidad then
                    update public.pagos
                    set mensaje_estado = concat_ws(
                        ' | ',
                        nullif(mensaje_estado, ''),
                        format(
                            'Pago aprobado, pero falta inventario para %s; pedido pendiente para revisión manual.',
                            v_linea.producto_nombre
                        )
                    )
                    where id = new.id;

                    return new;
                end if;
            end loop;

            -- Las filas de productos siguen bloqueadas desde la comprobación.
            for v_linea in
                select
                    i.producto_id,
                    sum(i.cantidad)::integer as cantidad,
                    min(i.producto_nombre) as producto_nombre
                from public.pedido_items as i
                where i.pedido_id = new.pedido_id
                  and i.producto_id is not null
                group by i.producto_id
                order by i.producto_id
            loop
                update public.productos as pr
                set stock = pr.stock - v_linea.cantidad
                where pr.id = v_linea.producto_id
                  and pr.stock >= v_linea.cantidad;

                if not found then
                    raise exception
                      'El inventario cambió durante la confirmación del pedido para %.',
                      v_linea.producto_nombre;
                end if;
            end loop;

            update public.pedidos
            set estado = 'confirmado',
                actualizado_en = now()
            where id = new.pedido_id
              and estado = 'pendiente';

        elsif v_estado_pedido in ('cancelado', 'entregado') then
            update public.pagos
            set mensaje_estado = concat_ws(
                ' | ',
                nullif(mensaje_estado, ''),
                format(
                    'Pago aprobado cuando el pedido ya estaba %s; requiere revisión manual.',
                    v_estado_pedido
                )
            )
            where id = new.id;
        end if;
    end if;

    return new;
end;
$function$;

-- Ejecuta la función anterior cuando se crea un pago o cambia su estado. Antes este
-- trigger solo existía en la base; se versiona aquí para poder reproducirla.
-- Convive con cambiar_estado_pedido (permisos_tienda.sql): las dos bloquean el pedido y
-- solo descuentan stock al pasar de "pendiente" a "confirmado", así que nunca dos veces.
create or replace trigger pagos_confirma_pedido
after insert or update of estado on public.pagos
for each row execute function public.pagos_confirmar_pedido();

-- Permite iniciar pagos sin conceder INSERT general sobre pagos. La función debe
-- ejecutarse como el propietario (postgres), valida auth.uid(), dueño, estado y total.
create or replace function public.registrar_pago_wompi_pedido(
    p_pedido_id uuid,
    p_referencia text,
    p_monto_centavos bigint
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
    v_usuario_id uuid;
    v_estado text;
    v_total numeric;
    v_monto_centavos bigint;
    v_pago_id uuid;
begin
    if auth.uid() is null then
        raise exception using errcode = '42501', message = 'autenticacion_requerida';
    end if;

    if p_referencia is null or p_referencia !~ '^[A-Za-z0-9_-]{1,255}$' then
        raise exception using errcode = 'P1004', message = 'referencia_invalida';
    end if;

    select p.usuario_id, p.estado, p.total
      into v_usuario_id, v_estado, v_total
      from public.pedidos as p
     where p.id = p_pedido_id
     for update;

    if not found or v_usuario_id is distinct from auth.uid() then
        raise exception using errcode = 'P1001', message = 'pedido_no_encontrado';
    end if;

    if exists (
        select 1
          from public.pagos as pa
         where pa.pedido_id = p_pedido_id
           and pa.estado = 'APPROVED'::public.estado_pago
    ) then
        raise exception using errcode = 'P1002', message = 'pago_ya_aprobado';
    end if;

    if v_estado is distinct from 'pendiente' then
        raise exception using errcode = 'P1003', message = 'pedido_no_pagable';
    end if;

    if v_total <= 0 then
        raise exception using errcode = 'P1004', message = 'total_no_valido';
    end if;

    v_monto_centavos := round(v_total * 100)::bigint;
    if p_monto_centavos is distinct from v_monto_centavos or v_monto_centavos <= 0 then
        raise exception using errcode = 'P1004', message = 'monto_no_coincide';
    end if;

    insert into public.pagos (
        referencia,
        pedido_id,
        cliente_id,
        monto_centavos,
        moneda,
        estado,
        proveedor
    ) values (
        p_referencia,
        p_pedido_id,
        auth.uid(),
        v_monto_centavos,
        'COP',
        'PENDING'::public.estado_pago,
        'wompi'
    )
    returning id into v_pago_id;

    return v_pago_id;
end;
$function$;

-- El permiso se limita a ejecutar esta función; no habilita INSERT directo en pagos.
revoke all on function public.registrar_pago_wompi_pedido(uuid, text, bigint) from public;
grant execute on function public.registrar_pago_wompi_pedido(uuid, text, bigint) to authenticated;

commit;
