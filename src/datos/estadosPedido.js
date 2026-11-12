import { CircleCheck, CircleX, Clock, Truck } from "lucide-react";

/* Estados por los que pasa un pedido de la tienda, en orden. */
export const ESTADOS_PEDIDO = [
    { valor: "pendiente", etiqueta: "Pendientes", icono: Clock, detalle: "Esperan confirmación" },
    { valor: "confirmado", etiqueta: "Confirmados", icono: CircleCheck, detalle: "Stock apartado" },
    { valor: "entregado", etiqueta: "Entregados", icono: Truck, detalle: "Ya en manos del cliente" },
    { valor: "cancelado", etiqueta: "Cancelados", icono: CircleX, detalle: "No se completaron" },
];
