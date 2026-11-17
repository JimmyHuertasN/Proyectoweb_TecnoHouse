## Guía de trabajo TecnoHouse: prompts por fases

Luis Enrique Salgado Rangel

13 de noviembre de 2026

## Cómo usar esta guía

Esta guía convierte los hallazgos del análisis del proyecto en prompts que puedes pegar, uno por uno, en tu asistente de código (Claude Code u otro) abierto en la carpeta del proyecto.

- Trabaja en una rama nueva: git switch -c mejoras-final .

- Al empezar cada sesión pega primero las Reglas comunes y después el prompt de la fase.

- Sigue el orden. Cada fase termina con npm run lint , npm run build y un commit pequeño.

- Todo se prueba en un proyecto de Supabase de desarrollo con datos ficticios, nunca con datos reales.

- Las fases 5 y 6 son las únicas que tocan la base de datos, y solo para leer (fase 5) o para agregar tablas y funciones nuevas (fase 6). Nada existente se modifica ni se borra.

- El archivo pedidos.sql va adjunto a esta respuesta. Cópialo a supabase/pedidos.sql .


## Reglas comunes (pegar al inicio de cada sesión)

Estás trabajando en TecnoHouse (React 19, Vite 8, Tailwind 4, Supabase y una API ASP.NET Core en backend/). Reglas para todo lo que hagas:

- 1. Escribe código y comentarios en español, con el mismo estilo del proyecto (nombres en español, comentarios que explican el porqué).

- 2. No agregues dependencias nuevas sin pedirme permiso.

- 3. No modifiques ni borres ningún script existente de supabase/ ni nada de la base de datos existente. Si algo requiere un cambio en la base, solo puedes agregar un script nuevo y avisarme.

- 4. No leas, muestres ni cambies el archivo .env.

- 5. Haz cambios pequeños y explica en lenguaje sencillo qué cambió y por qué.

- 6. Al terminar ejecuta npm run lint y npm run build y dime el resultado. Si algo falla, corrígelo antes de decir que terminaste.

- 7. Si una instrucción no encaja con lo que ves en el código, dímelo en vez de inventar.

## Mapa de fases

| Fase Qué resuelve |   | Toca la base de datos |
| --- | --- | --- |
| 1 | Orden del repositorio y advertencias de lint | No |
| 2 | Login que no degrada admin y técnico a cliente No |   |
| 3 | Plan de la API (despliegue y arranque) | No |
| 4 | Endurecer el backend (DTOs y errores) | No |
| 5 | Guardar el esquema base en el repositorio | Solo lectura |
| 6 | Crear tablas y funciones de pedidos | Solo agrega |
| 7 | Capa de datos de pedidos ( pedidos.js ) | No |
| 8 | Carrito que registra el pedido | No |
| 9 | Pantalla de pedidos del administrador | No |
| 10 | Validación de punta a punta | No |
| 11 | Contacto y documentación final | No |
| 12 | Opcional: carga más rápida | No |


## Fase 1. Orden del repositorio

Para qué: que el build sea reproducible, que git deje de mostrar 181 archivos modificados solo por saltos de línea y que lint quede en cero.

Tarea: higiene del repositorio sin cambiar el comportamiento de la aplicación.

- 1. En package.json agrega engines con node >=20.19.0 y crea un archivo .nvmrc con el número 22.

- 2. Crea .gitattributes con `* text=auto eol=lf` y marca como binarios los png, jpg y webp. Luego explícame el comando para renormalizar (git add -- renormalize .) y ejecútalo solo después de confirmar que no hay trabajo sin guardar.

- 3. Antes de borrar, busca con grep quién importa src/componentes/PiePagina.jsx. Si nadie lo importa (el que se usa es src/componentes/inicio/PiePagina.jsx), elimínalo.

- 4. Corrige las 4 advertencias de oxlint, una por una y sin cambiar lo que ve el usuario: setState dentro de efectos en ChatServicio.jsx,

GaleriaFotosServicio.jsx y useNotificaciones.js, y el uso de new Date()

durante el render en inicio/PiePagina.jsx (muévelo fuera del componente, a

una constante del módulo).

- 5. Crea .env.example con las tres variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_TECNOHOUSE_API_URL) con valores de ejemplo, sin datos reales. Verifica que .gitignore cubra .env, node_modules, bin y obj. Criterio de terminado: npm run lint con 0 advertencias y npm run build correcto.

