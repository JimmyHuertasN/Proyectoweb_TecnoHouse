# Guía detallada de cambios del proyecto TecnoHouse

## Alcance de esta guía

Esta guía resume los cambios registrados en el historial de Git de la rama revisada, desde el primer commit (`b3a71d6`, 8 de septiembre de 2026) hasta `9060f95` (24 de octubre de 2026). El árbol de trabajo estaba limpio al hacer la revisión, así que no había modificaciones locales sin commit que pudieran atribuirse a una edición actual. La referencia `origin/main` contiene después un commit que actualiza los metadatos de contribuyentes de GitHub; ese commit no introduce cambios funcionales en la aplicación.

Actualizaciones posteriores, hasta el commit `dc3e185` (13 de noviembre de 2026):

- Tienda virtual, portada que separa la tienda de las reparaciones y gestión de la tienda en el panel del administrador (secciones 7, 9 y 11).
- API ASP.NET Core conectada a Supabase (sección 15).
- Reorganización de carpetas y correcciones de código limpio (sección 16).
- Rediseño visual del sitio público y de los paneles (sección 17).

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

El dashboard también incorpora la tienda:

- **Ingresos totales** (`IngresosTotales.jsx`): suma lo ganado en el periodo con reparaciones (cotizaciones aprobadas de servicios terminados) y con la tienda (pedidos entregados), y muestra cuánto aporta cada parte. La tarjeta anterior pasó a llamarse "Ingresos de reparaciones".
- **Sección Tienda** (`ResumenTienda.jsx`): productos a la venta, agotados, con poco stock, valor del inventario, lista de productos por reponer, stock por categoría y pedidos por estado. Muestra el estado actual del inventario, por lo que no depende del periodo elegido.

Mientras no exista la tabla de pedidos, los ingresos y los pedidos de la tienda se muestran en cero (ver sección 9).

## 8. Filtros, búsqueda y paginación

Se añadieron utilidades reutilizables para buscar y filtrar listas por estado y fecha, junto con el hook `src/hooks/useFiltroPaginado.js`. Los componentes `BarraFiltros.jsx`, `ResultadosPaginados.jsx` y `Paginacion.jsx` se aplican a listados de administración, técnicos y clientes. Los filtros de solicitudes contemplan texto y fechas; al cambiar criterios se actualiza la paginación.

La lógica común está en `src/utilidades/filtros.js`, lo que mantiene el comportamiento de las distintas listas más consistente. El listado de administración conserva como filtro inicial los servicios en curso.

## 9. Tienda virtual y catálogo de productos

Al principio, el catálogo era una sección de la página de inicio con filtros y consulta por WhatsApp. Después se reemplazó por una tienda virtual con páginas propias, y la sección `SeccionCatalogo.jsx` se eliminó.

### Tienda pública

- **`/tienda`** (`src/paginas/tienda/Tienda.jsx`): banner, categorías con su cantidad de productos, filtro "Solo disponibles", buscador por nombre, descripción y categoría, orden (destacados, precio, nombre y más recientes) y cuadrícula de productos.
- **`/tienda/:id`** (`src/paginas/tienda/DetalleProducto.jsx`): foto grande, precio, stock, descripción, selector de cantidad, botón para agregar al carrito, consulta por WhatsApp, enlace para solicitar la instalación y productos relacionados de la misma categoría.
- **Carrito lateral** (`CarritoLateral.jsx`): permite cambiar cantidades, quitar productos y ver el total. El pedido se envía por WhatsApp con la lista y el total ya escritos. No permite pedir más unidades que el stock disponible.

Las dos páginas comparten el diseño `DisenoTienda.jsx`, que carga los productos una sola vez. El estado de la tienda (productos y carrito) se maneja con `ContextoTienda.js`, `ProveedorTienda.jsx` y el hook `useTienda.js`, con el mismo patrón que usan el Toast y la sesión. El carrito guarda solo `{ id, cantidad }` en `localStorage`; el nombre y el precio se toman siempre del producto cargado. Los componentes de la tienda están en `src/componentes/tienda/` y los enlaces de WhatsApp en `src/utilidades/whatsapp.js`.

