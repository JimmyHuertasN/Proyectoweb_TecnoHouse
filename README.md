# Proyectoweb_TecnoHouse

Aplicación web de TecnoHouse, un negocio de reparación de equipos tecnológicos con tienda de productos y repuestos. Los clientes solicitan reparaciones y siguen su estado en línea, los técnicos atienden los servicios y el administrador gestiona el negocio y la tienda.

Tecnologías: React 19, React Router 7, Vite, Tailwind CSS 4, Supabase (autenticación, base de datos, almacenamiento y Realtime) y lucide-react para los íconos.

## Cómo ejecutarlo

1. Instala las dependencias con `npm install`.
2. Crea un archivo `.env` en la raíz del proyecto (puedes copiar `.env.example`). En el Dashboard de Supabase, abre tu proyecto y pulsa **Connect** para copiar la URL y la clave pública. También puedes consultar las claves en **Settings → API Keys** (icono de engranaje en la barra lateral):
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-publica
   ```
   Usa solo la clave **pública** (`anon` o `sb_publishable_...`). La clave secreta (`service_role` o `sb_secret_...`) nunca va en el navegador ni en el repositorio.
3. Ejecuta `npm run dev` y abre la dirección que muestra la terminal. Si cambias el `.env`, reinicia el servidor.

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila la aplicación en `dist/` |
| `npm run preview` | Sirve la versión compilada |
| `npm run lint` | Revisa el código con oxlint |

## Configuración de Supabase (una sola vez por proyecto)

1. **URLs de los correos**: en **Authentication → URL Configuration**, pon en *Site URL* la dirección de la app (ej. `http://localhost:5173`) y agrega en *Redirect URLs* `http://localhost:5173/**` (y la dirección pública cuando el sitio esté publicado). Sin esto, los enlaces de confirmación y de recuperación de contraseña no vuelven a la aplicación.
2. **Scripts SQL**: ejecútalos en el **SQL Editor** en este orden. Todos se pueden ejecutar más de una vez sin perder datos.

| Script | Qué hace |
|---|---|
| `supabase/seguridad_roles.sql` | Impide que un usuario se cambie el rol a sí mismo (por ejemplo, a `admin`). |
| `supabase/vista_resenas.sql` | Publica solo el nombre de pila, puntuación, comentario y fecha de las calificaciones que tienen comentario. |
| `supabase/gravedad_categoria.sql` | Crea las columnas de gravedad y categoría, migra los datos históricos y limpia el prefijo de gravedad de las descripciones. |
| `supabase/fotos_servicio.sql` | Crea el bucket privado, la tabla y las políticas de acceso de las fotos de cada servicio. |
| `supabase/mensajes_servicio.sql` | Crea la conversación de cada servicio entre cliente y técnico, lista para Realtime. |
| `supabase/notificaciones.sql` | Crea los avisos privados de cada usuario. Requiere los dos scripts anteriores. |
| `supabase/crear_tecnico.sql` | Permite que el administrador cree técnicos desde la aplicación. |
| `supabase/catalogo.sql` | Crea la tabla de productos, la vista pública `productos_activos` y el bucket de imágenes de la tienda. |
| `supabase/datos_prueba.sql` | Opcional, solo para desarrollo. Crea un admin, tres técnicos, dos clientes y servicios en distintos estados. Los correos y la contraseña están al inicio del archivo. |

Los scripts de fotos, técnicos y catálogo usan la función `public.rol_actual()`, que ya debe existir en la base.

## Funcionalidades

### Sitio público

| Ruta | Contenido |
|---|---|
| `/` | Portada que separa la tienda de las reparaciones, con vista previa de productos y servicios. |
| `/reparaciones` | Servicios, cómo funciona, técnicos, reseñas, preguntas frecuentes, contacto y ubicación. |
| `/tienda` | Catálogo con categorías, buscador, filtro de disponibles y orden por precio, nombre o fecha. |
| `/tienda/:id` | Detalle del producto, productos relacionados y consulta por WhatsApp. |

La tienda tiene un carrito lateral que se guarda en el navegador y envía el pedido por WhatsApp con la lista de productos y el total. No permite pedir más unidades que el stock disponible.

### Autenticación

- Registro con confirmación por correo (`/correo-confirmado` recibe el enlace) y opción de reenviar el correo.
- Inicio de sesión que lleva a cada usuario a la sección de su rol (`/cliente`, `/tecnico` o `/admin`).
- Recuperación de contraseña: `/recuperar` envía el enlace y `/nueva-contrasena` permite crear la nueva.

### Paneles por rol

- **Cliente** (`/cliente`): resumen, dispositivos, solicitudes de reparación con fotos, seguimiento del estado, conversación con el técnico, aprobación de la cotización, calificación del servicio y perfil.
- **Técnico** (`/tecnico`): solicitudes pendientes, servicios asignados con diagnóstico y cotización, conversación con el cliente y perfil.
- **Administrador** (`/admin`): dashboard con ingresos de reparaciones y de la tienda, servicios con filtros y exportación CSV, técnicos, clientes, gestión de la tienda (productos, imágenes, stock e inventario), pedidos y estadísticas.

Todos los paneles reciben avisos en tiempo real en el menú de notificaciones.

## Datos

- **Cuentas**: Supabase Auth. Al registrarse se envía un correo de confirmación; hay que confirmarlo antes de iniciar sesión.
- **Perfiles y roles**: tabla `perfiles` (`cliente`, `tecnico` o `admin`). Un trigger crea el perfil con rol `cliente` al registrarse; los técnicos los crea el administrador desde la aplicación y el rol `admin` se asigna desde la base de datos.
- **Dispositivos**: tabla `dispositivos`.
- **Solicitudes de servicio**: tabla `servicios`, con fotos (`fotos_servicio`), mensajes (`mensajes_servicio`) y avisos (`notificaciones`).
- **Productos**: tabla `productos`. La tienda lee la vista pública `productos_activos`.
- **Técnicos de la página de reparaciones**: vista pública `tecnicos_publicos`.
- **Reseñas de la página de reparaciones**: vista pública `resenas_publicas`.
- **Contacto público**: completa `src/datos/contacto.js` con los datos verificados de TecnoHouse antes de publicar el sitio.

## Pendiente en la base de datos

Las siguientes partes de la tienda ya están en la interfaz, pero esperan cambios en Supabase. En el código están marcadas con el comentario `PENDIENTE BASE`:

- Tablas `pedidos` y `pedido_items` para registrar los pedidos del carrito, listarlos en `/admin/pedidos` y cambiar su estado. Mientras no existan, los pedidos y los ingresos de la tienda se muestran en cero.
- Descontar el stock cuando se confirma un pedido.
- Columna `destacado` en `productos` para que el administrador elija los productos que aparecen primero en la tienda y en la portada.

## Documentación

- [GUIA_CAMBIOS_PROYECTO.md](./GUIA_CAMBIOS_PROYECTO.md): resumen de los cambios del proyecto y dónde está cada parte del código.
- [VALIDACION_FINAL_Y_GUION_DEMO.md](./VALIDACION_FINAL_Y_GUION_DEMO.md): checklist reproducible, registro de resultados y guion de presentación. Usa siempre una instancia de Supabase de desarrollo y datos ficticios.
