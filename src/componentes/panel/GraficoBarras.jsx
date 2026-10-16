/*
    Barras horizontales de una sola serie. Cada dato: { clave, etiqueta, valor, textoValor, descripcion }.
    "maximo" fija el largo de la barra llena (por ejemplo 5 para calificaciones); si no se da, se usa el mayor valor.
*/
const GraficoBarras = ({ datos, maximo, etiquetaAria }) => {
    const tope = maximo ?? Math.max(...datos.map((dato) => dato.valor), 1);

    return (
        <ul className="space-y-3" aria-label={etiquetaAria}>
            {datos.map((dato) => (
                <li key={dato.clave} title={dato.descripcion} className="group grid grid-cols-[9rem_1fr_3rem] items-center gap-3 py-1 sm:grid-cols-[11rem_1fr_3rem]">
                    <span className="truncate text-sm text-slate-300">{dato.etiqueta}</span>
                    <span className="h-3 rounded-full bg-slate-800" aria-hidden="true">
                        <span
                            className="block h-full rounded-full bg-marca transition-opacity group-hover:opacity-80"
                            style={{ width: `${(dato.valor / tope) * 100}%` }}
                        />
                    </span>
                    <span className="text-right text-sm font-semibold text-white tabular-nums">{dato.textoValor ?? dato.valor}</span>
                </li>
            ))}
        </ul>
    );
};

export default GraficoBarras;
