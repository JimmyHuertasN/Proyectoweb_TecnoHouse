# Informe de línea base técnica — TecnoHouse

**Fecha:** 31 de octubre de 2026
**Rama revisada:** `correcciones-como-funciona`
**Alcance:** diagnóstico estático y ejecución de comandos disponibles. No se modificó lógica funcional durante esta fase.

## 1. Estado del repositorio

- La rama de trabajo parte del commit `9060f95` (`Prompt 3.4: reportes, métricas y exportación CSV`).
- Existe una modificación local previa en `src/componentes/inicio/ComoFunciona.jsx`, correspondiente a la corrección aislada de esa rama.
- También hay documentación local no versionada: `GUIA_CAMBIOS_PROYECTO.md`, `INFORME_REVISION_EXPOSOTWARE.md` y `PLAN_ACCION_PULIDO.md`.
- Estos cambios se conservaron y no se mezclaron con el diagnóstico.

## 2. Comandos y resultados

| Comando | Resultado | Clasificación |
|---|---|---|
| `node --version` | `v18.19.1` | Entorno incompatible con el build actual |
| `npm --version` | `9.2.0` | Informativo |
| `npm run lint` | Termina, con 4 advertencias | Importante, no bloqueante |
| `npm run build` | Falla al cargar Rolldown por `node:util` | Bloqueante para producción |

Las cuatro advertencias de Oxlint están en `ChatServicio.jsx`, `GaleriaFotosServicio.jsx`, `useNotificaciones.js` y `PiePagina.jsx`; no están en `ComoFunciona.jsx`.

## 3. Bloqueo del build

El proyecto declara Vite `^8.3.0` y el lockfile instala Vite `8.3.2` junto con Rolldown `1.2.12`. Los paquetes instalados requieren:

```text
Node ^20.19.0 || >=22.12.0
```

El entorno actual usa Node `18.19.1`. El error observado es:

```text
The requested module 'node:util' does not provide an export named 'styleText'
```

La primera corrección recomendada es ejecutar el proyecto con Node 20.19 o superior, preferiblemente Node 22 LTS si está disponible. No se recomienda cambiar dependencias a ciegas antes de probar con un runtime compatible.

## 4. Estructura funcional identificada

Las rutas principales están centralizadas en `src/Aplicacion.jsx`:

- Sitio público: `/`, `/login`, `/registro`, `/salir`, `/recuperar`, `/nueva-contrasena` y `/correo-confirmado`.
- Cliente: `/cliente`, dispositivos, solicitudes, nueva solicitud, detalle y perfil.
- Compatibilidad: `/panel/*` redirige a `/cliente/*`.
- Técnico: pendientes, servicios, detalle y perfil.
- Administrador: dashboard, servicios, técnicos, clientes, catálogo y estadísticas.
- Fallback: `*` muestra la página 404.

Las áreas de datos están separadas en los módulos de `src/api/`: administración, dispositivos, fotos, mensajes, notificaciones, productos, reseñas, solicitudes, Supabase, técnicos y usuarios.

## 5. Supabase y dependencias observables

La aplicación usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` desde `src/api/supabase.js`. El archivo `.env` está excluido por `.gitignore`; no se detectó uso de una clave `service_role` o `sb_secret` en el código revisado. La clave pública no debe confundirse con una autorización para omitir RLS.

Los scripts SQL no contienen el esquema base completo de perfiles, servicios, dispositivos, diagnósticos, cotizaciones y calificaciones. Varias migraciones dependen de esas tablas y de la función `public.rol_actual()`, por lo que su existencia debe verificarse en la instancia de Supabase.

Orden recomendado, inferido de los comentarios y referencias del código:

1. Esquema base, Auth y trigger que crea perfiles.
2. `seguridad_roles.sql`.
3. `gravedad_categoria.sql`.
4. `fotos_servicio.sql` y `mensajes_servicio.sql`.
5. `notificaciones.sql`, después de las migraciones base, gravedad/categoría y mensajes.
6. `catalogo.sql`.
7. `vista_resenas.sql`.
8. `crear_tecnico.sql`.
9. `datos_prueba.sql`, únicamente en desarrollo y después de tener la estructura necesaria.

Este orden es una guía estática; no confirma que los scripts se hayan ejecutado correctamente en una base real.

## 6. Hallazgos clasificados

### Bloqueantes

- El build no puede ejecutarse con Node 18.19.1 debido al requisito de Node de Vite/Rolldown.
- No se puede certificar el flujo con Supabase sin comprobar la instancia, las migraciones, Auth, Storage, Realtime y RLS.

### Importantes

- Hay cuatro advertencias de Oxlint sobre actualizaciones de estado dentro de efectos y uso de `Date` durante el render.
- El repositorio no declara un comando automatizado de pruebas.
- El orden de migraciones y la existencia del esquema base no están documentados completamente en el README.
- Los datos de contacto y redes sociales aún requieren validación antes de una publicación.

### Cosméticos o pendientes de producto

- La portada tiene pendiente integrar el componente real del catálogo en lugar del marcador.
- La demo todavía no tiene una checklist formal ni un guion reproducible.

## 7. Orden recomendado de corrección

1. Preparar Node 20.19+ y comprobar `npm run build` sin modificar dependencias.
2. Integrar el catálogo real en la portada.
3. Validar y limpiar los datos públicos de contacto.
4. Auditar estados y recorridos de cliente, técnico y administrador.
5. Documentar y comprobar la instalación de Supabase en una instancia de desarrollo.
6. Resolver las advertencias de Oxlint una por una, verificando que no cambie el comportamiento.
7. Añadir una checklist manual de demo y, si el alcance lo permite, pruebas automatizadas focalizadas.

## Conclusión

La base de código está organizada y el diagnóstico no muestra un fallo sintáctico o de rutas que impida continuar. El primer bloqueo objetivo es el runtime de Node. Las correcciones funcionales deben continuar de forma aislada en la rama actual, ejecutando lint y repitiendo el build después de preparar un entorno compatible.
