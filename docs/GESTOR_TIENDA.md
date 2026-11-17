# Rol de gestor de tienda

Identificador: `gestor_tienda`. Nombre visible: **Gestor de tienda**. Panel: `/gestor-tienda`.

El gestor administra la tienda (productos, inventario, pedidos y reportes) sin ver nada de reparaciones ni de usuarios. El administrador conserva todos sus permisos y también ve las páginas de la tienda.

## Qué puede hacer

| Puede | No puede |
|---|---|
| Ver el resumen de la tienda | Entrar al panel del administrador (`/admin`) |
| Crear y editar productos, con hasta 8 fotos (JPG, PNG o WebP, máximo 3 MB cada una) | Gestionar usuarios, técnicos o permisos |
| Activar, desactivar y borrar productos (solo si no aparecen en pedidos) | Ver dispositivos, servicios, diagnósticos, cotizaciones o chats |
| Ajustar existencias y ver agotados y por reponer | Ver ingresos de reparaciones o estadísticas generales |
| Ver pedidos y cambiar su estado | Leer la lista de perfiles (solo ve el suyo y los técnicos, como cualquier usuario con sesión) |
| Escribir al comprador por WhatsApp | Cambiar su rol o el de otra cuenta |
| Ver reportes de la tienda y descargarlos en CSV | Subir archivos a otros buckets |
| Editar su nombre y teléfono | |

El registro público sigue creando solo clientes. Solo el administrador crea gestores.

## Rutas

| Ruta | Página | Archivo |
|---|---|---|
| `/gestor-tienda` | Resumen | `src/paginas/gestor/ResumenGestor.jsx` |
| `/gestor-tienda/catalogo` | Productos | `src/paginas/gestionTienda/GestionProductos.jsx` |
| `/gestor-tienda/inventario` | Inventario | `src/paginas/gestionTienda/Inventario.jsx` |
| `/gestor-tienda/pedidos` | Pedidos | `src/paginas/gestionTienda/PedidosTienda.jsx` |
| `/gestor-tienda/reportes` | Reportes | `src/paginas/gestionTienda/ReportesTienda.jsx` |
| `/gestor-tienda/perfil` | Mi perfil | `src/paginas/gestor/PerfilGestor.jsx` |

El administrador ve las mismas páginas de tienda en `/admin/catalogo`, `/admin/inventario`, `/admin/pedidos` y `/admin/reportes-tienda`, y administra los gestores en `/admin/gestores`. Los enlaces entre estas páginas usan `rutaTienda(rol, seccion)` para quedarse en el panel de quien las abre.

## Reglas de pedidos y stock

| Cambio | Stock |
|---|---|
| Crear pedido (queda `pendiente`) | No cambia |
| `pendiente` → `confirmado` | Se descuenta. Si no alcanza, se rechaza y el pedido sigue pendiente |
| `pendiente` → `cancelado` | No cambia |
| `confirmado` → `entregado` | No vuelve a descontarse |
| `confirmado` → `cancelado` | Las unidades vuelven una sola vez |
| `entregado`, `cancelado` | Estados finales |

- **Dos confirmaciones a la vez:** `cambiar_estado_pedido` bloquea el pedido (`FOR UPDATE`) y descuenta con `stock >= cantidad` en la misma sentencia. La segunda persona espera y ve el pedido ya confirmado. Dos pedidos distintos no pueden vender más unidades de las que hay.
- **Reintentos:** pedir el mismo estado que ya tiene el pedido no hace nada, así un doble clic no descuenta ni devuelve dos veces.
- **Ajustes de inventario:** el stock no se puede escribir directamente. Los botones − y + usan `ajustar_stock_producto`, que suma o resta sobre el valor real. Escribir una cantidad exacta usa `fijar_stock_producto`, que solo guarda si el stock sigue siendo el que se veía; si alguien lo cambió, avisa cuántas unidades hay ahora.
- **Historial:** cada línea del pedido guarda el nombre y el precio con los que se vendió.

## Fechas de los reportes

| Reporte | Qué fecha usa |
|---|---|
| Ingresos por pedidos entregados | Fecha en que el pedido pasó a entregado (`actualizado_en`; un entregado ya no cambia) |
| Productos más vendidos | La misma: pedidos entregados en el periodo |
| Pedidos por estado | Fecha de creación del pedido |
| Productos por reponer | Ninguna: inventario actual |

Los pendientes y confirmados nunca cuentan como ingreso. El valor del inventario (precio × stock) se muestra aparte y no es un ingreso.

