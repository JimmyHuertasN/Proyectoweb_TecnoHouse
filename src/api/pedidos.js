/*
    pedidos.js
    Pedidos de la tienda, guardados y consultados mediante Supabase.
*/
import { estaEnRango } from "../utilidades/filtros.js";
import { llamarApi } from "./backend.js";
import { obtenerCliente, verificar } from "./supabase.js";

const aPedido = (fila) => ({
    id: fila.id,
    numero: fila.numero,
    clienteNombre: fila.cliente_nombre,
    clienteTelefono: fila.cliente_telefono,
    notas: fila.notas ?? "",
    estado: fila.estado,
    total: Number(fila.total),
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
    items: (fila.pedido_items ?? []).map((item) => ({
        id: item.id,
        productoId: item.producto_id,
        nombre: item.producto_nombre,
        cantidad: item.cantidad,
        precioUnitario: Number(item.precio_unitario),
    })),
});

/* Envía solo ids, cantidades y entrega; el API calcula y devuelve el total real. */
export const crearPedido = async ({ lineas, entrega }) => {
    const respuesta = await llamarApi("/api/pedidos", {
        metodo: "POST",
        datos: {
            productos: lineas.map(({ producto, cantidad }) => ({ id: producto.id, cantidad })),
            entrega,
        },
    });

    return {
        id: respuesta.pedidoId,
        numero: respuesta.numero,
        total: Number(respuesta.total),
        estadoPedido: respuesta.estadoPedido,
        estadoPago: respuesta.estadoPago,
    };
};

/* RLS limita esta consulta al administrador y el orden deja primero el pedido más reciente. */
export const obtenerPedidos = async () => {
    const filas = verificar(
        await obtenerCliente().from("pedidos").select("*, pedido_items(*)").order("creado_en", { ascending: false })
    );
    return filas.map(aPedido);
};

export const cambiarEstadoPedido = async (id, estado) => {
    verificar(await obtenerCliente().rpc("cambiar_estado_pedido", { p_pedido_id: id, p_estado: estado }));
};

/* La API aplica RLS y limita la respuesta a los pedidos del usuario autenticado. */
export const obtenerMisPedidos = (page = 1, pageSize = 10) =>
    llamarApi(`/api/pedidos/mis-pedidos?page=${page}&pageSize=${pageSize}`);

export const obtenerDetalleMiPedido = (id) =>
    llamarApi(`/api/pedidos/${encodeURIComponent(id)}`);

/* El rango usa días locales inclusivos, igual que los reportes del panel. */
export const obtenerIngresosTienda = async (desde = "", hasta = "") => {
    const filas = verificar(
        await obtenerCliente().from("pedidos").select("total, actualizado_en").eq("estado", "entregado")
    );
    return filas
        .filter((pedido) => estaEnRango(pedido.actualizado_en, desde, hasta))
        .reduce((suma, pedido) => suma + Number(pedido.total), 0);
};
