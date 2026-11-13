# Informe de revisión del proyecto — TecnoHouse

**Actualizado:** 12 de noviembre de 2026
**Alcance:** revisión estática del código, rutas, componentes, documentación y scripts SQL presentes en el repositorio. Se consideraron los cambios recientes de la tienda y del panel administrativo. No se ejecutaron pruebas ni se verificó una instancia de Supabase desplegada.

## Resumen ejecutivo

TecnoHouse reúne dos procesos relacionados: la atención de reparaciones y la venta de repuestos y accesorios. La parte de reparaciones cubre el recorrido del cliente, el técnico y el administrador; la tienda ya permite consultar productos, filtrarlos, ver su detalle y preparar un pedido para enviar por WhatsApp. El panel incorpora gestión de productos, inventario y una vista inicial de pedidos.

La principal limitación para presentar la tienda como un flujo comercial completo es que los pedidos no se guardan en la base de datos: la integración actual los deriva a WhatsApp. Por ello la lista administrativa de pedidos y los ingresos de tienda todavía no representan operaciones persistidas. También quedan datos de contacto y configuración de Supabase por confirmar antes de una publicación.

## Avances que aportan valor

- **Flujo de reparación de punta a punta.** El cliente registra dispositivos y solicitudes con fotos, consulta estados, conversa con el técnico, responde a la cotización y califica el servicio. El técnico toma solicitudes, documenta diagnóstico, cotiza y actualiza el progreso. El administrador supervisa y reasigna servicios. La cotización se puede descargar en PDF.
- **Seguimiento y comunicación.** Las fotos privadas, el chat del servicio, las notificaciones en tiempo real y la barra de progreso aportan trazabilidad y mantienen informado al cliente (`src/api/fotos.js`, `src/api/mensajes.js`, `src/api/notificaciones.js`).
- **Tienda pública funcional para consulta y contacto.** La portada separa tienda y reparaciones, muestra una vista previa de productos y ofrece accesos directos. La tienda incluye categorías, búsqueda, filtro de disponibilidad, orden por precio/nombre/fecha y detalle del producto (`src/paginas/Portada.jsx`, `src/paginas/tienda/Tienda.jsx`, `src/paginas/tienda/DetalleProducto.jsx`).
- **Carrito con límites de inventario.** El carrito persiste en el navegador, toma el precio vigente del producto y no permite agregar más unidades que el stock cargado. El pedido se compone con productos y total para abrir WhatsApp (`src/contexto/ProveedorTienda.jsx`, `src/componentes/tienda/CarritoLateral.jsx`, `src/utilidades/whatsapp.js`).
- **Operación administrativa ampliada.** El panel permite administrar productos, imágenes, precios y stock; tiene resúmenes de inventario y tienda, ingresos combinados en el dashboard, estadísticas por periodo y exportación CSV. Se añadió una sección de pedidos, aunque depende de una futura tabla en Supabase (`src/paginas/admin/`, `src/componentes/panel/ResumenTienda.jsx`, `src/api/pedidos.js`).
- **Base de seguridad y roles.** La aplicación protege las rutas por rol y delega el aislamiento de datos a políticas RLS y vistas públicas de Supabase. Esto depende de aplicar correctamente los scripts SQL del repositorio y configurar permisos en el proyecto correspondiente.
- **Documentación de puesta en marcha.** El README describe las rutas, roles, tecnología, variables de entorno, scripts SQL y comandos disponibles. `package.json` declara scripts de desarrollo, compilación, vista previa y lint.

## Pendientes y riesgos para la presentación

