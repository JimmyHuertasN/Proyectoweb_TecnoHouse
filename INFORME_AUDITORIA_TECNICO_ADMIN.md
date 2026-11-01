# Auditoría de técnico y administrador

## Alcance y resultado

La revisión estática cubre las rutas protegidas, consultas de `src/api/`, componentes de acción, filtros/paginación, exportación CSV y scripts RLS disponibles en `supabase/`. No se hizo una prueba contra una instancia Supabase real, por lo que la existencia y estado de las funciones, políticas, triggers, buckets y tablas debe comprobarse en el proyecto conectado.

El recorrido de demo queda así:

1. Técnico: disponibilidad → solicitudes pendientes → tomar servicio → diagnóstico → cotización → espera de respuesta del cliente → reparación → finalización → chat y calificación posterior.
2. Administrador: métricas → clientes/técnicos/productos → servicios filtrados → detalle y reasignación → exportación de los resultados filtrados.

## Matriz de permisos

| Recurso/acción | Cliente | Técnico | Administrador | Control efectivo |
|---|---:|---:|---:|---|
| Ver sus solicitudes y detalle | Sí, propias | No | Sí, todas | Rutas + filtros por `cliente_id`/RLS |
| Ver pendientes sin técnico | No | Sí | Sí, desde servicios | `listarPendientes`, RLS |
| Tomar una solicitud | No | Sí | No | RPC `aceptar_servicio`; debe ser atómica |
| Cambiar disponibilidad propia | No | Sí | No | `tecnicos.perfil_id` + RLS |
| Diagnóstico y cotización | No | Sí, asignado | No | RLS de tablas relacionadas; estado validado por la UI/API |
| Avanzar estado operativo | No | Sí, asignado | No | `AVANCES_TECNICO` + update con estado actual + RLS |
| Aprobar/rechazar cotización y calificar | Sí, propia | No | No | RPC/insert y RLS |
| Leer/enviar chat | Propio servicio | Servicio asignado | Leer, solo lectura | RLS de `mensajes_servicio` |
| Fotos | Propio servicio | Servicio asignado | Leer | RLS y bucket |
| Reasignar técnico | No | No | Sí | Rol admin, técnico activo/disponible, servicio no final |
| Gestionar técnicos | No | No | Sí | RPC `crear_tecnico`, actualización de rol protegida por trigger/RLS |
| Gestionar productos | No | No | Sí | RLS de `productos` y bucket |
| Métricas, clientes y exportación | No | No | Sí | Ruta protegida + RLS |

La protección de rutas no sustituye RLS: un usuario puede llamar la API de Supabase directamente, así que las políticas y las funciones RPC son el control definitivo.

## Transiciones aceptadas

| Estado actual | Acción | Siguiente estado | Actor |
|---|---|---|---|
| `solicitado` | Tomar/asignar servicio | `asignado` | Técnico por RPC; administrador por reasignación |
| `asignado` | Iniciar diagnóstico | `en_diagnostico` | Técnico asignado |
| `en_diagnostico` | Guardar diagnóstico | Sin cambio | Técnico asignado |
| `en_diagnostico` | Crear cotización válida | `cotizado` | Técnico asignado |
| `cotizado` | Responder cotización | `aprobado` o `en_diagnostico` | Cliente propietario, mediante RPC |
| `aprobado` | Iniciar reparación | `en_reparacion` | Técnico asignado |
| `en_reparacion` | Marcar finalizado | `finalizado` | Técnico asignado |
| `finalizado` | Calificar | `calificado` | Cliente propietario |

No se aceptan saltos desde estados finales, avances del técnico desde `solicitado`, `cotizado` o `en_diagnostico`, ni reasignaciones de servicios `finalizado`/`calificado`. La UI solo presenta acciones del rol de la ruta y el update del técnico compara el estado leído con el estado guardado para evitar avances obsoletos.

## Hallazgos y correcciones aplicadas

- La reasignación administrativa ahora vuelve a verificar en la API que el destino tenga rol `tecnico`, ficha y disponibilidad. El selector también oculta técnicos activos pero no disponibles.
- Activar/desactivar un producto ahora requiere confirmación. El borrado ya tenía confirmación; la desactivación es reversible y se mantiene separada del borrado.
- El historial ya no convierte un error de Supabase al leer diagnósticos, cotizaciones o calificaciones en un historial vacío.
- La exportación y las listas administrativas conservan el mensaje traducido de Supabase cuando falla. La exportación usa `paginado.filtrados`, no solo la página visible.
- Los cambios de filtros llaman a `setPagina(1)` y el paginado también se ajusta si la lista disminuye.
- Los estados vacíos distinguen entre lista sin registros y detalle no encontrado; los casos de error muestran aviso y navegación de regreso.

## Dependencias de Supabase que deben verificarse

- RPC `aceptar_servicio` debe comprobar sesión de técnico, estado `solicitado`, `tecnico_id is null` y asignación atómica.
- RPC `responder_cotizacion` debe comprobar cliente propietario, cotización pendiente y el estado permitido del servicio.
- Las políticas de `servicios`, `diagnosticos`, `cotizaciones`, `cotizacion_items`, `calificaciones`, `mensajes_servicio` y fotos deben coincidir con la matriz anterior.
- El trigger de notificaciones no debe permitir que una actualización del cliente o administrador salte estados. Esta auditoría no puede demostrarlo sin ejecutar consultas en Supabase.
- La desactivación de técnico depende del update de `perfiles.rol` protegido por `supabase/seguridad_roles.sql`; además la aplicación impide desactivar técnicos con servicios en curso.

## Casos manuales de aceptación

1. Con dos técnicos, ambos ven una solicitud pendiente; el primero que confirma la toma la obtiene y el segundo recibe el error de carrera sin duplicar asignación.
2. Un técnico toma un servicio, registra diagnóstico, cotiza, y no vuelve a ver el formulario de diagnóstico/cotización cuando el estado ya cambió.
3. Un técnico no puede abrir el detalle de otro técnico ni enviar chat en un servicio ajeno.
4. El administrador filtra servicios por estado, texto y fecha; al cambiar cada filtro vuelve a la página 1 y el CSV contiene todas las coincidencias filtradas.
5. El administrador intenta reasignar a un técnico no disponible y recibe un error claro; un servicio terminado no muestra selector.
6. En catálogo, activar/desactivar y borrar requieren confirmación; cancelar no cambia datos.
7. Para cada consulta RLS denegada se muestra error, no una lista vacía ni un historial vacío.
