/*
    pedidos.js
    Pedidos de la tienda.

    PENDIENTE BASE: todavía no existe la tabla en Supabase. Por ahora los pedidos
    solo llegan por WhatsApp desde el carrito, así que la lista vuelve vacía.

    Lo que falta crear en la base:
      - Tabla "pedidos": id, cliente (nombre y teléfono), estado (pendiente,
        confirmado, entregado, cancelado), total y fecha de creación.
      - Tabla "pedido_items": pedido_id, producto_id, cantidad y precio del momento.
      - Reglas (RLS): cualquiera crea un pedido; solo el administrador los lee y
        cambia su estado.
      - Al confirmar un pedido, descontar el stock de cada producto.
*/

export const obtenerPedidos = async () => [];

/*
    Lo ganado con la tienda en el periodo: la suma de los pedidos entregados.
    PENDIENTE BASE: devuelve 0 hasta que exista la tabla "pedidos".
*/
export const obtenerIngresosTienda = async () => 0;
