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
import { agruparPorMes } from "./reportes.js";

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

/* Ingresos de cada mes ("meses" de mesesEnRango) según la fecha de entrega de los pedidos. */
export const ingresosTiendaPorMes = (pedidosEntregados, meses) =>
    agruparPorMes(pedidosEntregados, meses, (pedido) => pedido.actualizadoEn, (pedido) => pedido.total);

/*
    De qué productos vienen los ingresos: los "maximo" que más ingresaron y el resto sumado en
    "Otros productos", para que el gráfico circular no pase de maximo + 1 partes.
*/
export const ingresosPorProducto = (pedidosEntregados, maximo = 5) => {
    const ordenados = [...productosMasVendidos(pedidosEntregados)].sort((ventaA, ventaB) => ventaB.ingresos - ventaA.ingresos);
    const principales = ordenados.slice(0, maximo).map((venta) => ({ clave: String(venta.clave), nombre: venta.nombre, valor: venta.ingresos }));
    const otros = ordenados.slice(maximo).reduce((suma, venta) => suma + venta.ingresos, 0);
    return otros > 0 ? [...principales, { clave: "otros", nombre: "Otros productos", valor: otros, esOtros: true }] : principales;
};

/* Nombre de archivo para un CSV con el periodo, por ejemplo "ingresos-tienda_2026-05-01_2026-11-16.csv". */
export const nombreArchivoReporte = (reporte, desde, hasta) => `${reporte}_${desde || "inicio"}_${hasta || "hoy"}.csv`;
