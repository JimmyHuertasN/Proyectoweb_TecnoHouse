# Informe breve de revisión — TecnoHouse

**Fecha de revisión:** 31 de octubre de 2026
**Alcance:** revisión estática del código fuente, rutas, componentes, APIs, configuración y scripts SQL del árbol compartido. No se modificó código ni se ejecutaron pruebas.

## Qué aporta valor al proyecto

- **Resuelve un flujo completo de reparación.** El cliente registra equipos y solicitudes; el técnico toma casos, documenta diagnósticos, cotiza y avanza estados; el cliente responde a la cotización y califica el servicio. Esto muestra una solución de negocio de punta a punta, no solo una página informativa (`src/paginas/panel/`, `src/paginas/tecnico/`, `src/paginas/admin/`).
- **Da seguimiento y transparencia.** Fotos privadas por servicio, chat entre cliente y técnico, notificaciones en tiempo real, historial de estados y PDF de cotización ayudan a reducir la incertidumbre y dejan evidencia del proceso (`src/api/fotos.js`, `src/api/mensajes.js`, `src/api/notificaciones.js`, `src/utilidades/generarCotizacionPdf.js`).
- **Incluye operación administrativa real.** El administrador gestiona servicios, clientes, técnicos y productos, y dispone de dashboard, estadísticas por periodo y exportación CSV (`src/paginas/admin/`, `src/api/admin.js`).
- **Tiene una base razonable de seguridad de datos.** La aplicación separa roles y consultas; los scripts definen políticas RLS para catálogo, fotos, chat y notificaciones, además de reglas para proteger los roles. La efectividad depende de que esos scripts estén aplicados al proyecto Supabase correspondiente (`supabase/`).
- **La interfaz cubre estados y dispositivos distintos.** Hay vistas adaptables, estados de carga, errores, confirmaciones, mensajes de resultado, búsqueda y paginación. El registro e inicio de sesión incluyen confirmación por correo y recuperación de contraseña.
- **La portada explica el servicio y ofrece contacto.** Incluye servicios, técnicos, reseñas, preguntas frecuentes, ubicación y contacto; `src/componentes/BarraNavegacionAutenticacion.jsx` mantiene la marca y una salida clara a la portada durante login y registro.

## Hallazgos que conviene atender antes de presentarlo

1. **El catálogo público todavía es un marcador de posición.** Aunque `SeccionCatalogo.jsx` ya implementa productos, filtros y enlaces a WhatsApp, `src/paginas/Inicio.jsx` muestra el texto “El componente de catálogo se agregará aquí” y conserva un comentario TODO. La gestión del catálogo en el panel sí está implementada, pero el visitante aún no ve esos productos en la portada.
2. **Hay datos de contacto pendientes de validar.** `src/datos/contacto.js` contiene valores entre corchetes y enlaces de redes sociales pendientes; las coordenadas se describen como referencia de prueba. Antes de una demostración pública, hay que sustituir o confirmar esos datos para que contacto y mapa no parezcan ficticios.
3. **La puesta en marcha depende de Supabase.** El README explica variables de entorno y algunos scripts, pero el repositorio también contiene scripts de catálogo, técnicos, chat y notificaciones. Conviene preparar una instalación demostrable y documentar el orden y estado de todas las migraciones y políticas necesarias.
4. **Los filtros y la paginación trabajan sobre listas ya cargadas.** Es suficiente para una demostración pequeña; con muchos servicios o productos convendría pasar búsqueda, filtros y paginación al servidor para no descargar toda la lista.
5. **No hay un flujo automatizado de pruebas declarado en `package.json`.** Para una muestra ante jurados, una lista corta de escenarios repetibles (cliente, técnico y administrador) y evidencia de sus resultados daría más confianza. La presente revisión fue estática y no certifica el funcionamiento en una instancia real de Supabase.

## Qué agregar — sin contar el chatbot con IA

### Prioridad alta para la Expo

- **Seguimiento público con código QR.** Al crear una solicitud, generar un QR que abra una página de consulta con código del servicio y una vista segura de estados, fechas y próximos pasos. Así un jurado puede probar el valor del producto en segundos desde su teléfono. No exponer datos personales ni permitir cambios desde esa página.
- **Línea de tiempo con evidencia antes/después.** Ordenar en una sola vista los cambios de estado, diagnóstico, cotización, aprobación y fotos; añadir fotos finales del equipo entregado. Esto amplía la evidencia que ya guardan las fotos y el historial y permite contar claramente qué hizo el taller.
- **Demo preparada y guion de 3 minutos.** Cargar datos ficticios coherentes y cuentas de demostración por rol; presentar un caso desde solicitud hasta cierre, luego mostrar la notificación al cliente y el indicador administrativo. Evita depender de registros en vivo o de datos personales durante la exposición.

### Prioridad media

- **PWA instalable y avisos del navegador.** Permitir instalar la aplicación y recibir avisos de cambios importantes; definir con cuidado qué información se conserva sin conexión y pedir permiso para notificaciones. Esto vuelve tangible el seguimiento en el celular.
- **Panel de impacto y operación.** Mostrar tiempo de respuesta, reparaciones cerradas, satisfacción, equipos recuperados y, si se registra con un método transparente, residuos electrónicos evitados. Etiquetar claramente estimaciones y periodos para que las cifras sean defendibles.
- **Accesibilidad verificable.** Revisar navegación completa por teclado, contraste, foco visible, etiquetas de formularios y lectura con tecnologías de asistencia; presentar los resultados de esa revisión como parte de la calidad del producto.

## Recomendación de presentación

La propuesta más convincente es posicionar TecnoHouse como un sistema de **trazabilidad y confianza para servicios técnicos**: mostrar QR de seguimiento, evidencia del diagnóstico y reparación, y avisos al cliente mientras el administrador ve métricas. Antes de agregar más módulos, completaría el catálogo público, validaría contacto y coordenadas, y dejaría una demo estable con datos ficticios.

Ninguna mejora puede asegurar un cupo: la decisión depende de los criterios de selección de la universidad, que no están incluidos en el proyecto. Estas propuestas sí hacen más fácil demostrar el problema atendido, el flujo funcional y el valor diferencial ante un jurado.
