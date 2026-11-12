# API de TecnoHouse

Solución ASP.NET Core para abrir en Visual Studio: `TecnoHouse.Api.sln`.

## Qué incluye

- EF Core y Npgsql para conectarse a las tablas PostgreSQL existentes de Supabase (no crea ni migra tablas).
- Modelos para perfiles, técnicos, dispositivos, servicios, diagnósticos, cotizaciones, ítems, calificaciones, mensajes, fotos, notificaciones y productos.
- Mapeo de las relaciones y enums que ya aparecen en la base de datos.
- Controladores con GET y POST para esas tablas, además de GET de solo lectura para las vistas públicas.
- Validación del JWT de Supabase y paso de la identidad a PostgreSQL para que sigan aplicando las políticas RLS existentes.
- Scalar en desarrollo para explorar la API.

La autenticación de correo y contraseña sigue a cargo de Supabase Auth. Normalmente el trigger actual crea el perfil. `POST /api/perfiles` permite sincronizar los datos del perfil autenticado; usa el UUID del token y fija el rol `cliente` cuando debe crear una fila. Nunca recibe ni guarda contraseñas.

## Configuración local

1. Abre `backend/TecnoHouse.Api.sln` en Visual Studio.
2. En el Dashboard de Supabase abre tu proyecto y pulsa **Connect** en la parte superior. Copia la cadena de **Session pooler** (puerto 5432). Si eliges conexión directa, usa esa opción solo si tu red soporta IPv6 o tienes IPv4 habilitado. La guía oficial describe estas opciones y sus cadenas: https://supabase.com/docs/guides/database/connecting-to-postgres.
3. Convierte los valores de la URI copiada al formato Npgsql que usa el API. Conserva el host, puerto y usuario exactamente como aparecen (en Session pooler el usuario suele incluir el identificador del proyecto):
   `Host=<host>;Port=5432;Database=postgres;Username=<usuario-copiado>;Password=<contraseña-de-base-de-datos>;SSL Mode=Require;Trust Server Certificate=true`
4. Configura estos valores en **Project Properties → Debug → Environment variables**, en secretos de usuario o en el entorno de ejecución. No los guardes en Git:
   - `Supabase__Url`: URL del proyecto Supabase, por ejemplo `https://<ref>.supabase.co`.
   - `ConnectionStrings__TecnoHouse`: la cadena Npgsql del paso anterior.
5. Ejecuta el perfil `TecnoHouse.Api`. Scalar se abre en `http://localhost:5100/scalar/v1`.
6. En `TecnoHouse.Api.http`, agrega un access token de una sesión iniciada en la app y ejecuta GET/POST. Las políticas RLS determinan qué datos puede leer o insertar esa sesión.

También puedes configurar los secretos desde la carpeta `backend/TecnoHouse.Api`:

```powershell
dotnet user-secrets set "Supabase:Url" "https://<ref>.supabase.co"
dotnet user-secrets set "ConnectionStrings:TecnoHouse" "Host=<host>;Port=5432;Database=postgres;Username=<usuario-copiado>;Password=<contraseña>;SSL Mode=Require;Trust Server Certificate=true"
```

Los endpoints implementados son `GET` y `POST` bajo `/api/perfiles`, `/api/tecnicos`, `/api/dispositivos`, `/api/servicios`, `/api/diagnosticos`, `/api/cotizaciones`, `/api/cotizacion-items`, `/api/calificaciones`, `/api/mensajes-servicio`, `/api/servicio-fotos`, `/api/notificaciones` y `/api/productos`. El perfil actual también usa `PUT /api/perfiles/{id}`. Las vistas públicas usan `GET /api/tecnicos-publicos`, `/api/resenas-publicas` y `/api/productos-activos`.

## Datos pendientes de confirmar

Los modelos se contrastaron con las columnas, relaciones y enums compartidos desde Supabase. Las cuentas de `auth.users` se mantienen en Supabase Auth; el API modela las tablas y vistas del esquema `public`.