## Fase 2. Sesión: que un fallo de la API no cambie tu rol

Para qué: hoy obtenerPerfil pide a la API todos los perfiles y busca el tuyo. Si la API está caída, el error se esconde y el rol queda como cliente: un admin o técnico pierde el acceso, y al volver a la pestaña lo sacan del panel.


Archivos: src/api/usuarios.js (obtenerPerfil y obtenerPerfiles) y src/contexto/ProveedorSesion.jsx.

Problema: obtenerPerfil llama a /api/perfiles, descarga todos los perfiles y busca el propio. Si la API falla, el catch solo hace console.error y devuelve rol cliente.

## Haz esto:

- 1. Revisa con git log -p src/api/usuarios.js cómo se leía el perfil antes de usar la API y reutiliza esa consulta directa a la tabla perfiles, filtrando por id (solo la fila del usuario).

- 2. obtenerPerfil: usa esa consulta directa. Si falla, lanza un error con un mensaje claro. Nunca devuelvas rol cliente como valor por defecto cuando hubo un error; cliente solo si la fila existe y dice cliente.

- 3. ProveedorSesion: en onAuthStateChange y en el refresco al volver a la pestaña, si la lectura del perfil falla, conserva el usuario que ya estaba (sin cambiar su rol) y no lo expulses. En el inicio de sesión, muestra el error en pantalla.

- 4. obtenerPerfiles(ids): consulta solo esos ids con .in('id', unicos) en lugar de descargar todos los perfiles.

- 5. actualizarPerfil puede seguir usando la API si ya funciona; si prefieres, dime cuál es más simple y por qué.

No cambies tablas ni políticas de la base.

Prueba manual a describirme: (a) iniciar sesión como admin con la API apagada y entrar a /admin; (b) cambiar de pestaña y volver sin que cambie el rol.

## Fase 3. La API: cómo se arranca y dónde vive

Para qué: hoy la API solo corre en tu computador desde Visual Studio y el .env apunta a localhost. Antes de publicar hay que decidir dónde vivirá. Esta fase deja la API lista para ambos casos.


Tarea: preparar backend/TecnoHouse.Api para ejecutarse fuera de Visual Studio, sin cambiar su lógica.

- 1. Agrega un endpoint GET /health con [AllowAnonymous] que responda { estado: 'ok' } sin consultar la base.

- 2. Crea backend/Dockerfile de dos etapas (SDK 10 para compilar, ASP.NET 10 para ejecutar) que exponga el puerto 8080 y lea la configuración de variables de entorno: Supabase__Url, ConnectionStrings__TecnoHouse y Cors__Origins__0.

- 3. Crea backend/.dockerignore que excluya bin, obj y .vs.

- 4. En src/api/backend.js, cuando la API no responda (error de red), lanza un mensaje claro: 'No hay conexión con el servidor de TecnoHouse.' en vez del error técnico.

- 5. En el README agrega la sección 'Cómo levantar la API para la demo' con los pasos locales y otra 'Publicar la API' con las variables de entorno necesarias y recordando que VITE_TECNOHOUSE_API_URL debe apuntar a una dirección https cuando el sitio esté publicado.

- No incluyas contraseñas ni cadenas de conexión reales en ningún archivo. Termina con dotnet build en backend/ (si tienes .NET) y npm run build.

Decisión que debes tomar con tu equipo: si van a publicar el sitio, alojar la API en algún servicio que ejecute contenedores o .NET (Azure, Railway, Render u otro). Si solo van a presentar en vivo, basta con levantarla en el computador de la demo y probar el /health antes de empezar.

## Fase 4. Endurecer el backend

Para qué: los POST reciben la entidad completa. Quien llame a la API podría enviar campos que no debería (por ejemplo estado o técnico en un servicio nuevo). Hoy solo las políticas de la base lo frenan. La idea es cerrar también esa puerta en la API, como una segunda cerradura.


- Tarea: endurecer backend/TecnoHouse.Api sin cambiar la base de datos.

- 1. Revisa Controllers/ServiciosController.cs y los demás que hacen POST (Dispositivos, Diagnosticos, Cotizaciones, CotizacionItems, Calificaciones, MensajesServicio, ServicioFotos, Perfiles). Para cada uno dime qué campos acepta hoy del cliente y cuáles no debería aceptar.

