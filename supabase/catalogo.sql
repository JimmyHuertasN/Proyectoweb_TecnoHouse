-- =====================================================================
-- catalogo.sql
-- Catálogo de productos y repuestos: tabla, vista pública, bucket de imágenes
-- y reglas de seguridad (RLS).
--
-- Quién puede qué:
--   - Visitante sin sesión (anon):  leer productos_activos.
--   - Cliente o técnico:            leer productos_activos. No pueden escribir.
--   - Administrador:                leer, crear, editar y borrar en productos
--                                   y subir o borrar imágenes del bucket.
--
-- Requiere la función public.rol_actual() que ya existe en el proyecto
-- (la usan fotos_servicio.sql, mensajes_servicio.sql y crear_tecnico.sql).
--
-- Cómo usarlo: Supabase → SQL Editor → pegar este archivo → Run.
-- Se puede ejecutar varias veces sin error y sin borrar los productos que ya
-- existan. Para reiniciar el catálogo desde cero en DESARROLLO, ejecuta antes:
--   drop table if exists public.productos cascade;
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabla
-- ---------------------------------------------------------------------
create table if not exists public.productos (
    id uuid primary key default gen_random_uuid(),
    nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
    descripcion text not null default '' check (char_length(descripcion) <= 1000),
    categoria text not null check (char_length(btrim(categoria)) between 1 and 60),
    precio numeric(12, 2) not null check (precio >= 0),
    stock integer not null default 0 check (stock >= 0),
    imagen_ruta text,
    activo boolean not null default true,
    creado_en timestamptz not null default now()
);

comment on table public.productos is 'Catálogo de productos y repuestos. El público solo ve los activos, a través de productos_activos.';
comment on column public.productos.imagen_ruta is 'Ruta del archivo dentro del bucket "productos" de Storage.';

alter table public.productos enable row level security;

-- Supabase da permisos por defecto a anon y authenticated: se quitan y se dejan solo los necesarios.
revoke all on public.productos from anon, authenticated;
grant select, insert, update, delete on public.productos to authenticated;

drop policy if exists "productos_admin_select" on public.productos;
create policy "productos_admin_select"
on public.productos for select to authenticated
using (public.rol_actual() = 'admin');

drop policy if exists "productos_admin_insert" on public.productos;
create policy "productos_admin_insert"
on public.productos for insert to authenticated
with check (public.rol_actual() = 'admin');

drop policy if exists "productos_admin_update" on public.productos;
create policy "productos_admin_update"
on public.productos for update to authenticated
using (public.rol_actual() = 'admin')
with check (public.rol_actual() = 'admin');

drop policy if exists "productos_admin_delete" on public.productos;
create policy "productos_admin_delete"
on public.productos for delete to authenticated
using (public.rol_actual() = 'admin');

-- ---------------------------------------------------------------------
-- 2. Vista pública: solo los productos activos
-- La vista se ejecuta con los permisos de su dueño, por eso anon puede leerla
-- aunque no tenga acceso a la tabla productos.
-- ---------------------------------------------------------------------
create or replace view public.productos_activos
with (security_barrier = true)
as
select id, nombre, descripcion, categoria, precio, stock, imagen_ruta, creado_en
from public.productos
where activo;

revoke all on public.productos_activos from public, anon, authenticated;
grant select on public.productos_activos to anon, authenticated;

comment on view public.productos_activos is 'Productos del catálogo con activo = true. Es lo único que leen visitantes, clientes y técnicos.';

-- ---------------------------------------------------------------------
-- 3. Storage: bucket público para leer imágenes
-- Cualquiera puede ver una imagen si conoce su URL; solo el administrador sube,
-- cambia o borra archivos.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "productos_storage_admin_select" on storage.objects;
create policy "productos_storage_admin_select"
on storage.objects for select to authenticated
using (bucket_id = 'productos' and public.rol_actual() = 'admin');

drop policy if exists "productos_storage_admin_insert" on storage.objects;
create policy "productos_storage_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'productos' and public.rol_actual() = 'admin');

drop policy if exists "productos_storage_admin_update" on storage.objects;
create policy "productos_storage_admin_update"
on storage.objects for update to authenticated
using (bucket_id = 'productos' and public.rol_actual() = 'admin')
with check (bucket_id = 'productos' and public.rol_actual() = 'admin');

drop policy if exists "productos_storage_admin_delete" on storage.objects;
create policy "productos_storage_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'productos' and public.rol_actual() = 'admin');

-- ---------------------------------------------------------------------
-- 4. Datos de ejemplo (8 productos)
-- Son solo para probar: las rutas de imagen no existen en Storage, así que
-- el catálogo muestra un ícono hasta que el administrador suba una foto real.
-- Borra este bloque si no quieres productos de ejemplo.
-- Los ids son fijos para que volver a ejecutar el script no los duplique.
-- ---------------------------------------------------------------------
insert into public.productos (id, nombre, descripcion, categoria, precio, stock, imagen_ruta, activo)
values
    ('a1000000-0000-4000-8000-000000000001', 'Pantalla Samsung Galaxy A52', 'Pantalla AMOLED de repuesto con marco, compatible con A52 y A52s. Incluye instalación en taller.', 'Pantallas', 285000, 6, 'ejemplo/pantalla-samsung-a52.jpg', true),
    ('a1000000-0000-4000-8000-000000000002', 'Pantalla iPhone 11', 'Pantalla LCD de alta calidad con touch y marco. Garantía de 3 meses por defectos de fábrica.', 'Pantallas', 320000, 4, 'ejemplo/pantalla-iphone-11.jpg', true),
    ('a1000000-0000-4000-8000-000000000003', 'Pantalla Xiaomi Redmi Note 10', 'Pantalla AMOLED con digitalizador para Redmi Note 10 y Note 10S.', 'Pantallas', 190000, 8, 'ejemplo/pantalla-redmi-note-10.jpg', true),
    ('a1000000-0000-4000-8000-000000000004', 'Batería iPhone 11', 'Batería de 3110 mAh con circuito de protección. Reemplazo con calibración incluida.', 'Baterías', 95000, 12, 'ejemplo/bateria-iphone-11.jpg', true),
    ('a1000000-0000-4000-8000-000000000005', 'Batería Samsung Galaxy A12', 'Batería de 5000 mAh para Galaxy A12 y A02s. Larga duración y carga estable.', 'Baterías', 65000, 15, 'ejemplo/bateria-samsung-a12.jpg', true),
    ('a1000000-0000-4000-8000-000000000006', 'Cargador USB-C 25W', 'Cargador de pared de carga rápida con puerto USB-C, compatible con la mayoría de celulares Android.', 'Cargadores', 45000, 20, 'ejemplo/cargador-usb-c-25w.jpg', true),
    ('a1000000-0000-4000-8000-000000000007', 'Cargador universal para portátil 65W', 'Cargador para portátil con puntas intercambiables. Protección contra sobrecalentamiento y cortocircuito.', 'Cargadores', 89000, 7, 'ejemplo/cargador-portatil-65w.jpg', true),
    ('a1000000-0000-4000-8000-000000000008', 'Kit de herramientas de reparación 24 piezas', 'Destornilladores de precisión, espátulas y ventosa para abrir celulares, tablets y consolas.', 'Otros', 38000, 0, 'ejemplo/kit-herramientas-24.jpg', true)
on conflict (id) do nothing;
