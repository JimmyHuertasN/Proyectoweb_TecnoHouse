# Revisión visual y responsive — TecnoHouse

**Fecha:** 31 de octubre de 2026
**Rama:** `correcciones-como-funciona`

## Cambios aplicados

- Se añadió un estilo global consistente para el foco visible de enlaces, botones, campos y elementos desplegables.
- Se reforzó el foco visible de los campos de formulario, que tenían `outline-none` durante el foco normal.
- Se cambió el texto de los botones primarios a un tono oscuro para mejorar el contraste sobre el azul de marca.
- El menú móvil ahora identifica su botón controlador, mueve el foco al primer enlace al abrirse y devuelve el foco al botón al cerrarse.
- Se añadió `overflow-x-hidden` al cuerpo para evitar desplazamiento horizontal accidental en pantallas estrechas.
- Se conservaron los estados existentes de carga, error y vacío; no se introdujo una librería visual nueva.

## Comprobaciones realizadas

- El editor no reporta errores en [BarraNavegacion.jsx](./src/componentes/BarraNavegacion.jsx) ni [principal.css](./src/estilos/principal.css).
- `git diff --check` termina correctamente.
- `npm run lint` termina correctamente y conserva únicamente las cuatro advertencias ya conocidas en otros archivos.
- Los anclajes usados por la navegación pública tienen secciones correspondientes: `inicio`, `servicios`, `tecnicos`, `catalogo` y `ubicacion`.
- El modal de confirmación ya contaba con trampa de foco, cierre con Escape y restauración del foco.
- Los estados de skeleton, aviso, toast y tarjetas vacías ya incluyen roles o texto accesible; el cambio global de foco los cubre sin modificar su lógica.

## Comprobaciones pendientes en navegador

El build no puede ejecutarse con Node `18.19.1`; Vite/Rolldown requiere Node `20.19+`. Cuando exista un runtime compatible, comprobar manualmente:

- **Móvil, aproximadamente 360–430 px:** el menú abre sin desbordamiento, el foco queda visible, Escape lo cierra y el foco vuelve al botón; los botones de portada se apilan sin cortarse.
- **Tablet, aproximadamente 768–1024 px:** la navegación cambia correctamente entre menú móvil y navegación de escritorio; las tarjetas conservan separación y no generan scroll horizontal.
- **Escritorio, desde 1280 px:** la cabecera, grids, mapa, catálogo y tarjetas mantienen sus anchos máximos y no dejan espacios o solapamientos inesperados.
- Recorrido completo con teclado usando Tab y Shift+Tab en portada, FAQ, formulario de contacto, toast y modal.
- Comprobación con `prefers-reduced-motion` para confirmar que las animaciones de entrada y hover no dificultan la lectura.
- Verificación visual de contraste en navegador y, si es posible, con una herramienta de accesibilidad.