1. **Pedidos e ingresos de tienda aún no se registran.** `src/api/pedidos.js` devuelve una lista vacía y cero ingresos; no existe el esquema SQL de `pedidos` y `pedido_items`. El carrito abre WhatsApp, por lo que el cierre y la confirmación de la venta ocurren fuera de la aplicación. La pantalla `/admin/pedidos` es una estructura preparada, no una gestión operativa conectada a datos.
2. **El stock no se descuenta al vender.** El carrito limita cantidades según el stock leído, pero no hay confirmación transaccional ni descuento de inventario al completar una venta. El valor mostrado puede quedar desactualizado si hay compras concurrentes.
3. **Los destacados no tienen selección administrativa persistida.** La portada muestra productos disponibles en el orden recibido y tanto ella como el selector de tienda marcan el soporte de la columna `destacado` como pendiente (`src/paginas/Portada.jsx`, `src/paginas/tienda/Tienda.jsx`).
4. **Faltan datos públicos por validar.** En `src/datos/contacto.js`, el teléfono, WhatsApp y correo están marcados como configurados; el horario sigue sin confirmar, las redes no tienen URL y el comentario indica que las coordenadas son de referencia hasta validar la dirección. Confirmar la información directamente con el negocio antes de publicar o exponerla.
5. **La instalación depende de Supabase y de scripts SQL.** La aplicación requiere credenciales públicas válidas, URLs de autenticación, tablas, vistas, buckets y políticas. El README presenta un orden de scripts, pero no hay evidencia en el repositorio que confirme su aplicación o las políticas RLS del entorno de demostración.
6. **Filtros y paginación del panel se aplican sobre datos cargados.** Es adecuado para un volumen pequeño de demostración; con muchos registros convendría filtrar y paginar desde Supabase.
7. **No se declara un conjunto automatizado de pruebas.** El `package.json` incluye `lint`, pero no scripts de test. Esta revisión fue estática y no certifica funcionamiento visual, accesibilidad, reglas RLS ni flujos contra una instancia real.

## Recomendaciones priorizadas

### Antes de presentar o publicar

- Validar y completar los datos de contacto, horario, redes, dirección y coordenadas; comprobar que los enlaces de WhatsApp y correo correspondan al negocio.
- Preparar una instancia de Supabase de demostración con datos ficticios, ejecutar los scripts en el orden documentado y verificar permisos por rol.
- Demostrar explícitamente el límite actual de pedidos: armado del carrito y envío por WhatsApp. No presentar la lista administrativa ni los ingresos de tienda como datos reales mientras no exista persistencia.
- Recorrer en la demostración una reparación completa y, por separado, el flujo de consulta y pedido de la tienda.

### Siguiente mejora funcional

- Crear tablas `pedidos` y `pedido_items`, políticas RLS y una operación segura que valide stock y precios y descuente inventario de forma atómica al confirmar una venta. Añadir estados y conectar la pantalla administrativa y los ingresos a esos registros.
- Incorporar una columna `destacado` y controles administrativos para elegir productos de portada y prioridad en la tienda.
- Añadir una línea de tiempo unificada con diagnóstico, cotizaciones, cambios de estado y evidencia fotográfica antes/después para reforzar la trazabilidad de las reparaciones.
- Considerar un código QR de seguimiento público que exponga únicamente el estado y los próximos pasos, sin datos personales ni capacidad de modificar la solicitud.
- Revisar accesibilidad con teclado, foco visible, contraste y etiquetas; documentar el resultado junto con escenarios manuales reproducibles para cliente, técnico y administrador.

## Valor para Expo Software

La propuesta puede presentarse como una plataforma local que conecta el servicio técnico con la venta de repuestos: el cliente sigue una reparación, recibe y responde una cotización, y puede consultar productos desde la misma aplicación; el negocio administra técnicos, servicios e inventario desde un panel. El elemento diferenciador demostrable es la continuidad entre atención, seguimiento y operación del taller.

Para sostener esa presentación, conviene mostrar con claridad qué partes ya guardan información en Supabase y cuáles, como pedidos e ingresos de tienda, siguen dependiendo de WhatsApp o están pendientes de integración. Las mejoras sugeridas aumentan la demostrabilidad del producto, pero no garantizan selección o premio; eso depende de los criterios de Expo Software.
