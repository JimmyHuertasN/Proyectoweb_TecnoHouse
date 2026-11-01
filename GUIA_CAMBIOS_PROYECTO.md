# Guía detallada de cambios del proyecto TecnoHouse

## Alcance de esta guía

Esta guía resume los cambios registrados en el historial de Git de la rama revisada, desde el primer commit (`b3a71d6`, 8 de septiembre de 2026) hasta `9060f95` (24 de octubre de 2026). El árbol de trabajo estaba limpio al hacer la revisión, así que no había modificaciones locales sin commit que pudieran atribuirse a una edición actual. La referencia `origin/main` contiene después un commit que actualiza los metadatos de contribuyentes de GitHub; ese commit no introduce cambios funcionales en la aplicación.

El historial permite describir qué se incorporó al proyecto, pero no demostrar por sí solo quién escribió cada línea. Por eso, el documento habla de cambios registrados en la rama y no atribuye autoría individual a cada implementación.

## 1. De sitio estático a aplicación React

### Primer prototipo

Los primeros commits crearon la página pública con HTML y CSS, tarjetas informativas de técnicos y servicios, y formularios de acceso y registro. Luego se añadieron interacciones con JavaScript, validación básica y almacenamiento de usuarios en `localStorage`. Esa etapa sirvió como prototipo visual y funcional inicial.

### Migración a React y Vite

El sitio estático se retiró y se reconstruyó como aplicación de una sola página con React y Vite. La estructura se organizó en páginas, componentes, hooks, datos y utilidades bajo `src/`. Se incorporaron React Router, una hoja de estilos global y componentes reutilizables para navegación, pie de página, tarjetas, login y registro.

Archivos representativos: `src/Aplicacion.jsx`, `src/principal.jsx`, `src/paginas/`, `src/componentes/`, `src/estilos/` y `vite.config.js`.

## 2. Autenticación, perfiles y permisos

La autenticación pasó por una etapa intermedia con almacenamiento local y luego se conectó a Supabase Auth. El estado de sesión y el perfil del usuario se centralizan en `src/contexto/ProveedorSesion.jsx`; las consultas de cuentas y perfiles se agrupan en `src/api/usuarios.js` y la configuración compartida de Supabase en `src/api/supabase.js`.

Se incorporaron rutas protegidas y redirección según rol (`cliente`, `tecnico` o `admin`), cierre de sesión, registro con confirmación de correo, reenvío de confirmación y recuperación/cambio de contraseña. La aplicación incluye páginas específicas para estos pasos, entre ellas `CorreoConfirmado.jsx`, `RecuperarContrasena.jsx` y `NuevaContrasena.jsx`.

El script `supabase/seguridad_roles.sql` agrega controles de base de datos para proteger los roles frente a cambios no autorizados. La autenticación de Supabase debe configurarse con URL y clave pública en variables `VITE_SUPABASE_*`; las URL de retorno también deben configurarse en el panel de Supabase.

## 3. Flujo del cliente y solicitudes de reparación

El panel del cliente reúne resumen, perfil, dispositivos y solicitudes. Desde el panel se puede registrar un dispositivo, iniciar una solicitud, consultar su detalle y seguir sus cambios de estado. Los datos se consultan mediante `src/api/dispositivos.js` y `src/api/solicitudes.js`, con lógica de presentación separada en hooks y páginas.

El formulario de solicitud evolucionó para registrar la categoría del problema y su gravedad como datos separados, además de la descripción. También se añadió carga de fotografías y una galería por servicio. Las operaciones de imágenes están en `src/api/fotos.js` y la interfaz de galería en `src/componentes/panel/GaleriaFotosServicio.jsx`.

La categoría y gravedad requieren la migración `supabase/gravedad_categoria.sql`. Las imágenes requieren `supabase/fotos_servicio.sql`, que prepara el almacenamiento privado, la tabla correspondiente y sus políticas de acceso. `supabase/datos_prueba.sql` proporciona registros de ejemplo para desarrollo.

## 4. Trabajo de los técnicos

El panel técnico permite ver solicitudes pendientes, tomar un servicio, consultar los trabajos asignados y avanzar el estado del servicio. En el detalle, el técnico puede registrar diagnóstico y preparar una cotización con conceptos e importes. La lógica de acceso a los datos se concentra principalmente en `src/api/tecnico.js` y `src/api/solicitudes.js`; las vistas están bajo `src/paginas/tecnico/`.

