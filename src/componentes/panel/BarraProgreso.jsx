import { ESTADOS_SOLICITUD } from "../../datos/opciones.js";

/* "calificado" ocurre después de finalizar, así que no es un paso aparte. */
const PASOS = ESTADOS_SOLICITUD.filter((estado) => estado.valor !== "calificado");

const colorTramo = (indice, pasoActual) => {
    if (indice < pasoActual) return "bg-marca/50";
    return indice === pasoActual ? "bg-marca" : "bg-slate-700";
};

const colorNombre = (indice, pasoActual) => {
    if (indice === pasoActual) return "font-semibold text-white";
    return indice < pasoActual ? "text-slate-400" : "text-slate-600";
};

/* Arriba destaca el estado actual y el que sigue; abajo, la barra con todos los pasos. */
const BarraProgreso = ({ estado }) => {
    const pasoActual = estado === "calificado" ? PASOS.length - 1 : PASOS.findIndex((paso) => paso.valor === estado);
    const siguiente = PASOS[pasoActual + 1];

    return (
        <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <div>
                    <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">Estado actual</p>
                    <p className="mt-1 text-xl font-semibold text-white">{PASOS[pasoActual]?.etiqueta}</p>
                </div>
                <p className="text-sm text-slate-400">
                    Paso {pasoActual + 1} de {PASOS.length}
                    {siguiente && <> · Sigue: <span className="text-slate-200">{siguiente.etiqueta}</span></>}
                </p>
            </div>

            <ol className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Progreso de la reparación">
                {PASOS.map((paso, indice) => (
                    <li key={paso.valor} aria-current={indice === pasoActual ? "step" : undefined}>
                        <div className={`h-2 rounded-full ${colorTramo(indice, pasoActual)}`} />
                        {/* En celulares no caben los 7 nombres: el estado actual ya está escrito arriba. */}
                        <p className={`mt-2 hidden text-xs leading-tight md:block ${colorNombre(indice, pasoActual)}`}>
                            <span className="sr-only">{indice < pasoActual ? "Completado: " : ""}</span>
                            {paso.etiqueta}
                        </p>
                    </li>
                ))}
            </ol>
        </>
    );
};

export default BarraProgreso;
