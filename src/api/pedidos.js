/*
    pedidos.js
    Pedidos de la tienda. El comprador los crea y consulta los suyos con el API
    (/api/pedidos). El personal de tienda (administrador y gestor) los lee todos con
    Supabase y cambia su estado con cambiar_estado_pedido (supabase/permisos_tienda.sql).
*/
import { mesesEnRango } from "../utilidades/reportes.js";
import { ingresosTiendaPorMes, pedidosEntregadosEnRango, sumarTotales } from "../utilidades/reportesTienda.js";
import { llamarApi } from "./backend.js";
import { obtenerCliente, verificar } from "./supabase.js";

/* Pago en línea que cuenta para el pedido: el aprobado si lo hay; si no, el intento más reciente. */
const pagoDelPedido = (pagos = []) => {
    const recientes = [...pagos].sort((pagoA, pagoB) => new Date(pagoB.creado_en) - new Date(pagoA.creado_en));
    const pago = recientes.find((intento) => intento.estado === "APPROVED") ?? recientes[0];
    if (!pago) return null;
    return {
        estado: pago.estado,
        referencia: pago.referencia,
        metodo: pago.metodo_pago ?? "",
        mensaje: pago.mensaje_estado ?? "",
        intentos: pagos.length,
    };
};

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
    pago: pagoDelPedido(fila.pagos),
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

/* Lista los pedidos del usuario autenticado desde el API, con paginación. */
export const obtenerMisPedidos = ({ page = 1, pageSize = 20 } = {}) => {
    const pagina = Math.max(1, Math.trunc(page));
    const tamano = Math.min(100, Math.max(1, Math.trunc(pageSize)));
    return llamarApi(`/api/pedidos/mis-pedidos?page=${pagina}&pageSize=${tamano}`);
};

/*
    RLS limita esta consulta al personal de tienda y el orden deja primero el pedido más reciente.
    Cada pedido es una fila aunque tenga varios intentos de pago: los reportes no lo cuentan dos veces.
*/
export const obtenerPedidos = async () => {
    const filas = verificar(
        await obtenerCliente()
            .from("pedidos")
            .select("*, pedido_items(*), pagos(estado, referencia, metodo_pago, mensaje_estado, creado_en)")
            .order("creado_en", { ascending: false })
    );
    return filas.map(aPedido);
};

/*
    La base valida la transición y mueve el stock: confirmar descuenta y cancelar un confirmado lo devuelve.
    Si un pago aprobado ya confirmó el pedido, confirmarlo otra vez no descuenta de nuevo.
*/
export const cambiarEstadoPedido = async (id, estado) => {
    verificar(await obtenerCliente().rpc("cambiar_estado_pedido", { p_pedido_id: id, p_estado: estado }));
};

/* Detalle de un pedido del usuario autenticado, con su pago, desde el API. */
export const obtenerDetalleMiPedido = (id) =>
    llamarApi(`/api/pedidos/${encodeURIComponent(id)}`);

/*
    Ingresos de pedidos entregados en el rango, con la misma regla de fechas que los reportes de tienda:
    el total del periodo y cuánto entró cada mes ("meses" de mesesEnRango).
*/
export const obtenerIngresosTienda = async (desde = "", hasta = "") => {
    const filas = verificar(
        await obtenerCliente().from("pedidos").select("estado, total, actualizado_en").eq("estado", "entregado")
    );
    const pedidos = filas.map((fila) => ({ estado: fila.estado, total: Number(fila.total), actualizadoEn: fila.actualizado_en }));
    const entregados = pedidosEntregadosEnRango(pedidos, desde, hasta);
    return { total: sumarTotales(entregados), porMes: ingresosTiendaPorMes(entregados, mesesEnRango(desde, hasta)) };
};
