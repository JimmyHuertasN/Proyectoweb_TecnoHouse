import { FILTROS_SOLICITUD } from "../../api/solicitudes.js";

/* Botones Todas / En curso / Finalizadas, con la cantidad de cada grupo. */
const FiltroSolicitudes = ({ solicitudes, filtro, alCambiar }) => (
    <div className="mb-5 inline-flex rounded-lg border border-borde bg-fondo p-1" role="group" aria-label="Filtrar solicitudes">
        {FILTROS_SOLICITUD.map((opcion) => (
            <button
                key={opcion.valor}
                type="button"
                onClick={() => alCambiar(opcion.valor)}
                aria-pressed={filtro === opcion.valor}
                className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition ${
                    filtro === opcion.valor ? "bg-marca text-white" : "text-slate-400 hover:text-white"
                }`}
            >
                {opcion.etiqueta} ({solicitudes.filter(opcion.cumple).length})
            </button>
        ))}
    </div>
);

export default FiltroSolicitudes;