## Scripts y orden de ejecución

En **Supabase → SQL Editor**, cada archivo en su propio *Run*:

| Paso | Script | Para qué |
|---|---|---|
| 1 | `supabase/rol_gestor_tienda.sql` | Agrega `gestor_tienda` al enum `rol_usuario`. Debe quedar guardado antes del paso 2. |
| 2 | `supabase/permisos_tienda.sql` | Permisos de productos, imágenes y pedidos para administrador y gestor, funciones de stock, `cambiar_estado_pedido` y administración de gestores. |
| 3 | `supabase/gestor_prueba.sql` | Solo en desarrollo: crea la cuenta de prueba del gestor. |
| 4 | `supabase/pruebas_gestor_tienda.sql` | Solo en desarrollo: verificaciones (ver abajo). |

En una base nueva, antes van `catalogo.sql` y `pedidos.sql`, y `datos_prueba.sql` ya incluye al gestor.

Todos se pueden repetir. Volver a ejecutar `catalogo.sql` o `pedidos.sql` no le quita el acceso al gestor: los permisos de la tienda solo están en `permisos_tienda.sql`.

**`pedidos.sql` reconstruido:** el README lo mencionaba, pero el archivo no estaba en el repositorio ni en el historial. Se reconstruyó el 2026-11-16 con consultas de solo lectura a la base del proyecto (columnas, restricciones, índices y funciones). La función `cambiar_estado_pedido` se movió a `permisos_tienda.sql`.

**Funciones privilegiadas:** todas usan `security definer` con `search_path = ''`, revisan dentro quién llama (`es_personal_tienda()` o `rol_actual() = 'admin'`) y solo `authenticated` puede ejecutarlas. El rol se lee de `perfiles`, nunca de metadatos que el usuario pueda editar. `rol_actual()` no se modificó y el trigger `proteger_rol_perfil` sigue impidiendo que alguien cambie su propio rol.

## Administración de gestores

En `/admin/gestores` el administrador puede:

- **Crear un gestor:** llama a `POST /api/gestores`. El API usa la API administrativa de Supabase Auth con la clave `Supabase:ServiceRoleKey`, que solo existe en el servidor (ver `backend/README.md`). Si el API no tiene esa clave, responde con un mensaje claro y no crea nada.
- **Dar acceso:** convierte en gestor una cuenta de **cliente** que ya existe. No cambia técnicos ni administradores.
- **Editar** nombre y teléfono.
- **Retirar acceso:** la cuenta vuelve a ser cliente y no se borra. Cada consulta revisa el rol en `perfiles`, así que aunque conserve su sesión (JWT) su siguiente operación en la tienda se rechaza. La interfaz lo saca del panel al volver a la pestaña.

No es un editor general de permisos: ninguna de estas acciones puede convertir a alguien en administrador.

## Cuenta de prueba (solo desarrollo)

| Campo | Valor |
|---|---|
| Nombre | Gestor de Tienda TecnoHouse |
| Correo | `gestor.tienda@tecnohouse.test` |
| Contraseña | `TecnoHouse2026` (la misma de las demás cuentas de `datos_prueba.sql`) |
| Rol | `gestor_tienda` |

`gestor_prueba.sql` busca la cuenta por correo: si existe no cambia su contraseña; si no existe la crea confirmada; y solo cambia el rol si la cuenta es cliente.

## Cómo probarlo

1. Ejecuta los scripts en el orden de arriba.
2. Inicia el API y la web (`README.md`).
3. Entra con la cuenta del gestor: debe llevarte a `/gestor-tienda`.
4. Recarga `/gestor-tienda/inventario`: la sesión se recupera y sigues en la misma página.
5. Abre `/admin` o `/cliente` con el gestor: te devuelve al inicio del sitio.
6. Abre `/gestor-tienda` sin sesión (te pide entrar) y con un cliente o un técnico (te devuelve al inicio).
7. Crea un producto con fotos, edítalo, cambia el orden de las fotos, desactívalo e intenta borrar uno que tenga pedidos.
8. En Inventario, usa − y + y escribe una cantidad exacta. Abre la misma página en otra pestaña con el administrador, cambia el stock allí y guarda en la primera pestaña: debe avisar que el stock cambió.
9. Confirma, entrega y cancela pedidos y revisa el stock después de cada paso.
10. Como administrador, retira el acceso al gestor mientras su sesión sigue abierta: su siguiente cambio en la tienda debe fallar.
11. Revisa las páginas a 360, 768 y 1440 px.

