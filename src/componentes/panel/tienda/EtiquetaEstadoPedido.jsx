import { ESTADOS_PEDIDO } from "../../../datos/estadosPedido.js";

/* Estado de un pedido como etiqueta de color (pendiente, confirmado, entregado o cancelado). */
const EtiquetaEstadoPedido = ({ estado }) => {
    const datos = ESTADOS_PEDIDO.find((opcion) => opcion.valor === estado);
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${datos?.color ?? "bg-slate-500/20 text-slate-300"}`}>
            {datos?.etiquetaSingular ?? estado}
        </span>
    );
};

export default EtiquetaEstadoPedido;