### Gestión desde el panel del administrador

La opción "Catálogo" del menú pasó a llamarse **Tienda**. La ruta sigue siendo `/admin/catalogo`. Además de crear, editar, activar o desactivar y borrar productos, la página `GestionProductos.jsx` ahora incluye:

- un resumen del inventario y un aviso de productos por reponer (`ResumenInventario.jsx`);
- botones − y + para ajustar el stock sin abrir el formulario;
- un botón "Ver tienda" para revisar la tienda como la ve el cliente.

Los cálculos del inventario están en `src/utilidades/inventario.js`, incluido el límite de "pocas unidades" que comparten el panel y la tienda.

Se agregó la página **Pedidos** (`/admin/pedidos`, `PedidosTienda.jsx`), con los estados definidos en `src/datos/estadosPedido.js`: pendiente, confirmado, entregado y cancelado.

### Pendiente en la base de datos

Por decisión del equipo, en esta etapa no se modificó Supabase. Las partes que dependen de la base quedaron preparadas y marcadas en el código con el comentario `PENDIENTE BASE`:

| Funcionalidad | Qué falta en Supabase | Dónde se conecta |
|---|---|---|
| Registrar pedidos del carrito | Tablas `pedidos` y `pedido_items`, con políticas RLS (cualquiera crea, solo el administrador lee y cambia el estado) | `src/api/pedidos.js`, `CarritoLateral.jsx` |
| Lista y estados de pedidos | La misma tabla `pedidos` | `PedidosTienda.jsx`, `ResumenTienda.jsx` |
| Descontar stock al confirmar | Lógica en la base al confirmar un pedido | `src/api/pedidos.js` |
| Ingresos de la tienda | Pedidos entregados | `obtenerIngresosTienda` en `src/api/pedidos.js` |
| Productos destacados | Columna `destacado` en `productos` | `GestionProductos.jsx`, `Tienda.jsx`, `Portada.jsx` |

Las operaciones de productos siguen en `src/api/productos.js`, y `ImagenProducto.jsx` muestra un ícono cuando un producto no tiene imagen. Las categorías se definen en `src/datos/categoriasProductos.js`. El script `supabase/catalogo.sql` crea la estructura, la vista pública `productos_activos`, las políticas RLS y el bucket para imágenes. La tienda usa esa misma vista.

## 10. Comunicación y avisos en tiempo real

Se añadió un chat asociado a cada servicio, compartido entre cliente y técnico, con vista de solo lectura para administración. La implementación de interfaz está en `ChatServicio.jsx`, las operaciones y suscripciones en `src/api/mensajes.js`, y la tabla/políticas en `supabase/mensajes_servicio.sql`. Un ajuste posterior reutilizó un canal por suscripción para evitar duplicar canales.

También se implementaron notificaciones en tiempo real para cambios de servicio: API, hook, campana, contador y avisos se encuentran en `src/api/notificaciones.js`, `useNotificaciones.js` y `CampanaNotificaciones.jsx`. `supabase/notificaciones.sql` configura la parte de base de datos y las políticas. Se corrigió además la conversión del estado a texto para los avisos.

## 11. Sitio público y experiencia de uso

La página de inicio recibió ajustes visuales y de navegación, incluyendo fondo degradado y animaciones. Se añadieron secciones de cómo funciona el servicio, preguntas frecuentes, contacto, ubicación y reseñas. Los datos de contacto centralizados están en `src/datos/contacto.js`; deben verificarse antes de publicar.

También se incorporaron mejoras de correo y mapa en la sección de contacto/ubicación, una página 404 (`NoEncontrada.jsx`), estados de carga tipo skeleton, confirmaciones y mensajes toast para operaciones de la aplicación. Estos últimos se organizan en proveedores, contextos y hooks, de modo que las vistas puedan solicitar confirmación o mostrar el resultado de una acción sin repetir la implementación.

### Portada y separación entre tienda y reparaciones

Se cambió la entrada del sitio:

| Ruta | Contenido |
|---|---|
| `/` | Portada nueva (`src/paginas/Portada.jsx`) |
| `/reparaciones` | La página de inicio anterior, sin la sección de catálogo. Hoy se llama `Reparaciones.jsx` (sección 16) |
| `/tienda` | Tienda virtual (sección 9) |

