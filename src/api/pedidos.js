/*
    pedidos.js
    Pedidos de la tienda, guardados y consultados mediante Supabase (supabase/pedidos.sql).
    Leerlos todos y cambiar su estado es solo para el personal de tienda
    (administrador y gestor), según supabase/permisos_tienda.sql.
*/
import { pedidosEntregadosEnRango, sumarTotales } from "../utilidades/reportesTienda.js";
import { obtenerCliente, verificar } from "./supabase.js";

const aPedido = (fila) => ({
    id: fila.id,
    numero: fila.numero,
    clienteNombre: fila.cliente_nombre,
    clienteTelefono: fila.cliente_telefono,
    notas: fila.notas ?? "",
    // Datos de entrega: los pedidos antiguos no los tienen.
    entrega: {
        direccion: fila.direccion_entrega ?? "",
        ciudad: fila.ciudad_entrega ?? "",
        departamento: fila.departamento_entrega ?? "",
        telefonoReceptor: fila.telefono_receptor ?? "",
    },
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

/* RLS limita esta consulta al personal de tienda y el orden deja primero el pedido más reciente. */
export const obtenerPedidos = async () => {
    const filas = verificar(
        await obtenerCliente().from("pedidos").select("*, pedido_items(*)").order("creado_en", { ascending: false })
    );
    return filas.map(aPedido);
};

/* La base valida la transición y mueve el stock: confirmar descuenta y cancelar un confirmado lo devuelve. */
export const cambiarEstadoPedido = async (id, estado) => {
    verificar(await obtenerCliente().rpc("cambiar_estado_pedido", { p_pedido_id: id, p_estado: estado }));
};

/* Ingresos de pedidos entregados en el rango, con la misma regla de fechas que los reportes de tienda. */
export const obtenerIngresosTienda = async (desde = "", hasta = "") => {
    const filas = verificar(
        await obtenerCliente().from("pedidos").select("estado, total, actualizado_en").eq("estado", "entregado")
    );
    const pedidos = filas.map((fila) => ({ estado: fila.estado, total: Number(fila.total), actualizadoEn: fila.actualizado_en }));
    return sumarTotales(pedidosEntregadosEnRango(pedidos, desde, hasta));
};