- 2. Crea DTOs (clases pequeñas) solo con los campos que el cliente puede enviar. En POST /api/servicios: dispositivoId, problema, gravedad y categoria. El ClienteId sale del claim sub del token, el Estado inicial es solicitado y el TecnicoId queda vacío. Haz lo mismo, con el mismo criterio, para los demás POST (el dueño siempre sale del token, no del cuerpo).

- 3. Mantén las mismas rutas y los mismos nombres JSON que usa el frontend (clienteId, dispositivoId, etc.) para no romper src/api/solicitudes.js. Si hay que ajustar el frontend, hazlo en el mismo cambio.

- 4. Agrega GET /api/servicios/{id} para que el frontend no tenga que descargar todos los servicios para ver uno (obtenerSolicitud en src/api/solicitudes.js) y úsalo allí.

- 5. ApiExceptionMiddleware: además de DbUpdateException, captura cualquier otra excepción, regístrala con el logger y responde un JSON { error: 'Ocurrió un error inesperado.' } con estado 500, sin mostrar detalles internos. Las políticas RLS siguen siendo la autoridad final: no las reemplaces ni asumas que la API basta.

Termina con dotnet build y una lista de endpoints cambiados.

## Fase 5. Guardar el esquema base en el repositorio

Para qué: el repositorio no trae las tablas base (perfiles, servicios, dispositivos, diagnósticos, cotizaciones, calificaciones), la función rol_actual() , las funciones aceptar_servicio y responder_cotizacion , ni los triggers. Sin eso nadie del equipo puede montar su propia base ni revisar qué protege cada tabla.

Paso para ti (solo lectura, no cambia nada). En el SQL Editor de Supabase ejecuta estas consultas, una por una, y copia el resultado a un archivo de texto:


```
-- 1. Funciones del esquema public
select pg_get_functiondef(p.oid) as definicion
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f';
-- 2. Políticas de seguridad (RLS)
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies where schemaname in ('public', 'storage');
-- 3. Triggers de public y de auth.users
select event_object_schema, event_object_table, trigger_name,
action_timing, event_manipulation, action_statement
from information_schema.triggers
where event_object_schema in ('public', 'auth');
```

Para las tablas, ejecuta además supabase/esquema_para_api.sql (ya está en el repo) y guarda sus tres resultados. Si prefieres, pg_dump --schema-only --schema=public con la cadena de conexión de Supabase entrega todo en un solo archivo.

```
Te adjunto los resultados de las consultas de solo lectura sobre mi base de Supabase (funciones, políticas, triggers, columnas, llaves foráneas y enums). Tarea: crear supabase/00_esquema_base.sql que permita recrear el esquema en un proyecto vacío.
1. Ordena el script así: enums, tablas, llaves foráneas, funciones (incluida
rol_actual), triggers, activar RLS y políticas.
2. Usa create table if not exists, create or replace function y drop policy
if exists antes de cada create policy, igual que los scripts existentes, para
poder ejecutarlo varias veces.
3. Sin datos de ejemplo, sin contraseñas y sin DROP TABLE.
4. Si algo de lo que te pasé es ambiguo o falta (por ejemplo, el cuerpo de
una función), dímelo en una lista en vez de inventarlo.
5. Actualiza la tabla de scripts del README con el orden completo:
00_esquema_base.sql primero y después los demás.
6. Dame los pasos para probarlo en un proyecto de Supabase nuevo y vacío, y
qué consultas ejecutar para confirmar que quedó igual.
No ejecutes nada contra ninguna base; solo escribe el archivo.
```

Cuando el archivo esté, pruébalo en un proyecto de Supabase vacío (nunca sobre tu base actual).

## Fase 6. Crear las tablas de pedidos en Supabase

Para qué: que los pedidos del carrito se guarden de verdad.


## Qué hace pedidos.sql (adjunto):

- Crea dos tablas nuevas: pedidos y pedido_items . No modifica ninguna tabla, vista, política ni trigger existente.

- Nadie escribe directamente en ellas. Un visitante o cliente solo puede crear un pedido mediante la función crear_pedido , que toma el precio y el nombre desde productos (el navegador no puede cambiarlos) y rechaza productos inactivos o sin stock suficiente.

- Solo el administrador lee los pedidos y cambia su estado con cambiar_estado_pedido .

