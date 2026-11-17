-- =====================================================================
-- permisos_tienda.sql   (paso 2 de 3 del rol "Gestor de tienda")
-- Quién puede administrar la tienda y cómo se cambian el stock y los pedidos.
--
-- Personal de tienda = rol "admin" o rol "gestor_tienda". Solo ellos pueden:
--   - leer todos los productos (también los inactivos), crearlos, editarlos y borrarlos;
--   - subir y borrar imágenes del bucket "productos" (ningún otro bucket);
--   - leer todos los pedidos y sus productos;
--   - ajustar el stock y cambiar el estado de los pedidos (con las funciones de abajo).
-- El gestor NO recibe ningún permiso sobre reparaciones, usuarios ni técnicos:
-- esas reglas siguen pidiendo rol_actual() = 'admin'.
--
-- La sección 7 (gestores) es solo para el administrador.
--
-- Requisitos: catalogo.sql, pedidos.sql y rol_gestor_tienda.sql ya ejecutados
-- (este último en un "Run" anterior, ver ese archivo).
-- Se puede ejecutar varias veces: reemplaza políticas y funciones sin borrar datos.
-- Es el único archivo que define estos permisos: catalogo.sql y pedidos.sql ya no
-- los tocan, así que volver a ejecutarlos no le quita el acceso al gestor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ¿El usuario de la sesión es personal de tienda?
-- Usa el rol real guardado en "perfiles" (rol_actual), nunca metadatos que el
-- usuario pueda editar. Se compara como texto para no depender del orden del enum.
-- ---------------------------------------------------------------------
create or replace function public.es_personal_tienda()
returns boolean
language sql
stable
set search_path = ''
as $$
    select coalesce(public.rol_actual()::text in ('admin', 'gestor_tienda'), false);
$$;

revoke execute on function public.es_personal_tienda() from public, anon;
grant execute on function public.es_personal_tienda() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Productos
-- El stock NO se puede escribir directamente: solo con ajustar_stock_producto,
-- fijar_stock_producto o al confirmar/cancelar pedidos. Así dos personas (o una
-- persona y un pedido) no se pisan el número.
-- ---------------------------------------------------------------------
revoke all on public.productos from anon, authenticated;
grant select, insert, delete on public.productos to authenticated;
grant update (nombre, descripcion, categoria, precio, imagen_ruta, imagenes_rutas, activo) on public.productos to authenticated;

drop policy if exists "productos_admin_select" on public.productos;
drop policy if exists "productos_admin_insert" on public.productos;
drop policy if exists "productos_admin_update" on public.productos;
drop policy if exists "productos_admin_delete" on public.productos;

drop policy if exists "productos_tienda_select" on public.productos;
create policy "productos_tienda_select"
on public.productos for select to authenticated
using (public.es_personal_tienda());

drop policy if exists "productos_tienda_insert" on public.productos;
create policy "productos_tienda_insert"
on public.productos for insert to authenticated
with check (public.es_personal_tienda());

drop policy if exists "productos_tienda_update" on public.productos;
create policy "productos_tienda_update"
on public.productos for update to authenticated
using (public.es_personal_tienda())
with check (public.es_personal_tienda());

drop policy if exists "productos_tienda_delete" on public.productos;
create policy "productos_tienda_delete"
on public.productos for delete to authenticated
using (public.es_personal_tienda());

-- Un producto que ya aparece en pedidos no se borra: se desactiva. Así el
-- historial conserva el enlace al producto, además de su nombre y precio.
create or replace function public.proteger_producto_con_pedidos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if exists (select 1 from public.pedido_items where producto_id = old.id) then
        raise exception 'No se puede borrar "%" porque aparece en pedidos registrados. Desactívalo para ocultarlo de la tienda sin perder el historial.', old.nombre;
    end if;
    return old;
end;
$$;

revoke execute on function public.proteger_producto_con_pedidos() from public, anon, authenticated;

drop trigger if exists trg_proteger_producto_con_pedidos on public.productos;
create trigger trg_proteger_producto_con_pedidos
before delete on public.productos
for each row execute function public.proteger_producto_con_pedidos();

-- ---------------------------------------------------------------------
-- 3. Imágenes de productos (solo el bucket "productos")
-- ---------------------------------------------------------------------
drop policy if exists "productos_storage_admin_select" on storage.objects;
drop policy if exists "productos_storage_admin_insert" on storage.objects;
drop policy if exists "productos_storage_admin_update" on storage.objects;
drop policy if exists "productos_storage_admin_delete" on storage.objects;

drop policy if exists "productos_storage_tienda_select" on storage.objects;
create policy "productos_storage_tienda_select"
on storage.objects for select to authenticated
using (bucket_id = 'productos' and public.es_personal_tienda());

drop policy if exists "productos_storage_tienda_insert" on storage.objects;
create policy "productos_storage_tienda_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'productos' and public.es_personal_tienda());

drop policy if exists "productos_storage_tienda_update" on storage.objects;
create policy "productos_storage_tienda_update"
on storage.objects for update to authenticated
using (bucket_id = 'productos' and public.es_personal_tienda())
with check (bucket_id = 'productos' and public.es_personal_tienda());

