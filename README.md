# Proyectoweb_TecnoHouse

## Cómo ejecutarlo

1. Instala las dependencias con `npm install`.
2. Crea un archivo `.env` en la raíz del proyecto (puedes copiar `.env.example`) con los datos del proyecto de Supabase, que están en **Project Settings → API**:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-publica
   ```
   Usa solo la clave **pública** (`anon` o `sb_publishable_...`). La clave secreta (`service_role` o `sb_secret_...`) nunca va en el navegador ni en el repositorio.
3. Ejecuta `npm run dev` y abre la dirección que muestra la terminal. Si cambias el `.env`, reinicia el servidor.

## Configuración de Supabase (una sola vez por proyecto)

1. **URLs de los correos**: en **Authentication → URL Configuration**, pon en *Site URL* la dirección de la app (ej. `http://localhost:5173`) y agrega en *Redirect URLs* `http://localhost:5173/**` (y la dirección pública cuando el sitio esté publicado). Sin esto, los enlaces de confirmación y de recuperación de contraseña no vuelven a la aplicación.
2. **Seguridad de roles**: ejecuta `supabase/seguridad_roles.sql` en el **SQL Editor**. Impide que un usuario se cambie el rol a sí mismo (por ejemplo, a `admin`).
3. **Reseñas públicas**: ejecuta `supabase/vista_resenas.sql` en el **SQL Editor** para publicar únicamente el nombre de pila, puntuación, comentario y fecha de las calificaciones que tienen comentario.
4. **Datos de prueba** (opcional, solo desarrollo): ejecuta `supabase/datos_prueba.sql`. Crea un admin, tres técnicos, dos clientes y servicios en distintos estados. Los correos y la contraseña están al inicio del archivo.

## Autenticación

- Registro con confirmación por correo (`/correo-confirmado` recibe el enlace) y opción de reenviar el correo.
- Inicio de sesión que lleva a cada usuario a la sección de su rol (`/cliente`, `/tecnico` o `/admin`).
- Recuperación de contraseña: `/recuperar` envía el enlace y `/nueva-contrasena` permite crear la nueva.

## Datos

- **Cuentas**: Supabase Auth. Al registrarse se envía un correo de confirmación; hay que confirmarlo antes de iniciar sesión.
- **Perfiles y roles**: tabla `perfiles` (`cliente`, `tecnico` o `admin`). Un trigger crea el perfil con rol `cliente` al registrarse; los otros roles se asignan desde la base de datos.
- **Dispositivos**: tabla `dispositivos`.
- **Solicitudes de servicio**: tabla `servicios`. La gravedad se guarda al inicio del texto del problema (`[Gravedad: alta] ...`) porque la tabla no tiene una columna para ella.
- **Técnicos de la página de inicio**: vista pública `tecnicos_publicos`.
- **Reseñas de la página de inicio**: vista pública `resenas_publicas` (requiere ejecutar `supabase/vista_resenas.sql`).
- **Contacto público**: completa `src/datos/contacto.js` con los datos verificados de TecnoHouse antes de publicar el sitio.
