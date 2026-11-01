# Plan de acción para pulir TecnoHouse

## Contexto previo

TecnoHouse ya cuenta con una base funcional amplia para una plataforma de servicio técnico: portada pública, autenticación con Supabase, perfiles por rol, paneles de cliente/técnico/administrador, solicitudes de reparación, dispositivos, diagnósticos, cotizaciones, reseñas, fotos, chat, notificaciones, catálogo, estadísticas y exportación CSV.

El objetivo de esta etapa no es agregar funciones grandes sin control, sino convertir lo existente en una experiencia coherente, demostrable y confiable. La prioridad será cerrar cabos sueltos visibles, mejorar los recorridos principales, validar los estados de interfaz y dejar una demo reproducible.

### Situación conocida

- La portada todavía muestra un marcador de posición en la sección de catálogo, aunque el componente real ya existe.
- Los datos de contacto contienen valores pendientes de confirmar y enlaces de redes sociales ficticios o incompletos.
- La aplicación depende de varias migraciones, vistas, buckets y políticas de Supabase que deben verificarse en conjunto.
- El lint termina con advertencias relacionadas con pureza durante el render y actualización de estado dentro de efectos.
- El build no pudo completarse con el Node disponible: la versión instalada es Node 18.x y la cadena actual de Vite/Rolldown requiere una exportación de `node:util` que esa versión no proporciona.
- No hay todavía un flujo automatizado de pruebas ni una lista de aceptación de la demo declarada en `package.json`.

### Áreas principales del proyecto

- Rutas y composición: `src/Aplicacion.jsx`, `src/principal.jsx`.
- Portada pública: `src/paginas/Inicio.jsx`, `src/componentes/inicio/`.
- Sesión y roles: `src/contexto/`, `src/componentes/RutaProtegida.jsx`, `src/api/usuarios.js`.
- Paneles: `src/paginas/panel/`, `src/paginas/tecnico/`, `src/paginas/admin/`.
- Datos y Supabase: `src/api/`, `supabase/`.
- Estilos: `src/estilos/principal.css` y clases utilitarias usadas por los componentes.
- Documentación: `README.md`, `GUIA_CAMBIOS_PROYECTO.md` e `INFORME_REVISION_EXPOSOTWARE.md`.

## Resultado esperado

Al finalizar este plan, TecnoHouse debe poder presentarse con una portada completa, información real o claramente validada, recorridos principales consistentes para los tres roles, estados de carga/error/vacío bien resueltos, una instalación de Supabase documentada, un entorno de build reproducible y una lista de verificación que permita repetir la demo sin improvisar.

## Orden de trabajo

1. Preparar una línea base técnica y confirmar el entorno.
2. Completar la portada pública y corregir contenido pendiente.
3. Revisar la experiencia transversal: navegación, estados, formularios y responsive.
4. Auditar los recorridos de cliente, técnico y administrador.
5. Revisar Supabase, permisos, migraciones y datos de demostración.
6. Corregir advertencias de calidad y estabilizar el build.
7. Ejecutar una validación final y preparar el guion de presentación.

No se debe pasar a una fase posterior si una fase anterior deja errores funcionales sin documentar. Cada prompt debe producir cambios pequeños, verificables y fáciles de revisar.

---

## Prompts de trabajo

Los siguientes prompts están escritos para usarse uno por uno con un agente de código. Se recomienda copiar el contexto común junto con el prompt de la fase correspondiente.

### Prompt 1 — Línea base y diagnóstico técnico

> Actúa como responsable técnico de una aplicación React 19 + Vite + Supabase llamada TecnoHouse. Antes de modificar archivos, inspecciona la estructura del proyecto, el estado de Git, `package.json`, la configuración de Node, las rutas principales y los scripts SQL. Ejecuta los comandos de lint y build disponibles. Clasifica cada hallazgo como bloqueante, importante o cosmético. No implementes todavía cambios funcionales.
>
> Entrega un informe breve con: (1) comandos ejecutados y resultado, (2) errores reales frente a advertencias, (3) dependencia de versión de Node o paquetes, (4) módulos que requieren configuración de Supabase, (5) riesgos de seguridad o datos, y (6) orden recomendado de corrección. No inventes resultados de una base de datos que no puedas consultar.

**Criterio de cierre:** existe una línea base escrita y se distingue claramente lo que puede corregirse en código de lo que requiere configuración externa.

### Prompt 2 — Completar el catálogo público