La portada muestra el nombre TecnoHouse con un resumen de lo que hace el negocio y tres datos destacados: tipos de servicio, cantidad de técnicos y seguimiento en línea. Debajo hay dos tarjetas:
- **Tienda:** vista previa de hasta tres productos con stock y las categorías.
- **Reparaciones:** los servicios con sus íconos.

Al final hay una invitación a escribir por WhatsApp. La portada no tiene botones de sesión; se puede iniciar sesión desde la barra de reparaciones, el encabezado de la tienda o el pie de página.

Los enlaces del pie de página a secciones (`#servicios`, `#contacto`, etc.) ahora apuntan a `/reparaciones#...`. Las barras de reparaciones y de la tienda enlazan entre sí. Los logos y la redirección al cerrar sesión llevan a la portada.

## 12. Exportación CSV

La lista administrativa de servicios puede exportar los resultados que cumplen los filtros actuales, incluyendo todas las páginas filtradas y no solo la página visible. El archivo incluye código, cliente, dispositivo, técnico, estado, fecha de solicitud y total disponible. La generación y descarga están en `src/utilidades/csv.js` y el botón se integra en `src/paginas/admin/TodosLosServicios.jsx`.

## 13. Estructura y comandos del proyecto

El proyecto utiliza React 19, Vite, React Router, Tailwind CSS 4 y el cliente de Supabase. Los comandos definidos en `package.json` son:

- `npm run dev`: iniciar el servidor local de desarrollo.
- `npm run build`: generar el paquete de producción.
- `npm run preview`: servir localmente el paquete generado.
- `npm run lint`: ejecutar Oxlint.

El archivo `README.md` describe la configuración básica de Supabase y enumera varios scripts SQL. Para que todas las funciones estén disponibles, además de las variables de entorno, deben estar aplicados los scripts correspondientes a roles, reseñas, gravedad/categoría, fotos, creación de técnicos, mensajería, notificaciones y catálogo, según los módulos que se vayan a utilizar.

La API se compila y ejecuta con el SDK de .NET 10 (`dotnet run` en `backend/TecnoHouse.Api` o el perfil `TecnoHouse.Api` de Visual Studio). El frontend la encuentra con la variable `VITE_TECNOHOUSE_API_URL`. Para que Visual Studio y Vite puedan trabajar a la vez, `vite.config.js` excluye la carpeta `backend/` de la vigilancia de archivos.

## 14. Archivos principales por área

| Área | Ubicación principal |
|---|---|
| Rutas y composición | `src/Aplicacion.jsx`, `src/principal.jsx` |
| Sesión y roles | `src/contexto/`, `src/componentes/RutaProtegida.jsx`, `src/api/usuarios.js`, `src/paginas/autenticacion/`, `src/componentes/autenticacion/` |
| Cliente | `src/paginas/cliente/`, `src/componentes/panel/cliente/` |
| Técnico | `src/paginas/tecnico/`, `src/componentes/panel/tecnico/` |
| Administración | `src/paginas/admin/`, `src/componentes/panel/admin/`, `src/api/admin.js` |
| Integración Supabase y API | `src/api/`, `supabase/*.sql`, `backend/` |
| Tienda pública | `src/paginas/tienda/`, `src/componentes/tienda/`, `src/contexto/ProveedorTienda.jsx`, `src/utilidades/whatsapp.js` |
| Gestión de la tienda | `src/api/productos.js`, `src/api/pedidos.js`, `src/paginas/admin/GestionProductos.jsx`, `src/paginas/admin/PedidosTienda.jsx`, `src/utilidades/inventario.js` |
| Reportes y exportación | `src/utilidades/reportes.js`, `src/utilidades/csv.js`, `src/paginas/admin/Estadisticas.jsx`, `src/componentes/panel/admin/IngresosTotales.jsx`, `src/componentes/panel/admin/ResumenTienda.jsx` |
| Interfaz pública | `src/paginas/Portada.jsx`, `src/paginas/Reparaciones.jsx` (`/reparaciones`), `src/componentes/reparaciones/`, `src/componentes/PiePagina.jsx` |
| API ASP.NET | `backend/TecnoHouse.Api/` (controladores, modelos, middleware), `src/api/backend.js` |

