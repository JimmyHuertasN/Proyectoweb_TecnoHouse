# Auditoría del flujo del cliente

**Fecha:** 31 de octubre de 2026
**Rama:** `correcciones-como-funciona`
**Alcance:** revisión estática de autenticación, rutas, páginas del panel, hooks, APIs y componentes del recorrido cliente. No se ejecutó contra una instancia real de Supabase.

## Resultado de la auditoría

| Área | Resultado | Observación |
|---|---|---|
| Registro | Corregido | El formulario permitía múltiples envíos mientras Supabase respondía. Ahora bloquea el botón y comunica el estado. |
| Inicio de sesión | Corregido | El formulario permitía múltiples intentos simultáneos. Ahora bloquea el botón durante la petición y limpia el aviso de confirmación anterior. |
| Confirmación de correo | Conforme estáticamente | La ruta procesa carga, error de enlace, sesión existente y sesión ausente. Requiere URL de retorno configurada en Supabase. |
| Recuperación de contraseña | Conforme estáticamente | Valida correo, evita doble envío y muestra resultado sin revelar si la cuenta existe. |
| Nueva contraseña | Conforme estáticamente | Valida longitud y coincidencia, bloquea el guardado y comunica errores. Requiere enlace válido de Supabase. |
| Protección de rutas | Conforme estáticamente | `RutaProtegida` espera la sesión, redirige al login y limita por rol. Las consultas dependen adicionalmente de RLS. |
| Perfil | Conforme estáticamente | Valida datos, bloquea guardado, actualiza el contexto y muestra toast de éxito. |
| Dispositivos | Conforme estáticamente | Las consultas filtran por `cliente_id`; crear, editar y eliminar actualizan la lista local y manejan errores. |
| Nueva solicitud | Conforme estáticamente | Valida dispositivo, categoría, gravedad, descripción y fotos; bloquea doble envío y conserva un aviso si falla la carga de fotos. |
| Detalle de solicitud | Conforme estáticamente | Consulta la solicitud filtrada por cliente, carga historial/cotización/técnico y ofrece navegación de regreso. |
| Fotos | Conforme estáticamente | Valida tipo, tamaño y cantidad; las URLs son firmadas y la galería maneja carga, vacío y error. |
| Chat | Conforme estáticamente | Lista, suscribe y envía mensajes con límite de longitud, estado de envío y error recuperable. |
| Cotización | Corregido | Tras calificar, el formulario ya no se muestra si el historial confirma una calificación existente. |
| Aprobación/rechazo | Conforme estáticamente | Usa confirmación, bloquea acciones durante la petición, muestra error y recarga el detalle. |
| Calificación | Conforme estáticamente | Valida puntuación, bloquea envío y maneja duplicado desde la API. La interfaz ahora evita ofrecerlo después de calificar. |

## Correcciones aplicadas

- Se añadió estado de envío a [IniciarSesion.jsx](./src/paginas/IniciarSesion.jsx) y [Registro.jsx](./src/paginas/Registro.jsx) para prevenir peticiones duplicadas.
- Se añadió una comprobación derivada del historial en [DetalleSolicitud.jsx](./src/paginas/panel/DetalleSolicitud.jsx) para no mostrar una segunda calificación.
- Todo el código añadido para estas correcciones incluye comentarios explicativos.

## Seguridad y alcance de datos

- Las consultas de dispositivos y solicitudes filtran por el usuario autenticado.
- La consulta de una solicitud individual usa simultáneamente el id de la solicitud y `cliente_id`.
- Las operaciones de mensajes, fotos, cotizaciones y calificaciones dependen de las políticas RLS y de las funciones SQL existentes; esta auditoría no puede certificar esas políticas sin una instancia Supabase accesible.
- No se cambiaron estados de negocio, nombres de columnas, RPC ni contratos de Supabase.

## Escenarios manuales reproducibles

### A. Registro y confirmación

**Precondición:** Supabase configurado, confirmación de correo activa y un correo de prueba no registrado.

