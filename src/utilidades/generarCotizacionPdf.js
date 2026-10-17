/* Genera una vista de impresión con los datos completos de una cotización. */
import { ESTADOS_COTIZACION, buscarOpcion } from "../datos/opciones.js";
import { formatearFecha, formatearPesos } from "./formato.js";

// Codifica los valores antes de insertarlos en el documento de impresión.
const escaparHtml = (valor = "") => String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

// Evita dejar celdas vacías cuando falta información opcional.
const mostrarDato = (valor) => escaparHtml(valor || "No registrado");

/* Abre la cotización en una hoja imprimible para guardarla como PDF desde el navegador. */
const generarCotizacionPdf = ({ cotizacion, servicio, cliente = servicio?.cliente }) => {
    // Prepara los datos de cabecera y los catálogos con el formato del documento.
    const codigo = servicio?.codigo || "TH-0000";
    const dispositivo = servicio?.dispositivo ?? {};
    const estado = buscarOpcion(ESTADOS_COTIZACION, cotizacion.estado).etiqueta;
    const items = cotizacion.items ?? [];
    // Construye las filas de ítems; la cantidad se asume en uno en el modelo actual.
    const filas = items.map((item) => {
        // Las cotizaciones actuales no guardan cantidad; por ahora cada concepto equivale a una unidad.
        const cantidad = Number(item.cantidad) > 0 ? Number(item.cantidad) : 1;
        const precio = Number(item.precio) || 0;
        return `<tr>
            <td>${mostrarDato(item.concepto)}</td>
            <td class="numero">${cantidad}</td>
            <td class="numero">${formatearPesos(precio)}</td>
            <td class="numero">${formatearPesos(precio * cantidad)}</td>
        </tr>`;
    }).join("");

    // Abre una pestaña imprimible; si el navegador bloquea ventanas, informa al usuario.
    const ventana = window.open("", "_blank");
    if (!ventana) throw new Error("Permite las ventanas emergentes para preparar la cotización en PDF.");
    ventana.opener = null;

    // El título del documento se usa como nombre sugerido por el diálogo de impresión.
    ventana.document.open();
    ventana.document.write(`<!doctype html>
        <html lang="es">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>cotizacion-${escaparHtml(codigo)}</title>
            <style>
                /* Estilos de marca y distribución del documento para pantalla e impresión. */
                * { box-sizing: border-box; }
                body { margin: 0; background: #eef2f7; color: #172033; font: 14px Arial, sans-serif; }
                main { width: min(210mm, 100%); min-height: 297mm; margin: 24px auto; padding: 18mm; background: white; }
                .marca-linea { display: flex; align-items: center; gap: 10px; }
                .logo { width: 42px; height: 42px; }
                .marca { color: #00aaff; font-size: 25px; font-weight: 800; letter-spacing: 1px; }
                .marca span { color: #111c31; }
                .subtitulo { margin-top: 5px; color: #64748b; font-size: 12px; }
                .cabecera { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 22px; border-bottom: 2px solid #00aaff; }
                h1 { margin: 0 0 8px; font-size: 24px; }
                h2 { margin: 24px 0 10px; font-size: 15px; }
                p { margin: 5px 0; line-height: 1.45; }
                .referencia { text-align: right; }
                .codigo { color: #0088cc; font-size: 16px; font-weight: 700; }
                .bloques { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 22px; }
                .bloque { padding: 14px; border: 1px solid #dbe3ed; border-radius: 8px; }
                .bloque h2 { margin: 0 0 9px; }
                .campo { color: #64748b; }
                table { width: 100%; border-collapse: collapse; margin-top: 22px; }
                th, td { padding: 10px 8px; border-bottom: 1px solid #dbe3ed; text-align: left; }
                th { background: #f1f7fb; color: #334155; font-size: 12px; }
                .numero { text-align: right; white-space: nowrap; }
                .total { display: flex; justify-content: space-between; margin-top: 18px; padding: 14px; background: #f1f7fb; font-size: 18px; font-weight: 700; }
                .estado { display: inline-block; padding: 6px 10px; border-radius: 20px; background: #e0f2fe; color: #075985; font-weight: 700; }
                .nota { margin-top: 28px; color: #64748b; font-size: 11px; }
                .acciones { display: flex; justify-content: center; gap: 10px; padding: 14px; }
                button { padding: 10px 16px; border: 0; border-radius: 6px; background: #00aaff; color: white; cursor: pointer; font-weight: 700; }
                /* Ajusta la salida al tamaño de papel A4 y oculta los controles al imprimir. */
                @page { size: A4; margin: 0; }
                @media print {
                    body { background: white; }
                    main { width: 210mm; min-height: 297mm; margin: 0; }
                    .acciones { display: none; }
                }
                /* Conserva la legibilidad de la vista previa en pantallas pequeñas. */
                @media screen and (max-width: 600px) {
                    main { min-height: 100vh; margin: 0; padding: 24px; }
                    .cabecera { flex-direction: column; }
                    .referencia { text-align: left; }
                    .bloques { grid-template-columns: 1fr; gap: 12px; }
                    table { font-size: 12px; }
                    th, td { padding: 8px 4px; }
                }
            </style>
        </head>
        <body>
            <main>
                <!-- Incluye marca, logo y datos identificadores de la cotización. -->
                <header class="cabecera">
                    <div>
                        <div class="marca-linea">
                            <img class="logo" src="${escaparHtml(`${window.location.origin}/tecnohouse.svg`)}" alt="Logo TecnoHouse" />
                            <div class="marca">TECNO<span>HOUSE</span></div>
                        </div>
                        <div class="subtitulo">Servicio técnico especializado</div>
                    </div>
                    <div class="referencia">
                        <h1>Cotización</h1>
                        <p class="codigo">Servicio ${escaparHtml(codigo)}</p>
                        <p><span class="campo">Fecha:</span> ${escaparHtml(formatearFecha(cotizacion.creadaEn))}</p>
                        <p><span class="campo">Estado:</span> <span class="estado">${escaparHtml(estado)}</span></p>
                    </div>
                </header>

                <!-- Presenta por separado la información del cliente y del dispositivo. -->
                <section class="bloques">
                    <div class="bloque">
                        <h2>Datos del cliente</h2>
                        <p><span class="campo">Nombre:</span> ${mostrarDato(cliente?.nombre)}</p>
                        <p><span class="campo">Teléfono:</span> ${mostrarDato(cliente?.telefono)}</p>
                        <p><span class="campo">Correo:</span> ${mostrarDato(cliente?.correo)}</p>
                    </div>
                    <div class="bloque">
                        <h2>Dispositivo</h2>
                        <p><span class="campo">Tipo:</span> ${mostrarDato(dispositivo.tipo)}</p>
                        <p><span class="campo">Marca y modelo:</span> ${mostrarDato([dispositivo.marca, dispositivo.modelo].filter(Boolean).join(" "))}</p>
                        <p><span class="campo">N.º de serie:</span> ${mostrarDato(dispositivo.numeroSerie)}</p>
                    </div>
                </section>

                <!-- Muestra cantidades, precios unitarios y subtotales de cada concepto. -->
                <h2>Detalle de la cotización</h2>
                <table>
                    <thead><tr><th>Concepto</th><th class="numero">Cantidad</th><th class="numero">Valor unitario</th><th class="numero">Subtotal</th></tr></thead>
                    <tbody>${filas || '<tr><td colspan="4">No hay ítems registrados.</td></tr>'}</tbody>
                </table>
                <!-- Conserva el total calculado en la cotización y lo presenta en COP. -->
                <div class="total"><span>Total</span><span>${formatearPesos(cotizacion.total)}</span></div>
                <p class="nota">Este documento corresponde a la cotización del servicio indicado. Los valores están expresados en pesos colombianos (COP).</p>
            </main>
            <!-- Permite abrir el diálogo manualmente si no se activa la impresión automática. -->
            <div class="acciones"><button onclick="window.print()">Imprimir / Guardar PDF</button></div>
            <!-- Abre el diálogo de impresión cuando termina de cargar la vista. -->
            <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>
        </body>
        </html>`);
    ventana.document.close();
};

export default generarCotizacionPdf;
