import { ESTADOS_SOLICITUD } from "../../datos/opciones.js";

/* "calificado" ocurre después de finalizar, así que no es un paso aparte. */
const PASOS = ESTADOS_SOLICITUD.filter((estado) => estado.valor !== "calificado");

const BarraProgreso = ({ estado }) => {
    const pasoActual = estado === "calificado" ? PASOS.length - 1 : PASOS.findIndex((paso) => paso.valor === estado);

    return (
        <>
            <ol className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Progreso de la reparación">
                {PASOS.map((paso, indice) => {
                    const completado = indice <= pasoActual;
                    return (
                        <li key={paso.valor} aria-current={indice === pasoActual ? "step" : undefined}>
                            <div className={`h-1.5 rounded-full ${completado ? "bg-marca" : "bg-slate-700"}`} />
                            {/* En celulares no caben los 7 nombres: se muestra solo el paso actual debajo. */}
                            <p className={`mt-2 hidden text-xs md:block ${indice === pasoActual ? "font-semibold text-marca" : completado ? "text-slate-300" : "text-slate-500"}`}>
                                {paso.etiqueta}
                            </p>
                        </li>
                    );
                })}
            </ol>
            <p className="mt-3 text-sm text-slate-300 md:hidden">
                Paso {pasoActual + 1} de {PASOS.length}: <span className="font-semibold text-marca">{PASOS[pasoActual]?.etiqueta}</span>
            </p>
        </>
    );
};

export default BarraProgreso;