## Verificaciones

### Resultados (2026-11-16)

| Verificación | Resultado |
|---|---|
| `npm run lint` | Sin errores. Quedan las 3 advertencias que ya existían (`ChatServicio`, `GaleriaFotosServicio`, `useNotificaciones`). |
| `npm run build` | Correcto. |
| `dotnet build backend/TecnoHouse.Api.sln` | Correcto, sin advertencias. |
| Lectura del esquema remoto | Hecha con consultas de solo lectura: funciones de pedidos, políticas, enum, bucket y triggers. |
| Pasos 1 a 3 en la base del proyecto | Aplicados. Comprobado después: enum con `gestor_tienda`, cuenta del gestor confirmada, solo las políticas `*_tienda_*`, stock fuera de los permisos de escritura directa y trigger de protección al borrar. |
| `supabase/pruebas_gestor_tienda.sql` | **41 de 41 pruebas bien.** No dejó datos (siguen 10 pedidos y 12 productos). |
| Recorrido en el navegador (Chrome, cuentas de prueba) | **64 de 64 comprobaciones bien.** Detalle abajo. |

`supabase/pruebas_gestor_tienda.sql` cubre en una sola ejecución: pedidos pendientes sin descuento, bloqueo de cliente y técnico, lecturas y ajustes del gestor, rechazo de un stock viejo y de la escritura directa, todas las transiciones, reintentos, stock insuficiente, protección al borrar, bloqueo del gestor en reparaciones y perfiles, administración de gestores y pérdida de acceso con la sesión abierta. Al final borra el producto y los pedidos de prueba.

El recorrido en el navegador comprobó:

- **Acceso:** visitante enviado a `/login`; el inicio de sesión del gestor lleva a `/gestor-tienda`; recargar `/gestor-tienda/inventario` conserva la sesión; el gestor queda bloqueado en `/admin`, `/admin/gestores`, `/cliente` y `/tecnico`; "Mi panel" del encabezado público lleva a su panel.
- **Pantallas:** las seis páginas del gestor, a 360, 768 y 1440 px, sin errores ni desplazamiento horizontal.
- **Productos:** crear un producto con foto, editar precio y stock, desactivarlo y borrarlo (no tenía pedidos).
- **Inventario:** botones − y +; aviso cuando el administrador cambió el stock desde otra sesión mientras el gestor lo editaba; rechazo de un número negativo.
- **Concurrencia:** 20 ajustes simultáneos desde dos sesiones (+10 del gestor y −10 del administrador) dejaron el stock exacto; de dos cantidades exactas enviadas a la vez con el mismo valor visto, solo una se guardó.
- **Pedidos, reportes y perfil:** detalle del pedido con comprador y WhatsApp, filtro por estado, las cuatro secciones de reportes y editar el teléfono por el API.
- **Administrador:** ve al gestor en `/admin/gestores`. Sin `Supabase:ServiceRoleKey`, crear un gestor se rechaza con un mensaje claro y no crea la cuenta. Al retirar el acceso, la sesión abierta del gestor deja de leer productos de gestión y la interfaz lo saca del panel al volver a la pestaña; "Dar acceso" se lo devuelve. Sigue entrando a todas sus páginas.
- **Otros roles:** cliente y técnico entran a su panel y quedan bloqueados en `/gestor-tienda`.

Todo lo creado en estas pruebas se borró; la base terminó con los mismos 12 productos y 10 pedidos.

Las transiciones de pedidos se probaron en SQL y no en la interfaz, para no cambiar el estado de los pedidos que el equipo ya tenía.

### Limitaciones conocidas

- **Carrito de `main` y la base remota:** en la base del proyecto, la versión de `crear_pedido` sin datos de entrega está deshabilitada (responde "Esta firma ya no está habilitada"), pero `src/api/pedidos.js` de `main` todavía la usa. El flujo nuevo con datos de entrega y pagos está en la rama `pasarela-pagos`. Este trabajo no cambia la creación de pedidos.
- **Stock y código anterior:** después de `permisos_tienda.sql`, el stock solo cambia con las funciones nuevas. Una copia del proyecto sin estos cambios no podrá usar sus botones de stock hasta actualizarse.
- **Crear gestores desde la app** necesita `Supabase:ServiceRoleKey` en los secretos del API. Sin ella funciona **Dar acceso** con una cuenta de cliente existente.
- Las tablas de pedidos y productos del panel se desplazan horizontalmente dentro de su recuadro en celulares, igual que las demás tablas del panel.