1. Abrir `/registro`.
2. Completar nombre, correo, teléfono y dos contraseñas iguales.
3. Pulsar `Crear cuenta` dos veces rápidamente.
4. Confirmar que solo se procesa un envío, el botón muestra `Creando cuenta...` y aparece el mensaje de confirmación.
5. Abrir el enlace recibido y comprobar `/correo-confirmado`.

**Resultado esperado:** se crea una sola cuenta, el enlace lleva a la aplicación y la ruta muestra la opción correcta para entrar o ir al panel.

### B. Inicio de sesión y redirección

**Precondición:** cuenta de prueba confirmada y una ruta protegida conocida, por ejemplo `/cliente/perfil`.

1. Abrir directamente `/cliente/perfil` sin sesión.
2. Confirmar redirección a `/login`.
3. Iniciar sesión pulsando varias veces el botón.
4. Comprobar que el botón se desactiva y aparece `Entrando...`.

**Resultado esperado:** se realiza un solo inicio de sesión y se vuelve a la ruta protegida solicitada dentro del panel cliente.

### C. Recuperación y cambio de contraseña

**Precondición:** cuenta de prueba con correo accesible y URL de recuperación permitida en Supabase.

1. Abrir `/recuperar` con un correo inválido y verificar el error local.
2. Enviar un correo válido y comprobar que el botón se bloquea durante la petición.
3. Abrir el enlace recibido, introducir dos contraseñas distintas y verificar el error.
4. Repetir con contraseñas iguales de al menos 8 caracteres.

**Resultado esperado:** la contraseña se actualiza una sola vez y el usuario entra al panel cliente.

### D. Perfil y dispositivos

**Precondición:** sesión de cliente activa.

1. Abrir `/cliente/perfil` y editar nombre o teléfono.
2. Pulsar guardar varias veces.
3. Comprobar el toast de éxito y que los datos visibles se actualicen.
4. Crear, editar y eliminar un dispositivo desde `/cliente/dispositivos`.
5. Intentar eliminar un dispositivo asociado a una solicitud activa.

**Resultado esperado:** las mutaciones no se duplican; la lista se actualiza; el equipo en uso no se elimina y se explica el motivo.

### E. Nueva solicitud y fotografías

**Precondición:** cliente con al menos un dispositivo, sin solicitud activa para ese equipo.

1. Abrir `/cliente/solicitudes/nueva`.
2. Probar envío sin dispositivo, categoría o descripción suficiente.
3. Adjuntar un archivo no permitido, uno mayor de 3 MB y más de tres imágenes.
4. Completar el formulario y pulsar `Crear solicitud` varias veces.
5. Revisar el detalle de la solicitud y la galería.

**Resultado esperado:** las validaciones aparecen sin crear registros inválidos; se crea una sola solicitud; las fotos válidas se muestran y un fallo de Storage queda informado sin ocultar la solicitud creada.

### F. Cotización, chat y calificación

**Precondición:** datos de prueba con una solicitud en estado cotizado y un técnico asignado.

1. Abrir el detalle de la solicitud.
2. Descargar la cotización y comprobar que el PDF se genera.
3. Aprobar o rechazar y pulsar varias veces durante la confirmación.
4. Enviar un mensaje vacío y luego uno válido desde el chat.
5. Finalizar el servicio desde el flujo del técnico.
6. Calificar con 0 estrellas, luego con una puntuación válida.
7. Recargar el detalle.

**Resultado esperado:** cada acción se procesa una sola vez, los errores son visibles, el detalle se actualiza y el formulario de calificación no vuelve a aparecer después de guardar una calificación.

## Pendientes que requieren entorno real

- Ejecutar estos escenarios con la base de datos de prueba y las políticas RLS aplicadas.
- Verificar que las RPC `responder_cotizacion` y los triggers de estado funcionen con las transiciones esperadas.
- Comprobar Storage privado, URLs firmadas y Realtime del chat.
- Ejecutar el build con Node `20.19+`, ya que Node 18 no es compatible con la versión instalada de Vite/Rolldown.
