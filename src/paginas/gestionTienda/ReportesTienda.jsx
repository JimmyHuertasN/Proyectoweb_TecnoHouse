import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { obtenerPedidos } from "../../api/pedidos.js";
import { obtenerTodosLosProductos } from "../../api/productos.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import GraficoBarras from "../../componentes/panel/GraficoBarras.jsx";
import VisorIngresos from "../../componentes/panel/graficos/VisorIngresos.jsx";
import SelectorRangoFechas from "../../componentes/panel/admin/SelectorRangoFechas.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import { useRangoFechas } from "../../hooks/useRangoFechas.js";
import { descargarCsv, generarCsv } from "../../utilidades/csv.js";
import { estaEnRango } from "../../utilidades/filtros.js";
import { codigoPedido, formatearFecha, formatearPesos } from "../../utilidades/formato.js";
import { POCAS_UNIDADES, productosPorReponer } from "../../utilidades/inventario.js";
import { COLORES_GRAFICO, colorearPartes } from "../../utilidades/graficos.js";
import { mesesEnRango } from "../../utilidades/reportes.js";
import {
    contarPedidosPorEstado,
    ingresosPorProducto,
    ingresosTiendaPorMes,
    nombreArchivoReporte,
    pedidosEntregadosEnRango,
    productosMasVendidos,
    sumarTotales,
} from "../../utilidades/reportesTienda.js";

const CLASE_TABLA = "w-full min-w-[30rem] text-left text-sm";

/* Encabezado de cada reporte con su botón de descarga. "alDescargar" no existe si no hay filas. */
const Reporte = ({ id, titulo, descripcion, alDescargar, children }) => (
    <section aria-labelledby={id} className="tarjeta">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h2 id={id} className="text-lg font-semibold">{titulo}</h2>
                <p className="mt-1 text-sm text-slate-400">{descripcion}</p>
            </div>
            <button type="button" onClick={alDescargar} disabled={!alDescargar} className="boton-secundario shrink-0 disabled:cursor-not-allowed disabled:opacity-50">
                <Download size={16} aria-hidden="true" /> Descargar CSV
            </button>
        </div>
        {children}
    </section>
);

