import { POCAS_UNIDADES } from "../../utilidades/inventario.js";

const CLASE_BASE = "inline-flex items-center gap-1.5 text-xs font-medium";

const EtiquetaStock = ({ stock }) => {
    if (stock <= 0) {
        return <span className={`${CLASE_BASE} text-slate-400`}><span className="size-1.5 rounded-full bg-slate-500" aria-hidden="true" />Agotado</span>;
    }
    if (stock <= POCAS_UNIDADES) {
        return (
            <span className={`${CLASE_BASE} text-amber-300`}>
                <span className="size-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                {stock === 1 ? "Última unidad" : `Últimas ${stock} unidades`}
            </span>
        );
    }
    return <span className={`${CLASE_BASE} text-emerald-300`}><span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />Disponible</span>;
};

export default EtiquetaStock;
