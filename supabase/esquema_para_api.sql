-- Diagnostico de solo lectura para construir la API ASP.NET de TecnoHouse.
-- Ejecutar en Supabase > SQL Editor y compartir los tres resultados.

-- Columnas y tipos de las tablas públicas.
select
    c.table_name,
    c.ordinal_position,
    c.column_name,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
from information_schema.columns as c
where c.table_schema = 'public'
  and c.table_name not like '\\_%'
order by c.table_name, c.ordinal_position;

-- Relaciones entre tablas (llaves foráneas).
select
    tc.table_name as tabla,
    kcu.column_name as columna,
    ccu.table_name as tabla_referenciada,
    ccu.column_name as columna_referenciada,
    rc.update_rule,
    rc.delete_rule
from information_schema.table_constraints as tc
join information_schema.key_column_usage as kcu
  on kcu.constraint_name = tc.constraint_name
 and kcu.constraint_schema = tc.constraint_schema
join information_schema.constraint_column_usage as ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.constraint_schema = tc.constraint_schema
join information_schema.referential_constraints as rc
  on rc.constraint_name = tc.constraint_name
 and rc.constraint_schema = tc.constraint_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.constraint_schema = 'public'
order by tc.table_name, kcu.ordinal_position;

-- Valores de los tipos enum usados por columnas públicas.
select
    t.typname as tipo_enum,
    e.enumsortorder as orden,
    e.enumlabel as valor
from pg_type as t
join pg_enum as e on e.enumtypid = t.oid
join pg_namespace as n on n.oid = t.typnamespace
where n.nspname = 'public'
order by t.typname, e.enumsortorder;
