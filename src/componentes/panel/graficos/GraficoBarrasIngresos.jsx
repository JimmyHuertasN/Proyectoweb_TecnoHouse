import { formatearPesos } from "../../../utilidades/formato.js";
import { marcasEje, pesosCompactos, saltoDeEtiquetas } from "../../../utilidades/graficos.js";
import { useAncho, useCategoriaActiva } from "./hooksGrafico.js";
import { LeyendaSeries, TablaGrafico, TooltipGrafico } from "./piezas.jsx";

const ALTO = 220;
const MARGEN = { arriba: 18, derecha: 8, abajo: 26, izquierda: 56 };
const ANCHO_MAXIMO_BARRA = 24;
const SEPARACION = 2;
const RADIO = 4;

/* Columna con las esquinas de arriba redondeadas (4 px) y la base recta, apoyada en la línea base. */
const columna = (x, y, ancho, alto) => {
    const radio = Math.min(RADIO, ancho / 2, alto);
    return `M${x},${y + alto}V${y + radio}Q${x},${y} ${x + radio},${y}H${x + ancho - radio}Q${x + ancho},${y} ${x + ancho},${y + radio}V${y + alto}Z`;
};

/*
    Columnas de ingresos por mes; con varias series, una columna por serie lado a lado (2 px entre ellas).
    Cada mes es una zona sensible completa: al pasar el cursor o recorrer con las flechas, ese mes
    se mantiene y los demás se atenúan; el tooltip lista todas las series del mes. Al aparecer, las
    columnas crecen desde la base una tras otra.
    categorias: [{ clave, etiqueta, nombreCompleto }]; series: [{ clave, nombre, color, valores }].
*/
const GraficoBarrasIngresos = ({ titulo, categorias, series }) => {
    const [referencia, ancho] = useAncho();
    const [activa, setActiva, propsContenedor] = useCategoriaActiva(categorias.length);

    const maximo = Math.max(0, ...series.flatMap((serie) => serie.valores));
    const { tope, marcas } = marcasEje(maximo);
    const anchoTrazado = Math.max(0, ancho - MARGEN.izquierda - MARGEN.derecha);
    const altoTrazado = ALTO - MARGEN.arriba - MARGEN.abajo;
    const banda = categorias.length > 0 ? anchoTrazado / categorias.length : 0;
    // La columna nunca llena la banda: lo que sobra queda como aire entre meses.
    const anchoBarra = Math.max(2, Math.min(ANCHO_MAXIMO_BARRA, (banda * 0.7 - SEPARACION * (series.length - 1)) / series.length));
    const anchoGrupo = anchoBarra * series.length + SEPARACION * (series.length - 1);
    const y = (valor) => MARGEN.arriba + altoTrazado * (1 - valor / tope);
    const base = y(0);
    const inicioBanda = (indice) => MARGEN.izquierda + indice * banda;
    const centro = (indice) => inicioBanda(indice) + banda / 2;
    const salto = saltoDeEtiquetas(categorias.length, anchoTrazado);

    // Con una sola serie se rotula la columna más alta; el resto queda en el eje, el tooltip y la tabla.
    const unica = series.length === 1 ? series[0] : null;
    const indiceMaximo = unica && maximo > 0 ? unica.valores.indexOf(maximo) : -1;

    return (
        <figure>
            <LeyendaSeries series={series} />
            <div
                ref={referencia}
                {...propsContenedor}
                role="group"
                aria-label={`${titulo}. Usa las flechas para recorrer los meses.`}
                className="relative rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-marca"
            >
                {ancho > 0 && (
                    <svg width={ancho} height={ALTO} className="block overflow-visible" aria-hidden="true" onPointerLeave={() => setActiva(null)}>
                        {marcas.map((marca) => (
                            <g key={marca}>
                                <line x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha} y1={y(marca)} y2={y(marca)} stroke="var(--color-borde)" strokeWidth="1" />
                                <text x={MARGEN.izquierda - 8} y={y(marca)} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[11px] tabular-nums">
                                    {pesosCompactos(marca)}
                                </text>
                            </g>
                        ))}

                        {categorias.map((categoria, indice) => (
                            <g
                                key={categoria.clave}
                                onPointerEnter={() => setActiva(indice)}
                                className={`transition-opacity duration-150 ease-fuerte ${activa !== null && activa !== indice ? "opacity-45" : ""}`}
                            >
                                {/* Zona sensible: la banda completa del mes, más grande que las columnas. */}
                                <rect x={inicioBanda(indice)} y={MARGEN.arriba} width={banda} height={altoTrazado} fill="transparent" />
                                {activa === indice && <rect x={inicioBanda(indice) + 2} y={MARGEN.arriba} width={Math.max(0, banda - 4)} height={altoTrazado} rx="6" fill="var(--color-slate-800)" opacity="0.5" />}

                                {series.map((serie, posicion) => {
                                    const valor = serie.valores[indice];
                                    if (!(valor > 0)) return null;
                                    const xBarra = centro(indice) - anchoGrupo / 2 + posicion * (anchoBarra + SEPARACION);
                                    return (
                                        <path
                                            key={serie.clave}
                                            d={columna(xBarra, y(valor), anchoBarra, base - y(valor))}
                                            fill={serie.color}
                                            className="grafico-barra"
                                            style={{ animationDelay: `${Math.min(indice * 35, 280)}ms` }}
                                        />
                                    );
                                })}

                                {indice === indiceMaximo && (
                                    <text x={centro(indice)} y={y(maximo) - 6} textAnchor="middle" className="grafico-relleno fill-white text-xs font-semibold tabular-nums">
                                        {pesosCompactos(maximo)}
                                    </text>
                                )}

                                {(indice % salto === 0 || indice === categorias.length - 1) && (
                                    <text x={centro(indice)} y={ALTO - 6} textAnchor="middle" className="fill-slate-400 text-[11px]">
                                        {categoria.etiqueta}
                                    </text>
                                )}
                            </g>
                        ))}

                        <line x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha} y1={base} y2={base} stroke="var(--color-slate-600)" strokeWidth="1" />
                    </svg>
                )}

                <TooltipGrafico
                    visible={activa !== null}
                    x={centro(activa ?? 0)}
                    ancho={ancho}
                    separacion={banda / 2 + 6}
                    titulo={categorias[activa ?? 0]?.nombreCompleto ?? ""}
                    filas={series.map((serie) => ({ clave: serie.clave, color: serie.color, nombre: serie.nombre, valor: formatearPesos(serie.valores[activa ?? 0]) }))}
                />
            </div>

            <TablaGrafico
                titulo={titulo}
                columnas={["Mes", ...series.map((serie) => serie.nombre)]}
                filas={categorias.map((categoria, indice) => [categoria.nombreCompleto, ...series.map((serie) => formatearPesos(serie.valores[indice]))])}
            />
        </figure>
    );
};

export default GraficoBarrasIngresos;