> Revisa cómo se obtiene y presenta el catálogo en `src/componentes/inicio/SeccionCatalogo.jsx`, cómo se consultan los productos en `src/api/productos.js` y cómo se integra la portada en `src/paginas/Inicio.jsx`. Sustituye únicamente el marcador de posición de la sección de catálogo por el componente real, conservando el diseño visual y la navegación existente.
>
> Verifica estados de carga, error, lista vacía, filtros, imagen de respaldo, precio y enlace de contacto por WhatsApp. Asegúrate de que la sección tenga un `id` estable, un encabezado accesible y que no solicite datos innecesarios antes de ser visible si el diseño actual permite evitarlo. No cambies el modelo de datos ni las políticas de Supabase sin justificarlo.
>
> Después ejecuta lint y build. Si el build está bloqueado por el entorno de Node, documenta exactamente el bloqueo y valida al menos la consistencia estática del cambio.

**Criterio de cierre:** la portada ya no contiene el texto de marcador; el catálogo funciona visualmente en carga, éxito, error y vacío.

### Prompt 3 — Validar contenido público y contacto

> Audita `src/datos/contacto.js`, `SeccionContacto`, `SeccionUbicacion`, el pie de página y cualquier enlace que use teléfono, correo, WhatsApp, dirección, horario o redes sociales. Separa los datos que deben ser confirmados por el propietario de los errores de implementación.
>
> No inventes datos reales. Reemplaza valores de prueba solo cuando exista una fuente confirmada en el proyecto; de lo contrario, centraliza los pendientes de forma clara y evita que textos como `[URL INSTAGRAM PENDIENTE]` se presenten como enlaces funcionales. Verifica formato de teléfono, `mailto`, enlace de WhatsApp, mapa, etiquetas accesibles y comportamiento en móvil.
>
> Propón una lista corta de datos que el propietario debe confirmar antes de publicar y actualiza la documentación para que ese requisito no se pierda.

**Criterio de cierre:** ningún enlace público lleva a una URL ficticia o rota por diseño, y los datos pendientes quedan identificados en un único lugar.

### Prompt 4 — Pulido visual y responsive

> Realiza una revisión visual y de experiencia sobre la portada y los componentes compartidos. Analiza jerarquía de títulos, contraste, espaciado, foco de teclado, navegación móvil, botones, tarjetas, modales, toast, skeletons y mensajes de error/vacío. Mantén la identidad visual actual de TecnoHouse y evita introducir una librería de componentes nueva.
>
> Implementa solo mejoras justificadas y reutilizables. Prioriza problemas que afecten comprensión, interacción o legibilidad. Añade etiquetas accesibles y estados de foco donde falten. Comprueba que el contenido no se desborde en pantallas pequeñas y que los enlaces de anclaje de la portada lleguen a secciones reales.
>
> Revisa el resultado en anchos aproximados de móvil, tablet y escritorio y deja anotados los casos que no puedan comprobarse automáticamente.

**Criterio de cierre:** la portada y los componentes comunes son utilizables con teclado y en pantallas pequeñas, sin regresiones visuales evidentes.

### Prompt 5 — Auditoría del flujo del cliente

> Audita el recorrido completo del cliente: registro o inicio de sesión, confirmación, recuperación de contraseña, panel, perfil, dispositivo, creación de solicitud, fotos, detalle, chat, cotización, aprobación o rechazo y calificación.
>
> Para cada pantalla verifica permisos, carga, error, vacío, validación de formulario, prevención de doble envío, mensajes de éxito, navegación de regreso y actualización de datos después de una mutación. Comprueba que el cliente solo pueda ver y modificar lo que corresponde a su cuenta según las consultas y políticas existentes.
>
> Corrige únicamente defectos confirmados. No cambies estados de negocio ni contratos de Supabase sin rastrear todos los consumidores. Añade una lista de escenarios manuales reproducibles con precondiciones y resultado esperado.

**Criterio de cierre:** el recorrido del cliente puede ejecutarse de principio a fin con datos de prueba y cada fallo recuperable comunica qué ocurrió.

### Prompt 6 — Auditoría de técnico y administrador

> Audita por separado los recorridos del técnico y del administrador. Para el técnico revisa disponibilidad, solicitudes pendientes, toma de servicio, asignaciones, diagnóstico, cotización, estados, chat y cierre. Para el administrador revisa métricas, clientes, técnicos, productos, servicios, reasignación, filtros, paginación, exportación y permisos.
>
> Busca especialmente transiciones de estado inválidas, acciones visibles para roles equivocados, datos obsoletos después de guardar, botones sin confirmación, filtros que no reinician la paginación, exportaciones que no respetan los filtros y estados vacíos ambiguos. Valida que las decisiones importantes tengan confirmación y que los errores de Supabase no se oculten.
>
> Implementa correcciones pequeñas y añade una matriz de permisos y transiciones aceptadas. Si el comportamiento actual depende de RLS, indícalo explícitamente.

