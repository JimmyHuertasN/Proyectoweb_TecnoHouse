import { useState } from "react";
import { formatearPesos } from "../../../utilidades/formato.js";
import { pesosCompactos, porcentajeDe } from "../../../utilidades/graficos.js";
import { TablaGrafico } from "./piezas.jsx";

const TAMANO = 200;
const GROSOR = 26;
const RADIO = (TAMANO - GROSOR) / 2;
const CENTRO = TAMANO / 2;
const SEPARACION_PX = 2;
const DURACION_BARRIDO = 700;

const punto = (angulo) => [CENTRO + RADIO * Math.cos(angulo), CENTRO + RADIO * Math.sin(angulo)];

/* Arco por la línea media del anillo, de "inicio" a "fin" (radianes, 0 = arriba, sentido horario). */
const arco = (inicio, fin) => {
    const [x1, y1] = punto(inicio - Math.PI / 2);
    const [x2, y2] = punto(fin - Math.PI / 2);
    return `M${x1},${y1}A${RADIO},${RADIO} 0 ${fin - inicio > Math.PI ? 1 : 0} 1 ${x2},${y2}`;
};

/*
    Anillo con la parte de cada fuente en el total. Entre partes queda un hueco de 2 px del color
    de la tarjeta. Al pasar el cursor por una parte (o por su fila de la leyenda, que también recibe
    el foco del teclado) las demás se atenúan y el centro muestra su valor y porcentaje; sin nada
    señalado, el centro muestra el total. Al aparecer, el anillo se dibuja en un solo barrido.
    partes: [{ clave, nombre, valor, color }]; las que valen 0 no se dibujan.
*/
const GraficoCircular = ({ titulo, partes }) => {
    const [activa, setActiva] = useState(null);
    const total = partes.reduce((suma, parte) => suma + parte.valor, 0);
    const visibles = partes.filter((parte) => parte.valor > 0);
    const hueco = visibles.length > 1 ? SEPARACION_PX / RADIO : 0;

    // "inicio" es la fracción del total acumulada antes de cada parte.
    const segmentos = visibles.map((parte, indice) => ({
        ...parte,
        fraccion: parte.valor / total,
        inicio: visibles.slice(0, indice).reduce((suma, anterior) => suma + anterior.valor, 0) / total,
    }));

    const parteActiva = segmentos.find((segmento) => segmento.clave === activa);

    return (
        <figure className="@container">
            <div className="flex flex-col items-center gap-6 @md:flex-row @md:items-center">
                <div className="relative shrink-0" style={{ width: TAMANO, height: TAMANO }}>
                    <svg width={TAMANO} height={TAMANO} aria-hidden="true" onPointerLeave={() => setActiva(null)}>
                        <circle cx={CENTRO} cy={CENTRO} r={RADIO} fill="none" stroke="var(--color-slate-800)" strokeWidth={GROSOR} opacity="0.4" />
                        {segmentos.map((segmento) => {
                            const inicio = segmento.inicio * 2 * Math.PI + hueco / 2;
                            const fin = (segmento.inicio + segmento.fraccion) * 2 * Math.PI - hueco / 2;
                            const atenuada = activa !== null && activa !== segmento.clave;
                            const forma = {
                                pathLength: 1,
                                fill: "none",
                                stroke: segmento.color,
                                strokeWidth: activa === segmento.clave ? GROSOR + 4 : GROSOR,
                                // Cada parte empieza cuando termina la anterior: el anillo se dibuja en un solo barrido.
                                style: { animationDelay: `${segmento.inicio * DURACION_BARRIDO}ms`, animationDuration: `${Math.max(segmento.fraccion * DURACION_BARRIDO, 1)}ms` },
                                className: `grafico-arco transition-[opacity,stroke-width] duration-150 ease-fuerte ${atenuada ? "opacity-35" : ""}`,
                                onPointerEnter: () => setActiva(segmento.clave),
                            };
                            return segmento.fraccion >= 1 ? (
                                <circle key={segmento.clave} cx={CENTRO} cy={CENTRO} r={RADIO} transform={`rotate(-90 ${CENTRO} ${CENTRO})`} {...forma} />
                            ) : (
                                <path key={segmento.clave} d={arco(inicio, fin)} {...forma} />
                            );
                        })}
                    </svg>

                    {/* Centro: el total, o la parte señalada. */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
                        <span className="text-xs text-slate-400">{parteActiva ? `${porcentajeDe(parteActiva.valor, total)}%` : "Total"}</span>
                        <span className="text-lg font-semibold text-white">{pesosCompactos(parteActiva ? parteActiva.valor : total)}</span>
                        <span className="max-w-28 truncate text-xs text-slate-400">{parteActiva ? parteActiva.nombre : "del periodo"}</span>
                    </div>
                </div>

                <ul className="w-full min-w-0 flex-1 space-y-1" aria-label={`${titulo}: partes`}>
                    {partes.map((parte) => (
                        <li key={parte.clave}>
                            <button
                                type="button"
                                onPointerEnter={() => setActiva(parte.valor > 0 ? parte.clave : null)}
                                onPointerLeave={() => setActiva(null)}
                                onFocus={() => setActiva(parte.valor > 0 ? parte.clave : null)}
                                onBlur={() => setActiva(null)}
                                className={`flex w-full cursor-default items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-[background-color,opacity] duration-150 ease-fuerte focus-visible:outline-2 focus-visible:outline-marca ${activa === parte.clave ? "bg-slate-800/60" : ""} ${activa !== null && activa !== parte.clave ? "opacity-60" : ""}`}
                            >
                                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: parte.color }} aria-hidden="true" />
                                <span className="min-w-0 flex-1 truncate text-slate-300">{parte.nombre}</span>
                                <span className="font-semibold text-white tabular-nums">{formatearPesos(parte.valor)}</span>
                                <span className="w-10 text-right text-xs text-slate-400 tabular-nums">{porcentajeDe(parte.valor, total)}%</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <TablaGrafico
                titulo={titulo}
                columnas={["Parte", "Ingresos", "Porcentaje"]}
                filas={partes.map((parte) => [parte.nombre, formatearPesos(parte.valor), `${porcentajeDe(parte.valor, total)}%`])}
            />
        </figure>
    );
};

export default GraficoCircular;