## 15. API ASP.NET Core

Se agregó una API en `backend/TecnoHouse.Api` (solución `TecnoHouse.Api.sln`) que se conecta a las tablas existentes de Supabase con EF Core y Npgsql. No crea ni migra tablas: modela las que ya existen, con sus relaciones y enums.

- **Controladores:** `GET` y `POST` para perfiles, técnicos, dispositivos, servicios, diagnósticos, cotizaciones, ítems, calificaciones, mensajes, fotos, notificaciones y productos; `PUT` para el perfil actual; `GET` de solo lectura para las vistas públicas (`tecnicos-publicos`, `resenas-publicas`, `productos-activos`).
- **Seguridad:** valida el JWT de Supabase y pasa la identidad a PostgreSQL (`SupabaseRlsMiddleware`), así que las políticas RLS siguen aplicando. Los errores se devuelven con un formato común (`ApiExceptionMiddleware`).
- **Exploración:** en desarrollo, Scalar muestra los endpoints en `http://localhost:5100/scalar/v1`.

En el frontend, `src/api/backend.js` envía el token de la sesión en cada llamada y explica qué revisar si la API no responde. Hoy usan la API la lectura y actualización de perfiles, el listado y la creación de dispositivos, el listado, detalle y creación de solicitudes y las reseñas públicas. Un ajuste posterior muestra los errores al cargar el perfil desde la API en vez de dejar la pantalla vacía. El resto de módulos sigue consultando Supabase directamente.

Cada integrante configura en su equipo los secretos `Supabase:Url` y `ConnectionStrings:TecnoHouse` (Session pooler, puerto 5432), según `backend/README.md`. La contraseña de la base nunca se guarda en el repositorio. `supabase/esquema_para_api.sql` es la consulta de solo lectura con la que se obtuvieron columnas, relaciones y enums para los modelos.

## 16. Reorganización de carpetas y código limpio

El 13 de noviembre de 2026 se reorganizó `src/` para que cada carpeta tenga una sola responsabilidad y el nombre coincida con su ruta:

| Antes | Ahora |
|---|---|
| `paginas/` (páginas de acceso sueltas) | `paginas/autenticacion/` |
| `componentes/` (barra y diseño de acceso) | `componentes/autenticacion/` |
| `paginas/panel/` | `paginas/cliente/` |
| `paginas/Inicio.jsx` | `paginas/Reparaciones.jsx` |
| `componentes/inicio/` y las tarjetas de la página de reparaciones | `componentes/reparaciones/` |
| `componentes/inicio/PiePagina.jsx` y su copia en `componentes/` | Un solo `componentes/PiePagina.jsx` |
| `componentes/panel/` (39 archivos juntos) | Los compartidos siguen en `panel/`; los de un solo rol pasaron a `panel/cliente/`, `panel/tecnico/` y `panel/admin/` |
| Informes y esta guía en la raíz | `docs/` |

En el mismo trabajo se aplicaron las prácticas de código limpio vistas en clase:

- **Nombres con significado:** los ordenamientos que usaban `(a, b)` ahora dicen qué comparan, por ejemplo `(productoA, productoB)`.
- **Formato consistente:** `vite.config.js` y `src/principal.jsx` usan el mismo estilo que el resto (4 espacios, comillas dobles y punto y coma). Las líneas largas se dividieron.
- **Comentarios con criterio:** se corrigieron comentarios desactualizados y se quitaron los que solo repetían el nombre del componente.
- **Sin código muerto:** se eliminó un `PiePagina.jsx` que solo reexportaba otro archivo y no se usaba.
- **Importaciones ordenadas:** en `src/Aplicacion.jsx` las páginas se agrupan por área, en el mismo orden que las rutas.

Los cambios se subieron en commits pequeños (uno por carpeta o tema) y cada uno compila por sí solo. Las rutas que mencionan las secciones anteriores de esta guía corresponden a la ubicación que tenían en su momento.

## 17. Rediseño visual

