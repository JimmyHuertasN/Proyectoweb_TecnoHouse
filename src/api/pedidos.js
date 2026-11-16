/*
    pedidos.js
    Pedidos de la tienda, guardados y consultados mediante Supabase.
*/
import { estaEnRango } from "../utilidades/filtros.js";
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

/* El servidor valida los productos y calcula los precios desde el catálogo vigente. */
export const crearPedido = async ({ nombre, telefono, notas = "", lineas }) => {
    const items = lineas.map(({ producto, cantidad }) => ({ producto_id: producto.id, cantidad }));
    const respuesta = verificar(
        await obtenerCliente().rpc("crear_pedido", {
            p_nombre: nombre,
            p_telefono: telefono,
            p_notas: notas,
            p_items: items,
        })
    );

    return { id: respuesta.id, numero: respuesta.numero, total: Number(respuesta.total) };
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

/* El rango usa días locales inclusivos, igual que los reportes del panel. */
export const obtenerIngresosTienda = async (desde = "", hasta = "") => {
    const filas = verificar(
        await obtenerCliente().from("pedidos").select("total, actualizado_en").eq("estado", "entregado")
    );
    return filas
        .filter((pedido) => estaEnRango(pedido.actualizado_en, desde, hasta))
        .reduce((suma, pedido) => suma + Number(pedido.total), 0);
};
