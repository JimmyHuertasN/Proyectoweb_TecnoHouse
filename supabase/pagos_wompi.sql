-- Registra el proveedor del intento de pago. En la tabla existente, pedido_id
-- puede ser NULL porque pagos también admite intentos asociados a cotizaciones.
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

commit;