El 13 de noviembre de 2026 se rediseñó la presentación del sitio sin cambiar rutas, permisos, consultas ni reglas de negocio.

**Sistema visual** (`src/estilos/principal.css`): fondo casi negro, bandas de sección (`superficie`) y tarjetas (`tarjeta`) con tonos más neutros. El azul de la marca queda para botones, enlaces y el estado activo. Se agregaron las clases `contenedor`, `seccion`, `titulo-seccion`, `texto-seccion` y `enlace` para que todas las páginas compartan anchos, espacios y títulos. Botones y campos miden al menos 44 px de alto.

**Navegación y pie:**

- `EncabezadoSitio.jsx` es el encabezado único de la portada, reparaciones, la tienda y las pantallas de acceso: logotipo, Inicio, Reparaciones, Tienda y el acceso a la cuenta o al panel. La tienda le agrega el carrito (`EncabezadoTienda.jsx`). Reemplazó a `BarraNavegacion.jsx` y `BarraNavegacionAutenticacion.jsx`.
- `NavegacionSecciones.jsx` es la barra de anclajes de la página de reparaciones y resalta la sección visible.
- `Logotipo.jsx` reúne el nombre de la marca, que antes se repetía en cinco archivos.
- `PiePagina.jsx` muestra solo los canales configurados en `datos/contacto.js`; el horario y las redes aparecen cuando el negocio los confirme.

**Portada** (`Portada.jsx`): presenta el negocio con un título, las acciones "Solicitar una reparación" y "Ver la tienda" y una ilustración propia (`componentes/portada/EjemploSeguimiento.jsx`) marcada como ejemplo. Después siguen los equipos que se atienden, una selección de productos con stock, los cuatro pasos del servicio (`datos/pasosServicio.js`, compartidos con reparaciones), el seguimiento en línea y el contacto.

**Reparaciones** (`Reparaciones.jsx`): primera sección con el resumen de cómo pedir una reparación, servicios, pasos en línea de tiempo, técnicos, reseñas, preguntas, ubicación y contacto, alternando fondos y composiciones. `rutaSolicitarReparacion` (`utilidades/rutas.js`) decide a dónde lleva "Solicitar": registro sin sesión, nueva solicitud para el cliente y el panel propio para técnico o administrador.

**Tienda:** el buscador está en el encabezado de la página, las categorías son una fila deslizable en celulares y una lista lateral en escritorio, y `CuadriculaProductos.jsx` mantiene el ancho de las tarjetas aunque haya pocos productos. `ImagenProducto.jsx` tiene la opción `contener` para mostrar la foto completa sin recortes. El detalle y el carrito destacan el precio y el total. Hay estados propios para carga, error, catálogo vacío, búsqueda sin resultados, imagen ausente y producto agotado.

**Acceso y paneles:** `DisenoAutenticacion.jsx` usa el encabezado del sitio y resume lo que permite la cuenta. En los paneles, `MenuLateral.jsx` muestra el rol y marca la página activa; `BarraProgreso.jsx` destaca el estado actual y el paso que sigue; `ProximoPaso.jsx` y `TarjetaCotizacion.jsx` resaltan la acción pendiente y el total.

**Correcciones encontradas en la revisión:**

- La calificación de los técnicos no se mostraba en la página pública: la API la entrega como `calificacionPromedio` y la tarjeta buscaba `calificacion_promedio`.
- Los avisos emergentes tapaban el menú y el carrito; ahora aparecen debajo del encabezado.
- El menú lateral cerrado en celulares seguía recibiendo el foco del teclado.
- El año del pie de página se calculaba en cada dibujo, lo que generaba un aviso del linter.

La animación de entrada de las secciones se extrajo al hook `useAnimacionEntrada.js` y se desactiva con `prefers-reduced-motion`.

## Nota de implementación

Esta guía describe el código y los cambios observables en el historial revisado; no confirma que el proyecto esté desplegado ni que cada script SQL ya se haya ejecutado en la instancia de Supabase. Para habilitar los módulos conectados a datos, hay que aplicar las migraciones pertinentes y configurar Auth, almacenamiento y políticas en el proyecto de Supabase utilizado.
