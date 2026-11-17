import { llamarApi } from "./backend.js";

/* Solo el backend determina monto, referencia y firma; el cliente aporta el JWT de Supabase. */
export const iniciarPago = (idPedido) =>
    llamarApi(`/api/pagos/wompi/iniciar/${encodeURIComponent(idPedido)}`, { metodo: "POST" });

export const obtenerEstadoPago = (idPedido) =>
    llamarApi(`/api/pagos/estado/${encodeURIComponent(idPedido)}`);
