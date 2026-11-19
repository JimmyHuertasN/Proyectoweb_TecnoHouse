/* Estados de un pago en línea (Wompi), con los valores que guarda la tabla pagos. */
export const ESTADOS_PAGO = {
    PENDING: { etiqueta: "Pendiente", clases: "bg-amber-500/15 text-amber-300" },
    APPROVED: { etiqueta: "Aprobado", clases: "bg-emerald-500/15 text-emerald-300" },
    DECLINED: { etiqueta: "Rechazado", clases: "bg-red-500/15 text-red-300" },
    VOIDED: { etiqueta: "Anulado", clases: "bg-slate-500/20 text-slate-300" },
    ERROR: { etiqueta: "Error", clases: "bg-red-500/15 text-red-300" },
};

/* Etiqueta y colores de un estado de pago; sin pago se muestra "Sin iniciar". */
export const visualPago = (estado) => {
    if (!estado) return { etiqueta: "Sin iniciar", clases: "bg-slate-500/20 text-slate-300" };
    const codigo = String(estado).toUpperCase();
    return ESTADOS_PAGO[codigo] ?? { etiqueta: codigo, clases: "bg-slate-500/20 text-slate-300" };
};

/*
    Un pago aprobado en un pedido que no avanzó necesita que alguien lo revise:
    - pendiente: el pago llegó pero faltaba inventario para confirmarlo;
    - cancelado: el dinero no se devuelve solo, el reembolso se gestiona aparte.
*/
export const incidenciaPago = (estadoPedido, estadoPago) => {
    if (estadoPago !== "APPROVED") return "";
    if (estadoPedido === "pendiente") return "Pago aprobado, pero el pedido sigue pendiente (por ejemplo, faltó inventario). Revisa el stock y confírmalo o cancélalo.";
    if (estadoPedido === "cancelado") return "Pago aprobado en un pedido cancelado: el dinero no se devuelve automáticamente; el reembolso se gestiona aparte con el cliente.";
    return "";
};