drop policy if exists "productos_storage_tienda_delete" on storage.objects;
create policy "productos_storage_tienda_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'productos' and public.es_personal_tienda());

-- ---------------------------------------------------------------------
-- 4. Lectura de pedidos
-- Las políticas con las que cada cliente lee sus propios pedidos (si existen)
-- no se tocan.
-- ---------------------------------------------------------------------
drop policy if exists "pedidos_admin_select" on public.pedidos;
drop policy if exists "pedidos_tienda_select" on public.pedidos;
create policy "pedidos_tienda_select"
on public.pedidos for select to authenticated
using (public.es_personal_tienda());

drop policy if exists "pedido_items_admin_select" on public.pedido_items;
drop policy if exists "pedido_items_tienda_select" on public.pedido_items;
create policy "pedido_items_tienda_select"
on public.pedido_items for select to authenticated
using (public.es_personal_tienda());

-- ---------------------------------------------------------------------
-- 5. Stock sin sobrescribir cambios de otros
-- ---------------------------------------------------------------------

-- Suma o resta unidades sobre el valor que haya en ese momento (botones + y -).
create or replace function public.ajustar_stock_producto(p_producto_id uuid, p_cambio integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_stock integer;
begin
    if not public.es_personal_tienda() then
        raise exception 'Solo el personal de la tienda puede cambiar el stock.';
    end if;

    if p_cambio is null or p_cambio = 0 or abs(p_cambio) > 10000 then
        raise exception 'El ajuste debe ser un número entero distinto de 0.';
    end if;

    -- Una sola sentencia: lee, valida y escribe a la vez, sin carreras.
    update public.productos
    set stock = stock + p_cambio
    where id = p_producto_id and stock + p_cambio >= 0
    returning stock into v_stock;

    if not found then
        if exists (select 1 from public.productos where id = p_producto_id) then
            raise exception 'No hay unidades suficientes para restar %.', abs(p_cambio);
        end if;
        raise exception 'No encontramos ese producto.';
    end if;

    return v_stock;
end;
$$;

-- Pone una cantidad exacta solo si nadie la cambió desde que se leyó (p_stock_anterior).
create or replace function public.fijar_stock_producto(p_producto_id uuid, p_stock integer, p_stock_anterior integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_actual integer;
begin
    if not public.es_personal_tienda() then
        raise exception 'Solo el personal de la tienda puede cambiar el stock.';
    end if;

    if p_stock is null or p_stock < 0 or p_stock > 1000000 then
        raise exception 'El stock debe ser un número entero, 0 o mayor.';
    end if;

    update public.productos
    set stock = p_stock
    where id = p_producto_id and stock = p_stock_anterior;

    if not found then
        select stock into v_actual from public.productos where id = p_producto_id;
        if not found then
            raise exception 'No encontramos ese producto.';
        end if;
        raise exception 'El stock cambió mientras lo editabas: ahora hay % unidades. Revisa la cantidad y vuelve a guardarla.', v_actual;
    end if;

    return p_stock;
end;
$$;

revoke execute on function public.ajustar_stock_producto(uuid, integer) from public, anon;
grant execute on function public.ajustar_stock_producto(uuid, integer) to authenticated;
revoke execute on function public.fijar_stock_producto(uuid, integer, integer) from public, anon;
grant execute on function public.fijar_stock_producto(uuid, integer, integer) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Cambiar el estado de un pedido
--   pendiente  → confirmado (descuenta stock) o cancelado (no toca stock)
--   confirmado → entregado (no vuelve a descontar) o cancelado (devuelve el stock)
--   entregado y cancelado son finales.
-- El pedido se bloquea con FOR UPDATE: si dos personas confirman a la vez, la
-- segunda espera, ve el pedido ya confirmado y no descuenta otra vez.
-- ---------------------------------------------------------------------
create or replace function public.cambiar_estado_pedido(p_pedido_id uuid, p_estado text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_estado text;
    v_linea record;
begin
    if not public.es_personal_tienda() then
        raise exception 'Solo el personal de la tienda puede cambiar el estado de un pedido.';
    end if;

    if p_estado is null or p_estado not in ('confirmado', 'entregado', 'cancelado') then
        raise exception 'Estado de pedido no válido.';
    end if;

    select estado into v_estado from public.pedidos where id = p_pedido_id for update;

    if not found then
        raise exception 'No encontramos ese pedido.';
    end if;

    -- Reintento del mismo cambio (doble clic, red lenta): ya está hecho, no se repite.
    if v_estado = p_estado then
        return;
    end if;

    if not (
        (v_estado = 'pendiente' and p_estado in ('confirmado', 'cancelado'))
        or (v_estado = 'confirmado' and p_estado in ('entregado', 'cancelado'))
    ) then
        raise exception 'No se puede pasar un pedido de % a %.', v_estado, p_estado;
    end if;

    if p_estado = 'confirmado' then
        -- Cantidades sumadas por producto y en orden fijo para evitar bloqueos cruzados.
        for v_linea in
            select producto_id, min(producto_nombre) as producto_nombre, sum(cantidad)::integer as cantidad
            from public.pedido_items
            where pedido_id = p_pedido_id and producto_id is not null
            group by producto_id
            order by producto_id
        loop
            update public.productos
            set stock = stock - v_linea.cantidad
            where id = v_linea.producto_id and stock >= v_linea.cantidad;

            if not found then
                raise exception 'No hay stock suficiente de % para confirmar el pedido.', v_linea.producto_nombre;
            end if;
        end loop;
    elsif p_estado = 'cancelado' and v_estado = 'confirmado' then
        -- Devuelve las unidades una sola vez: el pedido queda cancelado (estado final).
        update public.productos as producto
        set stock = producto.stock + lineas.cantidad
        from (
            select producto_id, sum(cantidad)::integer as cantidad
            from public.pedido_items
            where pedido_id = p_pedido_id and producto_id is not null
            group by producto_id
        ) as lineas
        where producto.id = lineas.producto_id;
    end if;

    update public.pedidos set estado = p_estado, actualizado_en = now() where id = p_pedido_id;
end;
$$;

revoke execute on function public.cambiar_estado_pedido(uuid, text) from public, anon;
grant execute on function public.cambiar_estado_pedido(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 7. Gestores de tienda (solo el administrador)
-- Las cuentas nuevas se crean desde el API ASP.NET con la API administrativa de
-- Supabase Auth (POST /api/gestores). Estas funciones listan, editan y dan o
-- quitan el rol. Nunca convierten a nadie en administrador ni tocan técnicos.
-- ---------------------------------------------------------------------
create or replace function public.listar_gestores_tienda()
returns table (id uuid, nombre text, telefono text, correo text, creado_en timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    if public.rol_actual() is distinct from 'admin' then
        raise exception 'Solo un administrador puede ver los gestores de tienda.';
    end if;

    return query
    select perfil.id, perfil.nombre, perfil.telefono, usuario.email::text, perfil.creado_en
    from public.perfiles as perfil
    join auth.users as usuario on usuario.id = perfil.id
    where perfil.rol = 'gestor_tienda'
    order by perfil.nombre;
end;
$$;

-- Da el rol a una cuenta que ya existe. Solo a clientes: un técnico o un administrador
-- no pierden su rol por error. Si ya es gestor, no hace nada.
create or replace function public.conceder_rol_gestor(p_correo text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_id uuid;
    v_rol text;
begin
    if public.rol_actual() is distinct from 'admin' then
        raise exception 'Solo un administrador puede dar el rol de gestor de tienda.';
    end if;

    select perfil.id, perfil.rol::text
    into v_id, v_rol
    from auth.users as usuario
    join public.perfiles as perfil on perfil.id = usuario.id
    where lower(usuario.email) = lower(btrim(coalesce(p_correo, '')));

    if not found then
        raise exception 'No hay ninguna cuenta con ese correo.';
    end if;

    if v_rol = 'gestor_tienda' then
        return v_id;
    end if;

    if v_rol <> 'cliente' then
        raise exception 'Esa cuenta tiene el rol %. Solo se puede convertir en gestor una cuenta de cliente.', v_rol;
    end if;

    update public.perfiles set rol = 'gestor_tienda' where id = v_id;
    return v_id;
end;
$$;

-- Devuelve la cuenta a "cliente". Como cada consulta revisa el rol en "perfiles",
-- pierde el acceso a la tienda en su siguiente operación aunque siga con la sesión abierta.
create or replace function public.retirar_rol_gestor(p_perfil_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if public.rol_actual() is distinct from 'admin' then
        raise exception 'Solo un administrador puede retirar el rol de gestor de tienda.';
    end if;

    update public.perfiles set rol = 'cliente' where id = p_perfil_id and rol = 'gestor_tienda';

    if not found then
        raise exception 'Esa cuenta no es un gestor de tienda.';
    end if;
end;
$$;

create or replace function public.actualizar_gestor(p_perfil_id uuid, p_nombre text, p_telefono text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if public.rol_actual() is distinct from 'admin' then
        raise exception 'Solo un administrador puede editar los gestores de tienda.';
    end if;

    if char_length(btrim(coalesce(p_nombre, ''))) < 3 then
        raise exception 'El nombre debe tener al menos 3 caracteres.';
    end if;

    update public.perfiles
    set nombre = btrim(p_nombre), telefono = nullif(btrim(coalesce(p_telefono, '')), '')
    where id = p_perfil_id and rol = 'gestor_tienda';

    if not found then
        raise exception 'Esa cuenta no es un gestor de tienda.';
    end if;
end;
$$;

revoke execute on function public.listar_gestores_tienda() from public, anon;
grant execute on function public.listar_gestores_tienda() to authenticated;
revoke execute on function public.conceder_rol_gestor(text) from public, anon;
grant execute on function public.conceder_rol_gestor(text) to authenticated;
revoke execute on function public.retirar_rol_gestor(uuid) from public, anon;
grant execute on function public.retirar_rol_gestor(uuid) to authenticated;
revoke execute on function public.actualizar_gestor(uuid, text, text) from public, anon;
grant execute on function public.actualizar_gestor(uuid, text, text) to authenticated;