- Estados: pendiente, confirmado, entregado y cancelado. Al confirmar se descuenta el stock (si no alcanza, no se confirma y no se descuenta nada). Al cancelar un pedido confirmado se devuelve el stock.

- Es la única parte que escribe sobre datos existentes: el campo stock de productos , y solo cuando el administrador confirma o cancela.

## Pasos para ti:

- 1. Copia el archivo a supabase/pedidos.sql .

- 2. Supabase, SQL Editor, pega el contenido y pulsa Run. Hazlo primero en el proyecto de desarrollo. Se puede ejecutar varias veces sin error.

- 3. Verifica que quedó creado:

```
select to_regclass('public.pedidos') as pedidos,
to_regclass('public.pedido_items') as items;
select proname from pg_proc
where pronamespace = 'public'::regnamespace
and proname in ('crear_pedido', 'cambiar_estado_pedido');
```

Debe aparecer el nombre de las dos tablas y las dos funciones.

Cómo se probó: el script se ejecutó dos veces seguidas en un Postgres 16 local con tablas de reemplazo para productos y rol_actual() . Se comprobó que un visitante crea pedidos con el precio de la base, que se suman productos repetidos, que se rechazan pedidos sin stock o con datos inválidos, que un visitante no puede leer pedidos, que solo un admin cambia estados, que no se permiten saltos de estado, y que confirmar descuenta el stock y cancelar lo devuelve. No se ejecutó contra tu Supabase, por eso la fase 10 incluye pruebas reales.

## Detalles a conocer:

- El número de pedido ( numero ) puede saltarse valores cuando un intento falla por falta de stock. No es un error.


- Como cualquier visitante puede crear pedidos, alguien podría llenar la tabla de pedidos falsos. No afectan el stock (solo se descuenta al confirmar), pero el admin tendría que cancelarlos. Si luego quieren más protección, se agrega un límite de intentos o un captcha.

- Quedó fuera a propósito la columna destacado de productos , porque exige modificar esa tabla. Cuando decidan hacerlo, será un script aparte.

Acabo de agregar supabase/pedidos.sql. Léelo completo sin modificarlo. Tarea de documentación:

- 1. Agrega pedidos.sql a la tabla de scripts del README, después de catalogo.sql, con una línea que explique qué hace.

2. Actualiza la sección Datos del README: tablas pedidos y pedido_items, y

las funciones crear_pedido y cambiar_estado_pedido.

3. Borra del README la sección Pendiente de pedidos y stock (la de destacado

se queda).

No cambies el contenido del .sql.

## Fase 7. Capa de datos de pedidos

Para qué: src/api/pedidos.js hoy devuelve una lista vacía e ingresos en cero.


Archivos: src/api/pedidos.js. Léelo junto con src/api/productos.js (para ver el estilo con obtenerCliente y verificar), supabase/pedidos.sql y src/datos/estadosPedido.js.

Tarea: reemplazar las funciones vacías por la versión real, sin cambiar los nombres que ya usan Dashboard.jsx, ResumenTienda.jsx y PedidosTienda.jsx.

- 1. crearPedido({ nombre, telefono, notas, lineas }): llama con obtenerCliente().rpc('crear_pedido', { p_nombre, p_telefono, p_notas, p_items

- }) donde p_items es una lista de { producto_id, cantidad } sacada de las líneas del carrito. Devuelve { id, numero, total }. Los errores pasan por verificar() para que lleguen traducidos.

- 2. obtenerPedidos(): select de pedidos con sus pedido_items (por ejemplo .select('*, pedido_items(*)')) ordenado del más reciente al más antiguo. Devuelve objetos con: id, numero, clienteNombre, clienteTelefono, notas, estado, total (número), creadoEn, actualizadoEn e items [{ id, productoId, nombre, cantidad, precioUnitario }]. Solo el admin obtiene filas.

- 3. cambiarEstadoPedido(id, estado): rpc('cambiar_estado_pedido', { p_pedido_id, p_estado }).

- 4. obtenerIngresosTienda(desde, hasta): suma el total de los pedidos en estado entregado cuya fecha de actualización esté en el rango. Desde y hasta vienen como AAAA-MM-DD en hora local, y vacío significa sin límite: reutiliza el mismo helper de rango de fechas que usa src/api/admin.js (estaEnRango o el equivalente de src/utilidades/filtros.js).

