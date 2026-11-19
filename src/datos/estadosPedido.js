import { CircleCheck, CircleX, Clock, Truck } from "lucide-react";

/* Estados por los que pasa un pedido de la tienda, en orden. */
export const ESTADOS_PEDIDO = [
    { valor: "pendiente", etiqueta: "Pendientes", etiquetaSingular: "Pendiente", icono: Clock, detalle: "Esperan confirmación", color: "bg-amber-500/15 text-amber-300", siguientes: ["confirmado", "cancelado"] },
    { valor: "confirmado", etiqueta: "Confirmados", etiquetaSingular: "Confirmado", icono: CircleCheck, detalle: "Stock ya descontado", color: "bg-sky-500/15 text-sky-300", siguientes: ["entregado", "cancelado"] },
    { valor: "entregado", etiqueta: "Entregados", etiquetaSingular: "Entregado", icono: Truck, detalle: "Ya en manos del cliente", color: "bg-emerald-500/15 text-emerald-300", siguientes: [] },
    { valor: "cancelado", etiqueta: "Cancelados", etiquetaSingular: "Cancelado", icono: CircleX, detalle: "No se completaron", color: "bg-slate-500/20 text-slate-300", siguientes: [] },
];