Los técnicos pueden indicar disponibilidad y consultar su calificación. Cuando un servicio se termina, el cliente puede calificar al técnico; la API de reseñas se encuentra en `src/api/resenas.js`. La página pública obtiene reseñas mediante la vista `resenas_publicas`, creada por `supabase/vista_resenas.sql`, que limita los campos expuestos.

## 5. Cotizaciones y seguimiento del servicio

El cliente puede revisar una cotización y aprobarla o rechazarla. La cotización se compone de diagnóstico e ítems, y sus estados se muestran en el flujo de servicio. Después se agregó generación de PDF con información del servicio, cliente, dispositivo y conceptos de la cotización, mediante `src/utilidades/generarCotizacionPdf.js` y el componente `TarjetaCotizacion.jsx`.

El administrador puede ver el detalle de los servicios y reasignar técnicos. Si una solicitud no tenía técnico, la asignación la hace avanzar al estado correspondiente; no se permite reasignar servicios terminados. El nombre del técnico asignado también se presenta al cliente.

## 6. Administración de técnicos, clientes y servicios

El panel de administración fue ampliado con:

- **Técnicos:** creación de cuentas desde el panel, edición de información relevante, activación/desactivación y control de disponibilidad. La creación delega en la función de base de datos definida en `supabase/crear_tecnico.sql`. La desactivación conserva la ficha del técnico; si tiene trabajos en curso, primero deben reasignarse.
- **Clientes:** listado, detalle, información de contacto, dispositivos y servicios relacionados. Las interfaces se encuentran en `GestionClientes.jsx` y `DetalleCliente.jsx`.
- **Servicios:** listado general, detalle, consulta de cliente y técnico asignado, además de reasignación. Las vistas principales son `TodosLosServicios.jsx` y `DetalleServicioAdmin.jsx`.

Las consultas administrativas y las métricas se implementan principalmente en `src/api/admin.js`. El acceso efectivo a datos depende de las políticas RLS de Supabase y de la configuración de roles.

## 7. Dashboard, estadísticas y reportes

Se desarrolló un dashboard con métricas generales, distribución de servicios por estado e ingresos. La pantalla de estadísticas agrega tendencias mensuales, problemas frecuentes por categoría, servicios por tipo de dispositivo y técnicos mejor calificados.

En el último bloque de cambios revisado (`9060f95`) se añadieron o ampliaron:

- Filtros temporales predefinidos (últimos 7 días, 30 días y 6 meses) y rango personalizado, implementados en `useRangoFechas.js` y `SelectorRangoFechas.jsx`.
- Métricas de clientes nuevos, técnicos disponibles, servicios activos, tiempo promedio hasta la calificación y proporción de cotizaciones aprobadas.
- Series mensuales de servicios e ingresos y desgloses por dispositivo y categoría.
- Cálculos de fechas y agregaciones separados de las consultas de Supabase en `src/utilidades/reportes.js`.
- Mejoras en los gráficos y tarjetas de porcentaje.

Las métricas usan la fecha de creación de la solicitud para asignar el periodo. Como el modelo actual no guarda una fecha de finalización, el tiempo promedio se estima desde la solicitud hasta la calificación del cliente; los ingresos mensuales consideran cotizaciones aprobadas asociadas a servicios terminados y se agrupan por la fecha de solicitud. Esta interpretación está documentada en `src/api/admin.js` y afecta cómo deben leerse esos indicadores.

## 8. Filtros, búsqueda y paginación

Se añadieron utilidades reutilizables para buscar y filtrar listas por estado y fecha, junto con el hook `src/hooks/useFiltroPaginado.js`. Los componentes `BarraFiltros.jsx`, `ResultadosPaginados.jsx` y `Paginacion.jsx` se aplican a listados de administración, técnicos y clientes. Los filtros de solicitudes contemplan texto y fechas; al cambiar criterios se actualiza la paginación.

La lógica común está en `src/utilidades/filtros.js`, lo que mantiene el comportamiento de las distintas listas más consistente. El listado de administración conserva como filtro inicial los servicios en curso.

## 9. Catálogo de productos

El proyecto incorpora un catálogo público con filtros y consulta por WhatsApp, además de gestión de productos para el administrador. La sección pública está en `src/componentes/inicio/SeccionCatalogo.jsx`; el panel de administración y el formulario están en `src/paginas/admin/GestionProductos.jsx` y `src/componentes/panel/FormularioProducto.jsx`.

