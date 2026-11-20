import { formatearPesos } from "../../../utilidades/formato.js";
import { marcasEje, pesosCompactos, saltoDeEtiquetas } from "../../../utilidades/graficos.js";
import { useAncho, useCategoriaActiva } from "./hooksGrafico.js";
import { LeyendaSeries, TablaGrafico, TooltipGrafico } from "./piezas.jsx";

const ALTO = 220;
const MARGEN = { arriba: 16, derecha: 12, abajo: 26, izquierda: 56 };

/*
    Área de ingresos a lo largo de los meses. Una línea de 2 px por serie con un relleno suave debajo
    (10 %). Con el cursor o las flechas, una línea vertical marca el mes y el tooltip lista todas las
    series de ese mes. Al aparecer, la línea se dibuja de izquierda a derecha y el relleno se funde.
    categorias: [{ clave, etiqueta, nombreCompleto }]; series: [{ clave, nombre, color, valores }].
*/
const GraficoArea = ({ titulo, categorias, series }) => {
    const [referencia, ancho] = useAncho();
    const [activa, setActiva, propsContenedor] = useCategoriaActiva(categorias.length);

    const maximo = Math.max(0, ...series.flatMap((serie) => serie.valores));
    const { tope, marcas } = marcasEje(maximo);
    const anchoTrazado = Math.max(0, ancho - MARGEN.izquierda - MARGEN.derecha);
    const altoTrazado = ALTO - MARGEN.arriba - MARGEN.abajo;
    const paso = categorias.length > 1 ? anchoTrazado / (categorias.length - 1) : 0;
    const x = (indice) => MARGEN.izquierda + (categorias.length > 1 ? indice * paso : anchoTrazado / 2);
    const y = (valor) => MARGEN.arriba + altoTrazado * (1 - valor / tope);
    const base = y(0);
    const salto = saltoDeEtiquetas(categorias.length, anchoTrazado);

    const linea = (valores) => valores.map((valor, indice) => `${indice === 0 ? "M" : "L"}${x(indice)},${y(valor)}`).join("");
    const area = (valores) => `${linea(valores)}L${x(valores.length - 1)},${base}L${x(0)},${base}Z`;

    // Con una sola serie se rotula su último valor (el que más interesa); con varias, la leyenda y el tooltip.
    const unica = series.length === 1 ? series[0] : null;
    const ultimo = categorias.length - 1;

    const alMoverCursor = (evento) => {
        const caja = evento.currentTarget.getBoundingClientRect();
        const posicion = evento.clientX - caja.left - MARGEN.izquierda;
        setActiva(categorias.length > 1 ? Math.min(ultimo, Math.max(0, Math.round(posicion / paso))) : 0);
    };

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
                    <svg width={ancho} height={ALTO} className="block overflow-visible" aria-hidden="true" onPointerMove={alMoverCursor} onPointerLeave={() => setActiva(null)}>
                        {marcas.map((marca) => (
                            <g key={marca}>
                                <line x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha} y1={y(marca)} y2={y(marca)} stroke="var(--color-borde)" strokeWidth="1" />
                                <text x={MARGEN.izquierda - 8} y={y(marca)} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[11px] tabular-nums">
                                    {pesosCompactos(marca)}
                                </text>
                            </g>
                        ))}

                        {categorias.map((categoria, indice) =>
                            indice % salto === 0 || indice === ultimo ? (
                                <text key={categoria.clave} x={x(indice)} y={ALTO - 6} textAnchor="middle" className="fill-slate-400 text-[11px]">
                                    {categoria.etiqueta}
                                </text>
                            ) : null
                        )}

                        {series.map((serie) => (
                            <g key={serie.clave}>
                                <path d={area(serie.valores)} fill={serie.color} fillOpacity="0.1" className="grafico-relleno" />
                                <path
                                    d={linea(serie.valores)}
                                    pathLength="1"
                                    fill="none"
                                    stroke={serie.color}
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    className="grafico-trazo"
                                />
                            </g>
                        ))}

                        {unica && (
                            <text x={x(ultimo)} y={y(unica.valores[ultimo]) - 10} textAnchor={categorias.length > 1 ? "end" : "middle"} className="grafico-relleno fill-white text-xs font-semibold tabular-nums">
                                {pesosCompactos(unica.valores[ultimo])}
                            </text>
                        )}

                        {activa !== null && (
                            <g className="pointer-events-none">
                                <line x1={x(activa)} x2={x(activa)} y1={MARGEN.arriba} y2={base} stroke="var(--color-slate-500)" strokeWidth="1" />
                                {series.map((serie) => (
                                    <circle key={serie.clave} cx={x(activa)} cy={y(serie.valores[activa])} r="4.5" fill={serie.color} stroke="var(--color-tarjeta)" strokeWidth="2" />
                                ))}
                            </g>
                        )}

                        {/* Zona sensible: todo el trazado, así basta acercarse al mes, no atinarle a la línea. */}
                        <rect x={MARGEN.izquierda - paso / 2} y={0} width={anchoTrazado + paso} height={ALTO} fill="transparent" />
                    </svg>
                )}

                <TooltipGrafico
                    visible={activa !== null}
                    x={x(activa ?? 0)}
                    ancho={ancho}
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

export default GraficoArea;
