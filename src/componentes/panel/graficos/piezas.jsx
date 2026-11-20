/*
    Piezas visuales que comparten los gráficos de ingresos: el tooltip, la leyenda y la tabla
    equivalente para lectores de pantalla. Los hooks están en hooksGrafico.js.
*/

/*
    Tooltip con el detalle de un mes: el valor manda (fuerte) y el nombre de la serie acompaña.
    Va al costado del mes señalado ("x", en px dentro del gráfico), separado "separacion" px, del
    lado con más espacio: así nunca tapa el punto ni la columna que se está mirando. Se mueve con
    translate; al cambiar de lado se monta de nuevo (key) para no cruzar el gráfico deslizándose.
*/
export const TooltipGrafico = ({ visible, x, ancho, separacion = 12, titulo, filas }) => {
    const aLaIzquierda = x > ancho / 2;
    const desplazamiento = aLaIzquierda ? `calc(${x - separacion}px - 100%)` : `${x + separacion}px`;

    return (
        <div
            key={aLaIzquierda ? "izquierda" : "derecha"}
            aria-hidden="true"
            className={`pointer-events-none absolute top-0 left-0 z-10 w-max max-w-60 rounded-lg border border-borde bg-fondo/95 px-3 py-2 shadow-xl shadow-black/30 backdrop-blur transition-[opacity,translate] duration-150 ease-fuerte ${visible ? "opacity-100" : "opacity-0"}`}
            style={{ translate: `${desplazamiento} ${visible ? 0 : 4}px` }}
        >
            <p className="mb-1.5 text-xs text-slate-400 first-letter:uppercase">{titulo}</p>
            <ul className="space-y-1">
                {filas.map((fila) => (
                    <li key={fila.clave} className="flex items-center gap-2 text-xs">
                        <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: fila.color }} />
                        <span className="font-semibold text-white tabular-nums">{fila.valor}</span>
                        <span className="text-slate-400">{fila.nombre}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/* Leyenda de dos o más series (con una sola, el título ya dice qué se grafica). */
export const LeyendaSeries = ({ series }) =>
    series.length < 2 ? null : (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
            {series.map((serie) => (
                <li key={serie.clave} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm" style={{ background: serie.color }} aria-hidden="true" />
                    {serie.nombre}
                </li>
            ))}
        </ul>
    );

/* Los mismos datos del gráfico como tabla, solo para lectores de pantalla. */
export const TablaGrafico = ({ titulo, columnas, filas }) => (
    <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
            <tr>
                {columnas.map((columna) => (
                    <th key={columna} scope="col">{columna}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {filas.map((fila) => (
                <tr key={fila[0]}>
                    {fila.map((celda, indice) => (indice === 0 ? <th key={indice} scope="row">{celda}</th> : <td key={indice}>{celda}</td>))}
                </tr>
            ))}
        </tbody>
    </table>
);

/* Mensaje cuando el periodo no tiene ingresos que graficar. */
export const SinDatosGrafico = () => (
    <p className="rounded-lg border border-dashed border-slate-700 px-4 py-10 text-center text-sm text-slate-400">
        No hay ingresos en este periodo para graficar.
    </p>
);
