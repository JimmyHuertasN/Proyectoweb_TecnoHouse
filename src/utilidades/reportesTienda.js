/*
    reportesTienda.js
    Cálculos puros de los reportes de la tienda. Reciben pedidos ya cargados (ver api/pedidos.js).

    Fechas que usa cada cálculo:
    - Ingresos y productos vendidos: pedidos ENTREGADOS, por la fecha de su último cambio
      (actualizadoEn). Un entregado ya no cambia, así que es el día en que se entregó.
    - Pedidos por estado: todos los pedidos, por la fecha en que se crearon (creadoEn).
    Los pendientes y confirmados nunca cuentan como ingreso.
*/
import { ESTADOS_PEDIDO } from "../datos/estadosPedido.js";
import { estaEnRango } from "./filtros.js";

export const pedidosEntregadosEnRango = (pedidos, desde = "", hasta = "") =>
    pedidos.filter((pedido) => pedido.estado === "entregado" && estaEnRango(pedido.actualizadoEn, desde, hasta));

export const sumarTotales = (pedidos) => pedidos.reduce((suma, pedido) => suma + pedido.total, 0);

/* Cantidad de pedidos de cada estado, en el orden del proceso. */
export const contarPedidosPorEstado = (pedidos) =>
    ESTADOS_PEDIDO.map((estado) => ({
        ...estado,
        cantidad: pedidos.filter((pedido) => pedido.estado === estado.valor).length,
    }));

/*
    Unidades e ingresos por producto, del más vendido al menos. Usa el nombre guardado en el pedido,
    así un producto que cambió de nombre o se borró sigue apareciendo con el nombre con el que se vendió.
*/
export const productosMasVendidos = (pedidosEntregados) => {
    const ventas = new Map();
    for (const pedido of pedidosEntregados) {
        for (const item of pedido.items) {
            const clave = item.productoId ?? item.nombre;
            const actual = ventas.get(clave) ?? { clave, nombre: item.nombre, unidades: 0, ingresos: 0 };
            actual.unidades += item.cantidad;
            actual.ingresos += item.cantidad * item.precioUnitario;
            ventas.set(clave, actual);
        }
    }
    return [...ventas.values()].sort((ventaA, ventaB) => ventaB.unidades - ventaA.unidades || ventaB.ingresos - ventaA.ingresos);
};

/* Nombre de archivo para un CSV con el periodo, por ejemplo "ingresos-tienda_2026-05-01_2026-11-16.csv". */
export const nombreArchivoReporte = (reporte, desde, hasta) => `${reporte}_${desde || "inicio"}_${hasta || "hoy"}.csv`;
