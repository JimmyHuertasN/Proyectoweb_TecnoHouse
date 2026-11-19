-- Permite a cada usuario autenticado leer sus pedidos y líneas, y a la API
-- consultar el estado de pago solo para pagos vinculados a esos pedidos.
-- Las políticas del personal de tienda (permisos_tienda.sql y pagos.sql) siguen
-- dando acceso al administrador y al gestor de tienda.
-- Orden: después de pagos.sql y pagos_wompi.sql.
begin;

alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.pagos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pedidos'
      and policyname = 'pedidos_usuario_select_api'
  ) then
    execute $policy$
      create policy pedidos_usuario_select_api
      on public.pedidos for select to authenticated
      using (usuario_id = (select auth.uid()))
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pedido_items'
      and policyname = 'pedido_items_usuario_select_api'
  ) then
    execute $policy$
      create policy pedido_items_usuario_select_api
      on public.pedido_items for select to authenticated
      using (
        exists (
          select 1
          from public.pedidos p
          where p.id = pedido_items.pedido_id
            and p.usuario_id = (select auth.uid())
        )
      )
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pagos'
      and policyname = 'pagos_pedido_usuario_select_api'
  ) then
    execute $policy$
      create policy pagos_pedido_usuario_select_api
      on public.pagos for select to authenticated
      using (
        pedido_id is not null
        and exists (
          select 1
          from public.pedidos p
          where p.id = pagos.pedido_id
            and p.usuario_id = (select auth.uid())
        )
      )
    $policy$;
  end if;
end
$$;

commit;
