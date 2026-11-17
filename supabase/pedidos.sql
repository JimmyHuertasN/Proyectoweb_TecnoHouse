-- =====================================================================
-- pedidos.sql
-- Pedidos de la tienda: tablas, índices y la función que registra un pedido.
--
-- Este archivo no estaba en el repositorio. Se reconstruyó el 2026-11-16 a
-- partir de la base de Supabase del proyecto, con consultas de solo lectura
-- (columnas, restricciones, índices y definición de las funciones), para que
-- una base nueva quede igual a la que ya está en uso.
--
-- Reglas del flujo:
--   - Crear un pedido lo deja "pendiente" y NO descuenta existencias.
--   - Los precios y nombres se copian del catálogo al crear el pedido, así el
--     historial no cambia aunque después se edite o se borre el producto.
--   - Los cambios de estado (confirmar, entregar, cancelar) y quién puede
--     hacerlos están en permisos_tienda.sql (función cambiar_estado_pedido).
--
-- Orden: catalogo.sql → pedidos.sql → rol_gestor_tienda.sql → permisos_tienda.sql
-- Se puede ejecutar varias veces: no borra pedidos existentes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------
create table if not exists public.pedidos (
    id uuid primary key default gen_random_uuid(),
    numero bigint generated always as identity,
    -- Cuenta que hizo el pedido. Queda en null si después se borra la cuenta.
    usuario_id uuid references auth.users (id) on delete set null,
    cliente_nombre text not null check (char_length(btrim(cliente_nombre)) between 2 and 120),
    cliente_telefono text not null check (char_length(btrim(cliente_telefono)) between 7 and 20),
    notas text not null default '' check (char_length(notas) <= 500),
    direccion_entrega text,
    ciudad_entrega text,
    departamento_entrega text,
    pais_entrega text default 'CO',
    telefono_receptor text,
    estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmado', 'entregado', 'cancelado')),
    total numeric(12, 2) not null default 0 check (total >= 0),
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create table if not exists public.pedido_items (
    id uuid primary key default gen_random_uuid(),
    pedido_id uuid not null references public.pedidos (id) on delete cascade,
    -- Si el producto se borra, la línea conserva su nombre y precio históricos.
    producto_id uuid references public.productos (id) on delete set null,
    producto_nombre text not null,
    cantidad integer not null check (cantidad between 1 and 1000),
    precio_unitario numeric(12, 2) not null check (precio_unitario >= 0)
);

create index if not exists pedidos_estado_fecha_idx on public.pedidos (estado, creado_en desc);
create index if not exists pedido_items_pedido_idx on public.pedido_items (pedido_id);

comment on table public.pedidos is 'Pedidos del carrito de la tienda. El estado lo cambia cambiar_estado_pedido (permisos_tienda.sql).';
comment on table public.pedido_items is 'Productos de cada pedido con el nombre y el precio que tenían al comprarse.';

-- Las tablas solo se leen con RLS; nadie escribe en ellas directamente, solo las funciones.
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;

revoke all on public.pedidos, public.pedido_items from anon, authenticated;
grant select on public.pedidos, public.pedido_items to authenticated;

-- ---------------------------------------------------------------------
-- 2. Registrar un pedido
-- El servidor toma precio y nombre del catálogo vigente: el navegador solo
-- envía qué productos y cuántas unidades, nunca precios ni totales.
-- ---------------------------------------------------------------------
create or replace function public.crear_pedido(
    p_nombre text,
    p_telefono text,
    p_notas text,
    p_items jsonb,
    p_direccion_entrega text,
    p_ciudad_entrega text,
    p_departamento_entrega text,
    p_pais_entrega text,
    p_telefono_receptor text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_id uuid := gen_random_uuid();
    v_numero bigint;
    v_total numeric(12, 2) := 0;
    v_linea record;
    v_producto record;
    v_usuario_id uuid := auth.uid();
    v_pais text := upper(btrim(coalesce(p_pais_entrega, 'CO')));
begin
    if v_usuario_id is null then
        raise exception 'Debes iniciar sesión para crear un pedido.';
    end if;

    if char_length(btrim(coalesce(p_nombre, ''))) < 2 then
        raise exception 'Escribe tu nombre.';
    end if;

    if char_length(btrim(coalesce(p_telefono, ''))) < 7 then
        raise exception 'Escribe un teléfono válido.';
    end if;

    if char_length(btrim(coalesce(p_direccion_entrega, ''))) < 1 then
        raise exception 'Escribe la dirección de entrega.';
    end if;

    if char_length(btrim(coalesce(p_ciudad_entrega, ''))) < 1 then
        raise exception 'Escribe la ciudad de entrega.';
    end if;

    if char_length(btrim(coalesce(p_departamento_entrega, ''))) < 1 then
        raise exception 'Escribe el departamento de entrega.';
    end if;

    if char_length(v_pais) < 1 then
        raise exception 'Escribe el país de entrega.';
    end if;

    if char_length(btrim(coalesce(p_telefono_receptor, ''))) < 7 then
        raise exception 'Escribe un teléfono válido para quien recibe.';
    end if;

    if p_items is null or jsonb_typeof(p_items) <> 'array'
       or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
        raise exception 'El pedido debe tener entre 1 y 30 productos.';
    end if;

    insert into public.pedidos (
        id, usuario_id, cliente_nombre, cliente_telefono, notas,
        direccion_entrega, ciudad_entrega, departamento_entrega,
        pais_entrega, telefono_receptor
    )
    values (
        v_id, v_usuario_id, btrim(p_nombre), btrim(p_telefono),
        left(btrim(coalesce(p_notas, '')), 500),
        btrim(p_direccion_entrega), btrim(p_ciudad_entrega),
        btrim(p_departamento_entrega), v_pais, btrim(p_telefono_receptor)
    )
    returning numero into v_numero;

    -- Si un producto viene repetido, se suman sus cantidades.
    for v_linea in
        select (item ->> 'producto_id')::uuid as producto_id,
               sum((item ->> 'cantidad')::integer) as cantidad
        from jsonb_array_elements(p_items) as item
        group by 1
        order by 1
    loop
        select id, nombre, precio, stock
        into v_producto
        from public.productos
        where id = v_linea.producto_id and activo;

        if not found then
            raise exception 'Uno de los productos ya no está disponible.';
        end if;

        if v_linea.cantidad < 1 or v_linea.cantidad > v_producto.stock then
            raise exception 'No hay stock suficiente de %.', v_producto.nombre;
        end if;

        insert into public.pedido_items (
            pedido_id, producto_id, producto_nombre, cantidad, precio_unitario
        )
        values (
            v_id, v_producto.id, v_producto.nombre,
            v_linea.cantidad, v_producto.precio
        );

        v_total := v_total + v_producto.precio * v_linea.cantidad;
    end loop;

    update public.pedidos set total = v_total where id = v_id;

    return jsonb_build_object('id', v_id, 'numero', v_numero, 'total', v_total);
end;
$$;

revoke execute on function public.crear_pedido(text, text, text, jsonb, text, text, text, text, text) from public;
grant execute on function public.crear_pedido(text, text, text, jsonb, text, text, text, text, text) to anon, authenticated;

-- La firma anterior (sin datos de entrega) quedó deshabilitada en la base: se conserva para
-- que una llamada vieja reciba un mensaje claro en vez de crear un pedido incompleto.
create or replace function public.crear_pedido(p_nombre text, p_telefono text, p_notas text, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
    raise exception 'Esta firma ya no está habilitada. Usa crear_pedido con los datos de entrega.';
end;
$$;

revoke execute on function public.crear_pedido(text, text, text, jsonb) from public;
grant execute on function public.crear_pedido(text, text, text, jsonb) to anon, authenticated;