const Tabla = ({ etiqueta, columnas, children }) => (
    <div role="region" aria-label={etiqueta} tabIndex={0} className="overflow-x-auto rounded-lg border border-borde focus-visible:outline-2 focus-visible:outline-marca">
        <table className={CLASE_TABLA}>
            <caption className="sr-only">{etiqueta}</caption>
            <thead className="bg-tarjeta text-xs text-slate-400">
                <tr>
                    {columnas.map((columna) => (
                        <th key={columna} scope="col" className="px-3 py-2">{columna}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-borde">{children}</tbody>
        </table>
    </div>
);

/* Reportes solo de la tienda. Cada uno explica qué fecha usa para el periodo. */
const ReportesTienda = () => {
    const rango = useRangoFechas();
    const { desde, hasta } = rango;
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let vigente = true;

        Promise.all([obtenerPedidos(), obtenerTodosLosProductos()])
            .then(([pedidos, productos]) => vigente && setDatos({ pedidos, productos }))
            .catch((errorApi) => vigente && setError(errorApi.message || "No se pudieron cargar los reportes."));

        return () => {
            vigente = false;
        };
    }, []);

    if (!datos) {
        return (
            <>
                <EncabezadoPagina titulo="Reportes de tienda" descripcion="Ventas, pedidos e inventario de la tienda." />
                <Aviso texto={error} tipo="error" />
                {!error && <Skeleton tipo="metrica" cantidad={3} etiqueta="Cargando reportes" />}
            </>
        );
    }

    const entregados = pedidosEntregadosEnRango(datos.pedidos, desde, hasta);
    const creadosEnPeriodo = datos.pedidos.filter((pedido) => estaEnRango(pedido.creadoEn, desde, hasta));
    const porEstado = contarPedidosPorEstado(creadosEnPeriodo);
    const masVendidos = productosMasVendidos(entregados);
    const porReponer = productosPorReponer(datos.productos);
    const ingresos = sumarTotales(entregados);
    const meses = mesesEnRango(desde, hasta);
    const descargar = (reporte, columnas, filas) => descargarCsv(nombreArchivoReporte(reporte, desde, hasta), generarCsv(columnas, filas));

    return (
        <>
            <EncabezadoPagina titulo="Reportes de tienda" descripcion="Ventas, pedidos e inventario de la tienda. No incluye reparaciones." />

            <SelectorRangoFechas id="reportes-tienda" rango={rango} />

            <div className="space-y-6">
                <Reporte
                    id="reporte-ingresos"
                    titulo="Ingresos por pedidos entregados"
                    descripcion="Suma de los pedidos entregados, según la fecha en que se marcaron como entregados. Los pendientes y confirmados no cuentan."
                    alDescargar={entregados.length > 0 ? () => descargar(
                        "ingresos-tienda",
                        ["Pedido", "Comprador", "Fecha de entrega", "Total"],
                        entregados.map((pedido) => [codigoPedido(pedido.numero), pedido.clienteNombre, formatearFecha(pedido.actualizadoEn), pedido.total])
                    ) : undefined}
                >
                    <VisorIngresos
                        id="reportes-tienda-ingresos"
                        titulo="Ingresos por pedidos entregados"
                        descripciones={{
                            actual: "Totales del periodo: ingresos, pedidos entregados y valor promedio por pedido.",
                            area: "Tendencia de los ingresos mes a mes, según la fecha de entrega. Pasa el cursor para ver cada mes.",
                            barras: "Ingreso de cada mes sobre una escala en pesos, con el detalle al pasar el cursor.",
                            circular: "De qué productos vienen los ingresos: los cinco que más ingresaron y el resto sumado.",
                        }}
                        actual={
                            <div className="grid gap-4 sm:grid-cols-3">
                                <p><span className="block text-3xl font-semibold text-white tabular-nums">{formatearPesos(ingresos)}</span><span className="text-sm text-slate-400">Ingresos</span></p>
                                <p><span className="block text-3xl font-semibold text-white tabular-nums">{entregados.length}</span><span className="text-sm text-slate-400">Pedidos entregados</span></p>
                                <p><span className="block text-3xl font-semibold text-white tabular-nums">{formatearPesos(entregados.length ? ingresos / entregados.length : 0)}</span><span className="text-sm text-slate-400">Valor promedio por pedido</span></p>
                            </div>
                        }
                        categorias={meses}
                        series={[{ clave: "tienda", nombre: "Ingresos", color: COLORES_GRAFICO[1], valores: ingresosTiendaPorMes(entregados, meses).map((mes) => mes.valor) }]}
                        partes={colorearPartes(ingresosPorProducto(entregados))}
                    />
                </Reporte>

                <Reporte
                    id="reporte-estados"
                    titulo="Pedidos por estado"
                    descripcion="Pedidos creados en el periodo, según su estado actual."
                    alDescargar={creadosEnPeriodo.length > 0 ? () => descargar(
                        "pedidos-por-estado",
                        ["Estado", "Pedidos"],
                        porEstado.map((estado) => [estado.etiquetaSingular, estado.cantidad])
                    ) : undefined}
                >
                    {creadosEnPeriodo.length > 0 ? (
                        <GraficoBarras
                            etiquetaAria="Pedidos por estado"
                            datos={porEstado.map((estado) => ({
                                clave: estado.valor,
                                etiqueta: estado.etiqueta,
                                valor: estado.cantidad,
                                descripcion: `${estado.etiqueta}: ${estado.cantidad} de ${creadosEnPeriodo.length} pedidos`,
                            }))}
                        />
                    ) : (
                        <p className="text-sm text-slate-400">No se crearon pedidos en este periodo.</p>
                    )}
                </Reporte>

                <Reporte
                    id="reporte-vendidos"
                    titulo="Productos más vendidos"
                    descripcion="Unidades de pedidos entregados en el periodo, con el nombre y el precio con los que se vendieron."
                    alDescargar={masVendidos.length > 0 ? () => descargar(
                        "productos-mas-vendidos",
                        ["Producto", "Unidades", "Ingresos"],
                        masVendidos.map((venta) => [venta.nombre, venta.unidades, venta.ingresos])
                    ) : undefined}
                >
                    {masVendidos.length > 0 ? (
                        <Tabla etiqueta="Productos más vendidos" columnas={["Producto", "Unidades", "Ingresos"]}>
                            {masVendidos.map((venta) => (
                                <tr key={venta.clave}>
                                    <td className="px-3 py-2 text-white">{venta.nombre}</td>
                                    <td className="px-3 py-2 tabular-nums">{venta.unidades}</td>
                                    <td className="px-3 py-2 tabular-nums">{formatearPesos(venta.ingresos)}</td>
                                </tr>
                            ))}
                        </Tabla>
                    ) : (
                        <p className="text-sm text-slate-400">No hay pedidos entregados en este periodo.</p>
                    )}
                </Reporte>

                <Reporte
                    id="reporte-reponer"
                    titulo="Productos por reponer"
                    descripcion={`Inventario actual (no depende del periodo): productos activos con ${POCAS_UNIDADES} unidades o menos.`}
                    alDescargar={porReponer.length > 0 ? () => descargar(
                        "productos-por-reponer",
                        ["Producto", "Categoría", "Unidades"],
                        porReponer.map((producto) => [producto.nombre, producto.categoria, producto.stock])
                    ) : undefined}
                >
                    {porReponer.length > 0 ? (
                        <Tabla etiqueta="Productos por reponer" columnas={["Producto", "Categoría", "Unidades"]}>
                            {porReponer.map((producto) => (
                                <tr key={producto.id}>
                                    <td className="px-3 py-2 text-white">{producto.nombre}</td>
                                    <td className="px-3 py-2 text-slate-300">{producto.categoria}</td>
                                    <td className={`px-3 py-2 tabular-nums ${producto.stock === 0 ? "text-red-300" : "text-amber-300"}`}>
                                        {producto.stock === 0 ? "Agotado" : producto.stock}
                                    </td>
                                </tr>
                            ))}
                        </Tabla>
                    ) : (
                        <p className="text-sm text-slate-400">Ningún producto activo está por reponer.</p>
                    )}
                </Reporte>
            </div>
        </>
    );
};

export default ReportesTienda;
