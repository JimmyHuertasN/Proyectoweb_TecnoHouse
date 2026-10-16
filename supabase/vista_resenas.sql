-- Vista pública de reseñas. Expone solo el nombre de pila, la puntuación,
-- el comentario y la fecha; nunca muestra identificadores ni datos de contacto.
-- Puede ejecutarse varias veces sin error.
create or replace view public.resenas_publicas
with (security_barrier = true)
as
select
    coalesce(nullif(split_part(btrim(perfil.nombre), ' ', 1), ''), 'Cliente') as nombre,
    calificacion.puntuacion,
    calificacion.comentario,
    calificacion.creado_en as fecha
from public.calificaciones as calificacion
join public.servicios as servicio on servicio.id = calificacion.servicio_id
join public.perfiles as perfil on perfil.id = servicio.cliente_id
where nullif(btrim(calificacion.comentario), '') is not null;

revoke all on public.resenas_publicas from public;
grant select on public.resenas_publicas to anon, authenticated;

comment on view public.resenas_publicas is
    'Reseñas públicas con nombre de pila, puntuación, comentario y fecha.';
