# Validación final y guion de demo

## 1. Alcance y criterio de evidencia

Esta checklist está preparada para una instancia de desarrollo de Supabase con datos ficticios. No debe ejecutarse sobre producción. Cada paso debe registrarse como:

- **OK**: se observó el resultado esperado y existe evidencia reproducible.
- **Importante**: la demo puede continuar, pero el comportamiento afecta una función visible o una decisión de negocio.
- **Bloqueante**: no permite completar la historia principal.
- **Pendiente**: depende de configuración externa, credenciales, RLS, archivos o confirmación del propietario.

La validación estática ejecutada el **2026-11-01** fue:

| Comprobación | Resultado observado | Clasificación | Evidencia |
|---|---|---|---|
| `npm run lint` | Termina sin errores; conserva cuatro advertencias React preexistentes | Importante | Salida de consola: `ChatServicio`, `GaleriaFotosServicio`, `PiePagina`, `useNotificaciones` |
| `npm run build` | No termina con Node 18: Rolldown solicita `node:util.styleText` | Bloqueante para build local | Actualizar Node a la versión compatible con Vite/Rolldown |
| `git diff --check` | Sin errores de espacios | OK | Salida de Git |
| Historia contra Supabase | No ejecutada en esta sesión | Pendiente | Requiere URL, RLS, RPC, Storage y una instancia de desarrollo accesible |

## 2. Cuentas y datos ficticios

Usar solo en una base de desarrollo creada para la demo. El script [datos_prueba.sql](./supabase/datos_prueba.sql) crea estas cuentas confirmadas:

| Rol | Correo ficticio | Uso en la demo |
|---|---|---|
| Cliente | `maria.lopez@tecnohouse.test` | Crear solicitud, responder cotización y calificar |
| Técnico | `ana.torres@tecnohouse.test` | Tomar servicios de celulares y avanzar el flujo |
| Administrador | `admin@tecnohouse.test` | Consultar métricas, servicios, técnicos y exportación |

El script documenta la contraseña temporal de desarrollo. No reutilizarla en producción, no registrar credenciales reales en este archivo y borrar o rotar las cuentas al terminar la presentación. Para una ejecución repetible, preparar una instancia vacía o añadir un dispositivo nuevo a María; el script trae solicitudes de ejemplo y puede impedir crear otra solicitud sobre un dispositivo que ya tiene una reparación activa.

### Preparación

1. Configurar `.env` con una URL y clave pública de Supabase de desarrollo.
2. Ejecutar las migraciones indicadas en [README.md](./README.md), incluidas funciones RPC, políticas RLS, notificaciones y fotos.
3. Ejecutar [datos_prueba.sql](./supabase/datos_prueba.sql).
4. Confirmar que existen al menos un producto activo, un dispositivo libre de María y un técnico disponible.
5. Abrir la aplicación con `npm run dev` y comprobar que la URL de autenticación vuelve al origen local.
6. Para fotos, preparar al menos una imagen pequeña asociada al servicio de la historia.

## 3. Historia principal de extremo a extremo

