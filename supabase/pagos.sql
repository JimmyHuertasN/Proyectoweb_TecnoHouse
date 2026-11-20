-- =====================================================================
-- pagos.sql
-- Pagos en línea (Wompi): tablas "pagos" y "wompi_eventos" y quién puede leerlas.
--
-- Este archivo no estaba en el repositorio. Se reconstruyó el 2026-11-17 a
-- partir de la base de Supabase del proyecto, con consultas de solo lectura
-- (columnas, restricciones, índices, triggers y políticas), para que una base
-- nueva quede igual a la que ya está en uso.
--
-- Reglas:
--   - Nadie escribe en estas tablas desde el navegador. Los intentos se crean con
--     registrar_pago_wompi_pedido y los estados los cambia el API (webhook y
--     consulta de respaldo), ambos en pagos_wompi.sql y en el backend.
--   - El administrador ve todos los pagos. El gestor de tienda ve solo los pagos
--     de pedidos (no los de cotizaciones de reparación) y no puede modificarlos.
--   - Los eventos de Wompi (wompi_eventos) solo los ve el administrador.
--
-- Orden: ... → permisos_tienda.sql → pagos.sql → pagos_wompi.sql → pedidos_lectura_rls.sql
-- Se puede ejecutar varias veces: no borra pagos ni eventos.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Tipo y tablas
-- ---------------------------------------------------------------------
do $$
begin
    if not exists (select 1 from pg_type where typname = 'estado_pago' and typnamespace = 'public'::regnamespace) then
        create type public.estado_pago as enum ('PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR');
    end if;
end;
$$;

-- Un pago pertenece a un pedido de la tienda o a una cotización, nunca a los dos.
create table if not exists public.pagos (
    id uuid primary key default gen_random_uuid(),
    referencia text not null unique,
    pedido_id uuid references public.pedidos (id),
    cotizacion_id bigint references public.cotizaciones (id),
    cliente_id uuid references public.perfiles (id),
    monto_centavos bigint not null check (monto_centavos > 0),
    moneda text not null default 'COP',
    estado public.estado_pago not null default 'PENDING',
    proveedor text not null default 'wompi',
    wompi_ultima_consulta_en timestamptz,
    wompi_transaction_id text unique,
    metodo_pago text,
    mensaje_estado text,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    finalizado_en timestamptz,
    constraint pagos_un_solo_origen check (num_nonnulls(pedido_id, cotizacion_id) = 1)
);

-- Cada evento recibido por el webhook; el checksum único evita procesarlo dos veces.
create table if not exists public.wompi_eventos (
    id bigint generated always as identity primary key,
    evento text not null,
    wompi_transaction_id text,
    referencia text,
    checksum text not null unique,
    payload jsonb not null,
    procesado boolean not null default false,
    error text,
    recibido_en timestamptz not null default now()
);

create index if not exists pagos_pedido_id_idx on public.pagos (pedido_id);
create index if not exists pagos_cotizacion_id_idx on public.pagos (cotizacion_id);
create index if not exists pagos_cliente_id_idx on public.pagos (cliente_id);
create index if not exists pagos_estado_idx on public.pagos (estado);
create index if not exists pagos_wompi_pendientes_revision_idx
    on public.pagos (wompi_ultima_consulta_en asc nulls first, creado_en, id)
    where estado = 'PENDING'::public.estado_pago and proveedor = 'wompi';
create index if not exists wompi_eventos_referencia_idx on public.wompi_eventos (referencia);
create index if not exists wompi_eventos_transaccion_idx on public.wompi_eventos (wompi_transaction_id);

create or replace function public.pagos_set_actualizado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.actualizado_en = now();
    return new;
end;
$$;

create or replace trigger pagos_actualizado
before update on public.pagos
for each row execute function public.pagos_set_actualizado();

-- El trigger que confirma el pedido al aprobarse el pago está en pagos_wompi.sql,
-- junto a su función.

-- ---------------------------------------------------------------------
-- 2. Permisos
-- Solo lectura con RLS. Escribir queda para las funciones y el API.
-- ---------------------------------------------------------------------
alter table public.pagos enable row level security;
alter table public.wompi_eventos enable row level security;

revoke all on public.pagos, public.wompi_eventos from anon, authenticated;
grant select on public.pagos, public.wompi_eventos to authenticated;

drop policy if exists "pagos: admin ve todo" on public.pagos;
create policy "pagos: admin ve todo" on public.pagos
    for select to authenticated
    using (public.rol_actual() = 'admin');

drop policy if exists "pagos: cliente ve los suyos" on public.pagos;
create policy "pagos: cliente ve los suyos" on public.pagos
    for select to authenticated
    using (cliente_id = (select auth.uid()));

-- El gestor necesita el estado del pago para atender pedidos; nada de cotizaciones.
drop policy if exists pagos_tienda_select on public.pagos;
create policy pagos_tienda_select on public.pagos
    for select to authenticated
    using (pedido_id is not null and public.es_personal_tienda());

drop policy if exists "wompi_eventos: admin ve todo" on public.wompi_eventos;
create policy "wompi_eventos: admin ve todo" on public.wompi_eventos
    for select to authenticated
    using (public.rol_actual() = 'admin');

commit;
