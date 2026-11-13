import { POCAS_UNIDADES } from "../../utilidades/inventario.js";

const EtiquetaStock = ({ stock }) => {
    if (stock <= 0) {
        return <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold text-slate-400">Agotado</span>;
    }
    if (stock <= POCAS_UNIDADES) {
        return <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300">{stock === 1 ? "Última unidad" : `Últimas ${stock} unidades`}</span>;
    }
    return <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">Disponible</span>;
};

export default EtiquetaStock;