| # | Precondición | Acción | Resultado esperado | Resultado observado | Evidencia | Estado |
|---:|---|---|---|---|---|---|
| 1 | Supabase de desarrollo configurado; sesión cerrada | Iniciar sesión como María | Entra en `/cliente` y solo ve menú de cliente | Registrar durante ejecución | Captura de `/cliente` y menú visible | Pendiente |
| 2 | María tiene un dispositivo sin servicio activo | Abrir “Nueva solicitud”, completar equipo, categoría, gravedad y descripción válida | Se crea una solicitud en `solicitado` y aparece en sus solicitudes | Registrar código `TH-xxxx` | Código y tarjeta de solicitud | Pendiente |
| 3 | Solicitud en `solicitado`; Ana está disponible | Cerrar sesión e iniciar como Ana | Entra en `/tecnico`; la solicitud aparece en pendientes | Registrar durante ejecución | `/tecnico/pendientes` y código | Pendiente |
| 4 | Solicitud pendiente visible | Confirmar “Tomar servicio” | Solicitud pasa a `asignado`, desaparece de pendientes y aparece en “Mis servicios” | Registrar estado y mensaje | Toast + tarjeta en `/tecnico/servicios` | Pendiente |
| 5 | Servicio asignado a Ana | Abrir detalle y confirmar “Iniciar diagnóstico” | Confirmación previa; estado `en_diagnostico`; aparece formulario de diagnóstico | Registrar estado | `/tecnico/servicios/:id` | Pendiente |
| 6 | Servicio en diagnóstico | Guardar hallazgos y recomendación | Diagnóstico aparece después de guardar y el formulario de cotización queda habilitado | Registrar texto visible | Lista de diagnósticos | Pendiente |
| 7 | Diagnóstico guardado | Agregar ítems válidos y enviar cotización | Se crea cotización, el servicio pasa a `cotizado` y desaparecen las acciones de diagnóstico | Registrar total y estado | Tarjeta de cotización | Pendiente |
| 8 | Cliente tiene cotización pendiente | Iniciar como María y abrir la solicitud | María ve total, ítems y acciones aprobar/rechazar; no ve acciones del técnico | Registrar menú y tarjeta | `/cliente/solicitudes/:id` | Pendiente |
| 9 | Cotización pendiente | Aprobar con confirmación | Servicio pasa a `aprobado`, se notifica al técnico y la cotización queda aprobada | Registrar notificación | Campana y estado | Pendiente |
| 10 | Servicio aprobado | Ana abre el detalle y confirma iniciar reparación | Estado `en_reparacion`; no aparece una acción de cliente o administrador | Registrar estado | `/tecnico/servicios/:id` | Pendiente |
| 11 | Servicio en reparación | Ana confirma “Marcar como finalizado” | Estado `finalizado`; el cliente puede calificar | Registrar estado | Barra de progreso | Pendiente |
| 12 | Servicio finalizado | María califica de 1 a 5 con comentario | Calificación guardada, estado `calificado`, no se permite duplicarla | Registrar mensaje y estado | Detalle cliente + perfil técnico | Pendiente |
| 13 | Servicio con participantes | Enviar mensaje desde cliente y técnico | Ambos ven el chat actualizado; el administrador solo puede leer | Registrar autor y hora | Chat y notificación | Pendiente |
| 14 | Servicio con archivo en Storage | Subir o asociar una foto desde el rol permitido | Participantes ven URL firmada; usuario ajeno no puede leerla | Registrar miniatura | Galería de fotos | Pendiente |
| 15 | Historia terminada | Iniciar como administrador y abrir el servicio | Admin ve cliente, técnico, diagnóstico, cotización, chat de solo lectura y estado final | Registrar ausencia de campo de envío | `/admin/servicios/:id` | Pendiente |

### Pruebas de rechazo dentro de la historia

| Caso | Acción | Resultado esperado | Estado |
|---|---|---|---|
| Carrera de toma | Dos técnicos confirman la misma solicitud | Solo uno la toma; el otro recibe error y no duplica asignación | Pendiente |
| Estado obsoleto | Abrir el mismo servicio en dos pestañas y avanzar dos veces | La segunda operación falla y pide actualizar | Pendiente |
| Cotización inválida | Enviar ítem vacío, precio negativo o sin diagnóstico | No se guarda cotización ni se cambia el estado | Pendiente |
| Reasignación inválida | Admin intenta técnico inactivo/no disponible o servicio finalizado | Se rechaza con mensaje claro | Pendiente |
| Rol equivocado | Cliente abre `/admin` o técnico abre `/cliente` | Redirección sin mostrar acciones del otro rol | Pendiente |

## 4. Comprobaciones complementarias

| Área | Precondición y acción | Resultado esperado | Resultado observado/evidencia | Estado |
|---|---|---|---|---|
| Catálogo público | Abrir `/#catalogo`, esperar carga y buscar por nombre/categoría | Productos activos, precio, stock, imagen y vacío filtrado son comprensibles; el CTA abre WhatsApp | La bandera `CONTACTO.whatsappConfigurado` quedó centralizada en [contacto.js](./src/datos/contacto.js); falta validar el clic en navegador | Pendiente |
| Contacto | Abrir `/#contacto`, completar formulario y probar canales | Los canales configurados funcionan; los pendientes no parecen enlaces activos | Correo tiene formato; horario, redes y datos públicos requieren confirmación del propietario | Pendiente |
| Ubicación | Abrir `/#ubicacion` | Dirección/mapa solo se muestran como definitivos si están confirmados | Hay dirección de referencia y coordenadas pendientes de confirmar | Pendiente |
| Notificaciones | Provocar asignación, cambio de estado y mensaje | Cada participante recibe aviso pertinente; admin no recibe acciones de edición | Depende de triggers y RLS de `supabase/notificaciones.sql` | Pendiente |
| Chat | Enviar desde cliente y técnico; abrir como admin | Participantes escriben; admin lee sin formulario | Implementado en [ChatServicio.jsx](./src/componentes/panel/ChatServicio.jsx); falta prueba contra RLS | Pendiente |
| Fotos | Cargar, listar y abrir una foto | URL firmada válida para participantes; error visible si Storage niega acceso | Depende de bucket/políticas de [fotos_servicio.sql](./supabase/fotos_servicio.sql) | Pendiente |
| Exportación | Admin aplica texto, estado y fechas; exporta | CSV contiene todas las coincidencias filtradas, no solo la página visible | Código usa `paginado.filtrados`; falta ejecución con datos reales | Pendiente |
| Paginación | Ir a una página alta y cambiar filtros | La página vuelve a 1 y el contador coincide | Implementado en [useFiltroPaginado.js](./src/hooks/useFiltroPaginado.js) | OK estático |
| Responsive | Probar 390 px, 768 px y 1440 px; navegar con teclado | Menú, tablas, formularios, modal, chat y CSV siguen siendo utilizables | Requiere revisión visual manual; no se certifica por consola | Pendiente |

