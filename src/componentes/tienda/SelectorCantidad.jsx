import { Minus, Plus } from "lucide-react";

const CLASE_BOTON = "flex size-9 items-center justify-center text-slate-300 transition hover:text-marca disabled:cursor-not-allowed disabled:opacity-40";

const SelectorCantidad = ({ cantidad, maximo, minimo = 1, alCambiar, nombre = "" }) => (
    <div className="inline-flex items-center rounded-lg border border-slate-600 bg-fondo">
        <button type="button" className={CLASE_BOTON} disabled={cantidad <= minimo} onClick={() => alCambiar(cantidad - 1)} aria-label={`Quitar una unidad ${nombre}`}>
            <Minus size={16} aria-hidden="true" />
        </button>
        <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">{cantidad}</span>
        <button type="button" className={CLASE_BOTON} disabled={cantidad >= maximo} onClick={() => alCambiar(cantidad + 1)} aria-label={`Agregar una unidad ${nombre}`}>
            <Plus size={16} aria-hidden="true" />
        </button>
    </div>
);

export default SelectorCantidad;
