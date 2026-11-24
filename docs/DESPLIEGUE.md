# Despliegue de TecnoHouse (Vercel + Railway)

**Actualizado:** 24 de noviembre de 2026
**Para quién:** el equipo y los asistentes de IA que trabajen en el proyecto. Lee la sección [Reglas para asistentes de IA](#reglas-para-asistentes-de-ia) antes de tocar algo de despliegue.

## Resumen

TecnoHouse se publica en dos partes:

| Parte | Dónde | Dirección | Qué contiene |
|---|---|---|---|
| Frontend (React + Vite) | Vercel, proyecto `tecnohouse` | https://tecnohouse-gules.vercel.app | Portada, tienda, reparaciones, paneles por rol |
| API (ASP.NET Core, .NET 10) | Railway, proyecto `tecnohouse-api`, servicio `api` | https://api-production-f41f01cc.up.railway.app | Perfiles, dispositivos, solicitudes, pedidos, pagos Wompi |
| Base de datos y autenticación | Supabase | (la del `.env` de cada uno) | Tablas, RLS, Auth, Storage, Realtime |

Vercel no puede ejecutar .NET; por eso la API vive en Railway, que la construye con `backend/Dockerfile`.

Estado actual: producción en Vercel muestra la rama `portada-para-talleres`, subida a mano con la CLI. **Vercel y Railway todavía no están conectados al repositorio de GitHub**: un push no publica nada por sí solo (ver [Conectar con el repositorio](#conectar-con-el-repositorio-pendiente)).

## Dónde vive cada secreto

Ningún secreto está en el repositorio, en la imagen de Docker ni en Vercel.

| Variable | Dónde está | ¿Es secreta? |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel (Production y Preview) y `.env` local | No, es pública por diseño |
| `VITE_SUPABASE_ANON_KEY` | Vercel (Production y Preview) y `.env` local | No: es la clave **publicable**; la protegen las políticas RLS |
| `VITE_API_URL` | Vercel (apunta a Railway) y `.env.local` (apunta a `localhost`) | No |
| `ConnectionStrings__TecnoHouse` | Solo en Railway (cifrada) y en `dotnet user-secrets` local | **Sí** |
| `Supabase__Url` | Railway y `user-secrets` | No |
| `Wompi__PublicKey` | Railway y `user-secrets` | No |
| `Wompi__PrivateKey`, `Wompi__IntegritySecret`, `Wompi__EventsSecret` | Solo en Railway (cifradas) y en `user-secrets` | **Sí** |
| `Wompi__ResultPageBaseUrl` | Railway: `https://tecnohouse-gules.vercel.app/pago/resultado` | No |
| `Cors__Origins__0` | Railway: `https://tecnohouse-gules.vercel.app` | No |

En Railway, el doble guion bajo (`__`) reemplaza los dos puntos de la configuración de .NET (`Wompi:PrivateKey` → `Wompi__PrivateKey`).

La conexión a la base usa el **pooler** de Supabase (`aws-0-us-east-1.pooler.supabase.com`), que funciona desde cualquier servidor (IPv4). La conexión directa `db.<proyecto>.supabase.co` es solo IPv6 y puede fallar desde Railway.

## Seguridad verificada

Al publicar se comprobó lo siguiente:

- **La API exige sesión.** Valida el JWT de Supabase en cada petición. Sin token, las rutas protegidas responden `401`. Solo son públicas las rutas de datos públicos (técnicos, productos activos, reseñas) y el webhook de Wompi.
- **El webhook de Wompi verifica la firma** (checksum con `Wompi__EventsSecret`): no se pueden fabricar pagos.
- **CORS cerrado.** La API solo acepta peticiones del navegador desde `https://tecnohouse-gules.vercel.app`. Desde cualquier otro origen, incluido `localhost`, se bloquean.
- **Sin documentación pública.** Scalar y OpenAPI solo se activan en desarrollo; en producción responden `404`.
- **Errores genéricos.** En producción la API no devuelve trazas ni detalles de SQL.
- **La imagen de Docker no tiene secretos.** `backend/.dockerignore` excluye `appsettings.*.json`, `secrets*.json`, `bin/` y `obj/`. El `appsettings.json` del repo va vacío.
- **Vercel solo recibe el frontend.** `.vercelignore` excluye `backend/`, `supabase/`, `docs/`, `.env` y `.env.*`.

La API tiene que estar en internet porque la llama el navegador de cada visitante. Eso no expone datos: sin sesión válida solo entrega lo que ya es público, y lo demás lo filtran RLS y los roles.

## Pasos manuales pendientes

1. **Supabase → Authentication → URL Configuration → Redirect URLs:** agregar `https://tecnohouse-gules.vercel.app/**`. Sin esto, los correos de confirmación de cuenta y de recuperación de contraseña llevan a `localhost`.
2. **Panel de Wompi → URL de eventos (webhook):** cambiar la URL de ngrok por `https://api-production-f41f01cc.up.railway.app/api/pagos/wompi/webhook`.

## Cómo volver a desplegar (mientras no haya conexión con GitHub)

Hace falta iniciar sesión una vez por equipo: `npx @railway/cli login` y `npx vercel login`. No hace falta instalar nada globalmente ni usar `sudo`.

### API (Railway)

Desde la carpeta `backend/`:

```bash
npx @railway/cli link            # una sola vez: proyecto tecnohouse-api, servicio api
npx @railway/cli up --service api --ci
```

Railway construye `backend/Dockerfile`. Para cambiar una variable: `npx @railway/cli variables --service api --set "Nombre=valor"` (eso redespliega solo). **No escribas valores secretos en archivos ni en el chat de una IA.**

Prueba rápida después de desplegar:

```bash
curl -i https://api-production-f41f01cc.up.railway.app/api/resenas-publicas   # 200
curl -i https://api-production-f41f01cc.up.railway.app/api/perfiles           # 401 (sin sesión)
```

### Frontend (Vercel)

> **Trampa conocida:** si la CLI de Vercel ve `backend/Dockerfile`, **reescribe `vercel.json`** por su cuenta, agrega una sección `services` con un servicio `backend` y el despliegue falla con `Service "backend" has root "backend" but that directory does not exist` (`ROOT_NOT_FOUND`). Pasa aunque `.vercelignore` excluya `backend/`.

Por eso el frontend se despliega desde una **copia limpia** que solo tiene lo necesario para el build:

```bash
mkdir /tmp/tecnohouse-frontend
cp -r index.html package.json package-lock.json vite.config.js vercel.json public src .vercel /tmp/tecnohouse-frontend/
cd /tmp/tecnohouse-frontend
npx vercel deploy --prod          # o sin --prod para una vista previa
```

La carpeta `.vercel/` (ignorada por Git) guarda el vínculo con el proyecto. Si no la tienes, ejecuta antes `npx vercel link --project tecnohouse` **dentro de la copia limpia**.

Después de cualquier `vercel link`:

- Revisa que `vercel.json` siga siendo exactamente este (sin `services`):

  ```json
  {
      "$schema": "https://openapi.vercel.sh/vercel.json",
      "framework": "vite",
      "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }]
  }
  ```

  La regla `rewrites` hace que las rutas de React (`/tienda`, `/cliente`…) no den 404 al recargar.

- Borra la línea `VERCEL_OIDC_TOKEN` que la CLI agrega a `.env.local`: es una credencial y no se usa.

Si el proyecto de Vercel queda con `framework: "services"`, se corrige en el panel (Settings → Build & Development → Framework Preset → Vite) o volviendo a crearlo desde la copia limpia.

## Conectar con el repositorio (pendiente)

Objetivo: que cada push se publique solo. Antes hay que resolver esto:

1. **Acceso al repositorio.** El repo `JimmyHuertasN/Proyectoweb_TecnoHouse` es de otra cuenta. Para conectarlo, el dueño debe instalar las apps de Vercel y de Railway en su GitHub y darles acceso al repo (o crear él los proyectos e invitar al resto). En el plan gratuito de Vercel los proyectos de equipo tienen límites; puede ser más simple que los administre el dueño del repo.
2. **Subir primero la configuración corregida.** `vercel.json` (versión de arriba) y `.vercelignore` tienen que estar en la rama antes de conectar; si no, Vercel puede volver a detectar el backend como servicio.
3. **Rama de producción.** Normalmente es `main`: cada merge a `main` actualiza `tecnohouse-gules.vercel.app`. Hoy producción muestra `portada-para-talleres`; si esa es la versión para la Expo Software, hay que hacer merge a `main` antes de conectar.
4. **Vistas previas y CORS.** Cada rama o PR recibe su propia URL. La API solo acepta el dominio de producción, así que las vistas previas quedarán bloqueadas hasta agregarlas al CORS. Usar la URL fija por rama que da Vercel (con la forma `tecnohouse-git-<rama>-tecno-house.vercel.app`) como `Cors__Origins__1`, `Cors__Origins__2`… **No permitir `*.vercel.app`**: cualquiera puede crear sitios con ese dominio.
5. **Supabase para vistas previas.** Agregar en *Redirect URLs* el patrón `https://*-tecno-house.vercel.app/**`.
6. **Railway desde GitHub.** Configurar *Root Directory* `backend` y *Watch Paths* `backend/**` para que los cambios del frontend no reinicien la API.

Las variables de entorno ya cargadas en Vercel (Production y Preview) y en Railway se conservan al conectar.

## Costos

- **Vercel:** plan gratuito (Hobby).
- **Railway:** crédito de prueba al inicio; después, alrededor de 5 USD al mes por mantener la API encendida.

## Reglas para asistentes de IA

Si eres una IA ayudando en este proyecto:

1. **Nunca** escribas, muestres ni subas valores de secretos (cadena de conexión, llaves privadas de Wompi, tokens de Vercel o Railway). Para cargarlos, léelos de `dotnet user-secrets` o del `.env` local y pásalos directo a la CLI sin imprimirlos.
2. **No hagas push ni conectes servicios a GitHub** sin que la persona lo pida explícitamente.
3. Antes de desplegar el frontend, **usa la copia limpia** y verifica que `vercel.json` no tenga `services`.
4. El primer despliegue de un proyecto nuevo en Vercel siempre va a Producción: **pide confirmación** antes.
5. **No abras el CORS** con comodines (`*`, `*.vercel.app`); agrega orígenes exactos.
6. No muevas Scalar ni OpenAPI fuera del bloque `IsDevelopment()` de `backend/TecnoHouse.Api/Program.cs`.
7. La API valida sesión y RLS: no agregues `[AllowAnonymous]` a controladores que lean o escriban datos privados.
8. Después de desplegar, comprueba al menos: el sitio responde `200`, una ruta protegida de la API responde `401` sin token y el CORS solo permite el dominio de Vercel.