## 5. Fallos clasificados

### Importantes

- El build no puede certificarse con Node 18 porque la versión instalada de Rolldown requiere `node:util.styleText`. La demo puede probarse con el servidor de desarrollo si arranca, pero la entrega debe validarse con una versión compatible de Node.
- El botón de WhatsApp quedó habilitado mediante `CONTACTO.whatsappConfigurado`; falta comprobar manualmente que el número abre el chat correcto en el dispositivo de demo.
- Las cuatro advertencias de lint de React no bloquean el flujo, pero conviene resolverlas antes de publicar.

### Pendientes externos

- Ejecutar la historia contra Supabase y adjuntar capturas de cada estado.
- Verificar RPC `aceptar_servicio` y `responder_cotizacion`, triggers de notificación, políticas RLS y Storage.
- Confirmar teléfono, WhatsApp, horario, dirección, coordenadas, redes y correo público en [contacto.js](./src/datos/contacto.js).

No se deben presentar como métricas reales los totales del dashboard, calificaciones, ingresos ni cantidades del CSV: todos los valores de esta validación son ficticios o dependen de la instancia de desarrollo.

## 6. Guion de presentación — aproximadamente tres minutos

### 0:00–0:30 · Problema

“TecnoHouse organiza una reparación completa en un solo recorrido. El cliente puede describir su falla y seguirla; el técnico trabaja con una cola clara y estados controlados; el administrador supervisa la operación sin intervenir en las acciones de los otros roles. Todo lo que veremos usa datos ficticios de desarrollo.”

### 0:30–1:20 · Cliente y técnico

1. Entrar como María y mostrar el panel del cliente.
2. Crear una solicitud con un equipo, gravedad y descripción concreta. Señalar el código generado y el estado `Solicitado`.
3. Cambiar a Ana. Mostrar la solicitud pendiente, confirmar “Tomar servicio” y enseñar que pasa a “Mis servicios”.
4. Abrir el detalle, confirmar el inicio del diagnóstico, registrar hallazgos y enviar una cotización con dos ítems.
5. Volver a María, aprobar la cotización y mostrar que la respuesta actualiza el estado y genera notificación.

Frase de transición: “La trazabilidad no depende de mensajes informales: cada decisión queda asociada al servicio y al rol que puede ejecutarla.”

### 1:20–2:05 · Reparación, chat y cierre

1. Regresar a Ana y confirmar “Iniciar reparación”.
2. Mostrar el chat entre cliente y técnico y, si está preparado, una foto del servicio.
3. Confirmar “Marcar como finalizado”.
4. Volver a María, calificar con cinco estrellas ficticias y mostrar el estado `Calificado`.

Remarcar: “Las confirmaciones aparecen antes de los cambios importantes y los estados no permiten saltos incoherentes.”

### 2:05–2:45 · Administrador

1. Entrar como administrador y mostrar métricas etiquetadas como datos de prueba.
2. Abrir servicios, filtrar por estado/texto/fecha y cambiar de página.
3. Abrir el servicio terminado: mostrar cliente, técnico, diagnóstico, cotización y chat en solo lectura.
4. Abrir técnicos y productos para mostrar disponibilidad, confirmaciones y catálogo.
5. Exportar el resultado filtrado y mencionar que el CSV usa todas las coincidencias, no solo la página actual.

### 2:45–3:00 · Cierre de valor

“Para el cliente, el beneficio es claridad y seguimiento. Para el técnico, una cola priorizada y un flujo de trabajo sin ambigüedades. Para el administrador, visibilidad, permisos separados y reportes operativos. El siguiente paso antes de publicar es ejecutar esta misma checklist en Supabase con RLS, Storage y datos reales confirmados por el propietario.”

## 7. Registro de ejecución para la presentación

Al completar la demo, duplicar esta tabla en una copia fechada y sustituir `Pendiente` por `OK`, `Importante` o `Bloqueante`, agregando enlaces a capturas o el código de servicio:

| Fecha | Persona que ejecuta | Instancia/proyecto | Código de servicio | Pasos OK | Fallos | Evidencias |
|---|---|---|---|---|---|---|
| AAAA-MM-DD | Nombre | Supabase desarrollo | TH-xxxx | 0/15 | — | Carpeta o enlaces |