- 5. Quita los comentarios PENDIENTE BASE de este archivo. No cambies la base. Termina con lint y build, y descríbeme cómo probar cada función desde la consola del navegador con una sesión de admin.

## Fase 8. El carrito registra el pedido

Para qué: hoy el carrito solo abre WhatsApp y el pedido no queda guardado. Ahora primero se guarda y después se avisa por WhatsApp con el número del pedido.


Archivos: src/componentes/tienda/CarritoLateral.jsx,

src/contexto/ProveedorTienda.jsx, src/utilidades/whatsapp.js, src/api/pedidos.js (ya tiene crearPedido). Tarea: que el botón del carrito guarde el pedido y luego ofrezca enviarlo por

WhatsApp.

- 1. En CarritoLateral agrega un formulario sencillo con nombre, teléfono y notas (opcional). Si hay sesión iniciada, precarga nombre y teléfono desde el usuario de useSesion. Valida en el navegador lo mismo que la base: nombre de 2 a 120 caracteres, teléfono de 7 a 20, notas hasta 500. Reutiliza src/utilidades/validaciones.js si sirve.

- 2. Botón 'Hacer pedido': deshabilítalo mientras se envía (sin doble envío), llama a crearPedido y, si sale bien, muestra una confirmación dentro del panel: 'Pedido #N registrado' con el total, y un botón o enlace 'Avisar por WhatsApp' (el navegador puede bloquear ventanas que se abren después de una espera, por eso no lo abras automáticamente). Después de registrar, vacía el carrito.

- 3. whatsapp.js: enlacePedido debe recibir el número de pedido e incluirlo en el mensaje. Si WhatsApp no está configurado, el pedido igual se registra y se muestra el mensaje de que el negocio lo contactará.

- 4. Si crear_pedido responde error de stock o de producto no disponible, muestra el mensaje con Aviso, recarga los productos y ajusta las cantidades del carrito al stock real.

- 5. ProveedorTienda: expón una función recargarProductos y llámala cada vez que se abre el carrito, para que el stock mostrado no quede viejo. Envuelve localStorage.setItem en try/catch (puede fallar en modo privado o con el almacenamiento lleno).

- 6. Quita el comentario PENDIENTE BASE de CarritoLateral y cambia el texto de ayuda: ya no es solo por WhatsApp.

Mantén la accesibilidad actual (foco, Escape, aria). Termina con lint y build, y descríbeme la prueba manual completa.


## Fase 9. Pantalla de pedidos del administrador

Archivos: src/paginas/admin/PedidosTienda.jsx, src/componentes/panel/ResumenTienda.jsx,

src/componentes/panel/IngresosTotales.jsx, src/datos/estadosPedido.js. Mira como ejemplo src/paginas/admin/TodosLosServicios.jsx (filtros y paginación) y src/hooks/useFiltroPaginado.js, useConfirmar.js y useToast.js.

Tarea: convertir /admin/pedidos en una gestión real, con el mismo estilo y los mismos componentes del resto del panel.

- 1. Quita el Aviso que dice que la sección está lista para cuando exista la tabla.

- 2. Mantén las 4 tarjetas por estado con sus conteos reales (pendiente, confirmado, entregado, cancelado).

- 3. Lista de pedidos con búsqueda por número o nombre del cliente, filtro por estado y paginación (reutiliza BarraFiltros, ResultadosPaginados y Paginacion). Cada fila muestra: número, cliente, teléfono, total, estado y fecha.

- 4. Detalle del pedido (puede ser una fila expandible o un modal): productos con cantidad, precio unitario y subtotal, notas, y enlace al WhatsApp del cliente.

- 5. Botones solo para las transiciones válidas: pendiente puede ir a confirmado o cancelado; confirmado puede ir a entregado o cancelado. Entregado y cancelado no muestran botones. Cada cambio pide confirmación con useConfirmar y avisa con un toast.

- 6. Cuando confirmar falle por falta de stock, muestra el mensaje que devuelve la base ('No hay stock suficiente de ...').

- 7. Tras cada cambio, recarga la lista. Si falla la carga muestra un error y no una lista vacía.

- 8. En ResumenTienda e IngresosTotales quita los textos y comentarios de 'pendiente' sobre la tabla de pedidos.

Termina con lint y build y dime qué probar.

## Fase 10. Validación de punta a punta