Las operaciones de catálogo se agrupan en `src/api/productos.js`, y `ImagenProducto.jsx` proporciona una imagen de respaldo cuando una imagen de producto no está disponible. Las categorías se definen en `src/datos/categoriasProductos.js`. El script `supabase/catalogo.sql` crea la estructura, la vista pública, las políticas RLS y el bucket para imágenes.

## 10. Comunicación y avisos en tiempo real

Se añadió un chat asociado a cada servicio, compartido entre cliente y técnico, con vista de solo lectura para administración. La implementación de interfaz está en `ChatServicio.jsx`, las operaciones y suscripciones en `src/api/mensajes.js`, y la tabla/políticas en `supabase/mensajes_servicio.sql`. Un ajuste posterior reutilizó un canal por suscripción para evitar duplicar canales.

También se implementaron notificaciones en tiempo real para cambios de servicio: API, hook, campana, contador y avisos se encuentran en `src/api/notificaciones.js`, `useNotificaciones.js` y `CampanaNotificaciones.jsx`. `supabase/notificaciones.sql` configura la parte de base de datos y las políticas. Se corrigió además la conversión del estado a texto para los avisos.

## 11. Sitio público y experiencia de uso

La página de inicio recibió ajustes visuales y de navegación, incluyendo fondo degradado y animaciones. Se añadieron secciones de cómo funciona el servicio, preguntas frecuentes, contacto, ubicación y reseñas. Los datos de contacto centralizados están en `src/datos/contacto.js`; deben verificarse antes de publicar.

También se incorporaron mejoras de correo y mapa en la sección de contacto/ubicación, una página 404 (`NoEncontrada.jsx`), estados de carga tipo skeleton, confirmaciones y mensajes toast para operaciones de la aplicación. Estos últimos se organizan en proveedores, contextos y hooks, de modo que las vistas puedan solicitar confirmación o mostrar el resultado de una acción sin repetir la implementación.

## 12. Exportación CSV

La lista administrativa de servicios puede exportar los resultados que cumplen los filtros actuales, incluyendo todas las páginas filtradas y no solo la página visible. El archivo incluye código, cliente, dispositivo, técnico, estado, fecha de solicitud y total disponible. La generación y descarga están en `src/utilidades/csv.js` y el botón se integra en `src/paginas/admin/TodosLosServicios.jsx`.

## 13. Estructura y comandos del proyecto

El proyecto utiliza React 19, Vite, React Router, Tailwind CSS 4 y el cliente de Supabase. Los comandos definidos en `package.json` son:

- `npm run dev`: iniciar el servidor local de desarrollo.
- `npm run build`: generar el paquete de producción.
- `npm run preview`: servir localmente el paquete generado.
- `npm run lint`: ejecutar Oxlint.

El archivo `README.md` describe la configuración básica de Supabase y enumera varios scripts SQL. Para que todas las funciones estén disponibles, además de las variables de entorno, deben estar aplicados los scripts correspondientes a roles, reseñas, gravedad/categoría, fotos, creación de técnicos, mensajería, notificaciones y catálogo, según los módulos que se vayan a utilizar.

## 14. Archivos principales por área

| Área | Ubicación principal |
|---|---|
| Rutas y composición | `src/Aplicacion.jsx`, `src/principal.jsx` |
| Sesión y roles | `src/contexto/`, `src/componentes/RutaProtegida.jsx`, `src/api/usuarios.js` |
| Cliente | `src/paginas/panel/` |
| Técnico | `src/paginas/tecnico/` |
| Administración | `src/paginas/admin/`, `src/api/admin.js` |
| Integración Supabase | `src/api/`, `supabase/*.sql` |
| Catálogo | `src/api/productos.js`, `src/paginas/admin/GestionProductos.jsx`, `src/componentes/inicio/SeccionCatalogo.jsx` |
| Reportes y exportación | `src/utilidades/reportes.js`, `src/utilidades/csv.js`, `src/paginas/admin/Estadisticas.jsx` |
| Interfaz pública | `src/componentes/inicio/`, `src/paginas/Inicio.jsx` |

## Nota de implementación

Esta guía describe el código y los cambios observables en el historial revisado; no confirma que el proyecto esté desplegado ni que cada script SQL ya se haya ejecutado en la instancia de Supabase. Para habilitar los módulos conectados a datos, hay que aplicar las migraciones pertinentes y configurar Auth, almacenamiento y políticas en el proyecto de Supabase utilizado.
