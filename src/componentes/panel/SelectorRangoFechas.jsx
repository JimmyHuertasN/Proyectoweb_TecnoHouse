import { RANGOS_PREDEFINIDOS } from "../../utilidades/reportes.js";

/* Selector de periodo de los reportes. "rango" es lo que devuelve useRangoFechas. */
const SelectorRangoFechas = ({ id, rango }) => {
    const { valor, desde, hasta, cambiarValor, cambiarFecha } = rango;

    return (
        <div role="group" aria-label="Periodo del reporte" className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="sm:min-w-52">
                <label htmlFor={`${id}-periodo`} className="etiqueta">Periodo</label>
                <select id={`${id}-periodo`} className="campo" value={valor} onChange={(evento) => cambiarValor(evento.target.value)}>
                    {RANGOS_PREDEFINIDOS.map((opcion) => (
                        <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                </select>
            </div>

            {valor === "personalizado" && (
                <>
                    <div className="sm:min-w-40">
                        <label htmlFor={`${id}-desde`} className="etiqueta">Desde</label>
                        <input
                            id={`${id}-desde`}
                            type="date"
                            className="campo [color-scheme:dark]"
                            max={hasta || undefined}
                            value={desde}
                            onChange={(evento) => cambiarFecha("desde", evento.target.value)}
                        />
                    </div>
                    <div className="sm:min-w-40">
                        <label htmlFor={`${id}-hasta`} className="etiqueta">Hasta</label>
                        <input
                            id={`${id}-hasta`}
                            type="date"
                            className="campo [color-scheme:dark]"
                            min={desde || undefined}
                            value={hasta}
                            onChange={(evento) => cambiarFecha("hasta", evento.target.value)}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default SelectorRangoFechas;