Para qué: hoy todas las filas de la checklist de VALIDACION_FINAL_Y_GUION_DEMO.md están en Pendiente. Esta fase las convierte en resultados reales.

Casos de pedidos para agregar a esa checklist:

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| Pedido normal | Visitante sin sesión agrega 2 | Aparece Pedido #N, el carrito se |
|   | productos y hace el pedido | vacía y el pedido está pendiente en |
|   |   | /admin/pedidos |


| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| Precio protegido Cambiar el precio de un producto |   | El total del pedido usa el precio de |
|   | en el panel antes de enviar | la base |
| Sin stock | Dejar el carrito abierto, bajar el | Mensaje claro, carrito ajustado y |
|   | stock a 0 desde el admin y enviar | ningún pedido creado |
| Confirmar | El admin confirma un pedido | Estado confirmado y el stock baja |
|   | pendiente | en la cantidad pedida |
| Confirmar sin | Bajar el stock y confirmar | Error con el nombre del producto y |
| stock |   | el stock no cambia |
| Cancelar | El admin cancela un pedido | Estado cancelado y el stock vuelve |
| confirmado | confirmado |   |
| Entregar | Confirmar y luego marcar | El ingreso aparece en el Dashboard |
|   | entregado | del periodo |
| Salto prohibido | Intentar pasar un pendiente a | Se rechaza (la base lo impide) |
|   | entregado |   |
| Permisos | Un cliente o visitante intenta leer | No ve ninguno |
|   | pedidos |   |

Tarea: preparar la validación final con evidencia real.

- 1. Abre VALIDACION_FINAL_Y_GUION_DEMO.md y agrega una sección 'Pedidos de la tienda' con los casos de la tabla que te pego, con las mismas columnas y el estado Pendiente.

- 2. Crea docs/RESULTADOS_VALIDACION.md con una tabla vacía (caso, fecha, quién lo probó, resultado, observaciones) para que yo la llene al ejecutar cada fila.

- 3. Revisa que cada flujo tenga ruta, rol y datos de prueba claros (usa las cuentas de supabase/datos_prueba.sql).

- 4. No marques nada como Aprobado: solo yo lo hago después de probarlo en el navegador contra Supabase de desarrollo.

[pega aquí la tabla de casos]

Luego ejecuta tú la checklist completa (historia de reparación y pedidos) y anota los resultados. Si algo falla, abre un commit por cada corrección.


## Fase 11. Contacto y documentación final

Tarea: dejar la documentación y los datos públicos coherentes con el estado real del proyecto.

- 1. README.md: actualiza la lista de funcionalidades (pedidos con estados y stock), el árbol de scripts SQL y quita lo que ya no está pendiente. Deja la sección Pendiente solo con lo que realmente falte (por ejemplo, la columna destacado).

- 2. Actualiza INFORME_REVISION_EXPOSOTWARE.md: mueve los puntos 1 y 2 de pendientes a avances, con fecha de hoy, sin afirmar nada que no esté probado.

- 3. Lista en un archivo docs/PENDIENTES_CONTACTO.md los datos que debo confirmar con el negocio (horario, redes, dirección y coordenadas, correo). No inventes valores y no cambies src/datos/contacto.js todavía.

- 4. Agrega al README una nota breve: la dirección actual es de referencia hasta confirmarla.

No cambies código de la aplicación en esta fase.

## Fase 12 (opcional). Carga más rápida

El build genera un único archivo de unos 720 kB (200 kB comprimido). Tarea: dividir la carga sin cambiar el comportamiento.

- 1. En src/Aplicacion.jsx carga con lazy y Suspense las páginas de los paneles de administrador y técnico (igual que ya está GestionProductos), dejando la portada, la tienda y el inicio de sesión en el paquete principal.

- 2. Usa el mismo Skeleton como respaldo de carga.

- 3. Ejecuta npm run build y compárame los tamaños antes y después. No cambies rutas ni nombres de componentes.

## Al terminar

- npm run lint sin advertencias y npm run build correcto con Node 22.

- Base nueva reproducible con 00_esquema_base.sql y los demás scripts, incluido pedidos.sql .

- Checklist de validación con resultados reales.

- Un pedido de prueba recorrido completo: carrito, base, panel del admin, stock e ingresos.

Puntos que siguen abiertos y requieren decisión del equipo: dónde se aloja la API si publican el sitio, la protección contra pedidos falsos, la columna destacado y los datos públicos del negocio.
