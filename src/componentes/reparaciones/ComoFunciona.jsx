import { PASOS_SERVICIO } from "../../datos/pasosServicio.js";

/* Los pasos se leen como una línea de tiempo: cada ícono queda unido al siguiente. */
const ComoFunciona = () => (
    <section id="como-funciona" data-animacion-entrada aria-labelledby="titulo-como-funciona" className="seccion border-y border-white/10 bg-superficie">
        <div className="contenedor">
            <p className="antetitulo">Cómo funciona</p>
            <h2 id="titulo-como-funciona" className="titulo-seccion">Te acompañamos del diagnóstico a la entrega</h2>
            <p className="texto-seccion">No reparamos nada sin tu aprobación: primero conoces la falla y el costo.</p>

            <ol className="mt-12 grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {PASOS_SERVICIO.map(({ titulo, descripcion, icono: Icono }, indice) => (
                    <li key={titulo} className="relative pr-8">
                        {/* Línea que une este paso con el siguiente (solo en una fila de cuatro). */}
                        {indice < PASOS_SERVICIO.length - 1 && (
                            <span aria-hidden="true" className="absolute top-6 right-0 left-12 hidden h-px bg-slate-700 lg:block" />
                        )}
                        <span className="relative flex size-12 items-center justify-center rounded-full border border-slate-600 bg-tarjeta text-marca" aria-hidden="true">
                            <Icono size={22} strokeWidth={1.8} />
                        </span>
                        <p className="mt-5 text-sm font-semibold text-sky-300">Paso {indice + 1}</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">{titulo}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">{descripcion}</p>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);

export default ComoFunciona;
