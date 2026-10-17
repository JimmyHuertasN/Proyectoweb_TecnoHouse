-- =====================================================================
-- gravedad_categoria.sql
-- Separa gravedad y categoría del texto libre de servicios.problema.
-- Se puede ejecutar varias veces sin cambiar datos ya migrados o categorías elegidas.
-- Ejecutar en Supabase → SQL Editor.
-- =====================================================================

do $$
begin
    create type public.gravedad_servicio as enum ('baja', 'media', 'alta');
exception
    when duplicate_object then null;
end;
$$;

alter table public.servicios
    add column if not exists gravedad public.gravedad_servicio not null default 'media',
    add column if not exists categoria text;

-- Migra gravedad del prefijo histórico y lo elimina de la descripción.
update public.servicios
set
    gravedad = lower((regexp_match(problema, '^\[Gravedad: (baja|media|alta)\][[:space:]]*', 'i'))[1])::public.gravedad_servicio,
    problema = regexp_replace(problema, '^\[Gravedad: (baja|media|alta)\][[:space:]]*', '', 'i')
where problema ~* '^\[Gravedad: (baja|media|alta)\][[:space:]]*';

-- Completa categorías históricas a partir del mismo tipo de palabras clave usado
-- anteriormente en la aplicación. Las categorías ya asignadas se conservan.
with descripciones as (
    select
        id,
        translate(lower(coalesce(problema, '')), 'áéíóúüñ', 'aeiouun') as texto
    from public.servicios
    where categoria is null or btrim(categoria) not in (
        'Pantalla', 'No enciende', 'Batería y carga', 'Temperatura',
        'Conexión', 'Lectura de discos', 'Lentitud y software', 'Audio', 'Otros'
    )
), clasificadas as (
    select
        id,
        case
            when texto like '%pantalla%' or texto like '%display%' or texto like '%tactil%' or texto like '%touch%' or texto like '%vidrio%' then 'Pantalla'
            when texto like '%no enciende%' or texto like '%no prende%' or texto like '%no arranca%' then 'No enciende'
            when texto like '%bateria%' or texto like '%carga%' or texto like '%cargador%' then 'Batería y carga'
            when texto like '%calienta%' or texto like '%temperatura%' or texto like '%ventilador%' then 'Temperatura'
            when texto like '%control%' or texto like '%conecta%' or texto like '%conexion%' or texto like '%wifi%' or texto like '%bluetooth%' or texto like '%puerto%' or texto like '%usb%' then 'Conexión'
            when texto like '%disco%' or texto like '%lector%' or texto like '%lee%' then 'Lectura de discos'
            when texto like '%lento%' or texto like '%congela%' or texto like '%reinicia%' or texto like '%virus%' or texto like '%software%' or texto like '%sistema%' then 'Lentitud y software'
            when texto like '%audio%' or texto like '%sonido%' or texto like '%parlante%' or texto like '%microfono%' then 'Audio'
            else 'Otros'
        end as categoria
    from descripciones
)
update public.servicios as servicio
set categoria = clasificadas.categoria
from clasificadas
where servicio.id = clasificadas.id;

alter table public.servicios
    alter column gravedad set default 'media',
    alter column gravedad set not null,
    alter column categoria set not null;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.servicios'::regclass
          and conname = 'servicios_categoria_valida'
    ) then
        alter table public.servicios
            add constraint servicios_categoria_valida
            check (categoria in (
                'Pantalla', 'No enciende', 'Batería y carga', 'Temperatura',
                'Conexión', 'Lectura de discos', 'Lentitud y software', 'Audio', 'Otros'
            ));
    end if;
end;
$$;

comment on column public.servicios.gravedad is 'Nivel de gravedad de la falla: baja, media o alta.';
comment on column public.servicios.categoria is 'Categoría del problema seleccionada por el cliente.';