**Criterio de cierre:** cada rol tiene un recorrido de demo claro y no aparecen acciones de otro rol ni transiciones de negocio incoherentes.

### Prompt 7 — Supabase, seguridad y datos de demostración

> Revisa todos los scripts de `supabase/` y compáralos con las llamadas de `src/api/`. Documenta el orden de ejecución, dependencias, tablas, vistas, buckets, triggers, funciones y políticas RLS. Identifica scripts que no sean idempotentes o cuyo orden pueda dejar una instalación incompleta.
>
> Verifica que nunca se use una clave secreta en el frontend, que los datos públicos expongan solo los campos necesarios, que los archivos privados se sirvan mediante políticas adecuadas y que los usuarios no puedan cambiar su propio rol. Revisa también el script de datos de prueba para que sus cuentas y contraseñas no se confundan con credenciales de producción.
>
> Actualiza `README.md` con una guía reproducible de configuración y una tabla de verificación. No ejecutes migraciones destructivas ni borres datos existentes.

**Criterio de cierre:** una persona nueva puede preparar una instancia de desarrollo siguiendo el README y entiende qué controles deben comprobarse en Supabase.

### Prompt 8 — Calidad de React, lint y build reproducible

> Corrige las advertencias de calidad detectadas por Oxlint solo después de entender cada caso. Revisa especialmente fechas calculadas durante el render, actualizaciones de estado sincrónicas dentro de efectos y efectos que puedan duplicar suscripciones o provocar renders innecesarios. Conserva el comportamiento observable.
>
> Revisa la versión de Node requerida por Vite/Rolldown y decide, con base en los archivos de configuración y lockfile, si corresponde documentar una versión mínima, actualizar el entorno o ajustar dependencias. No hagas una actualización masiva sin separar causa y efecto.
>
> Ejecuta lint y build después de cada grupo pequeño de cambios. Si el entorno local no cumple la versión requerida, deja un diagnóstico accionable y una forma reproducible de validar el build en la versión correcta.

**Criterio de cierre:** lint sin advertencias nuevas y build exitoso en un entorno compatible, o bloqueo documentado con versión exacta y comando de reproducción.

### Prompt 9 — Validación final y guion de demo

> Prepara una validación final de TecnoHouse usando datos ficticios. Define cuentas de demostración separadas para cliente, técnico y administrador, sin reutilizar credenciales reales. Ejecuta una historia principal: cliente crea solicitud, técnico la toma y diagnostica, prepara cotización, cliente responde, se completa el servicio, cliente califica y administrador consulta el resultado.
>
> Comprueba también catálogo público, contacto, notificación, chat, fotos, exportación y responsive. Registra para cada paso: precondición, acción, resultado esperado, resultado observado y evidencia. Clasifica cualquier fallo como bloqueante para la demo, importante o pendiente.
>
> Crea un guion de presentación de aproximadamente tres minutos que explique el problema, muestre la trazabilidad del servicio y cierre con el valor para cliente, técnico y administrador. No presentes métricas o datos como reales si son de prueba o estimados.

**Criterio de cierre:** existe una checklist repetible y un guion breve que otra persona puede seguir sin depender de improvisación.

---

## Reglas para aplicar cada prompt

- Leer primero los archivos implicados y localizar todos los consumidores antes de editar.
- Mantener el alcance del prompt; no agregar funciones nuevas durante una corrección puntual.
- Preferir cambios pequeños y reversibles.
- Ejecutar lint y, cuando el entorno lo permita, build después de cada bloque.
- No modificar secretos ni incluir valores privados en commits, capturas o documentación pública.
- No afirmar que Supabase funciona sin verificar la instancia o registrar claramente que solo se hizo revisión estática.
- Registrar en este documento o en un informe de validación cualquier pendiente que dependa de una decisión del propietario.

## Definición de terminado

TecnoHouse estará listo para la siguiente etapa cuando:

- la portada muestre el catálogo real y no marcadores;
- contacto, mapa y redes estén confirmados o marcados de forma no engañosa;
- los tres roles puedan completar su recorrido principal;
- las pantallas tengan estados de carga, error y vacío coherentes;
- las políticas y migraciones necesarias estén documentadas;
- lint y build estén validados en un entorno compatible;
- exista una checklist de demo con datos ficticios y resultados observables.
