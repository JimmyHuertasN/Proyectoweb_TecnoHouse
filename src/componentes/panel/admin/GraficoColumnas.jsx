/* Columnas verticales de una sola serie, para valores a lo largo del tiempo. Cada dato: { clave, etiqueta, valor, textoValor, descripcion }; "textoValor" reemplaza al número sobre la columna (por ejemplo, dinero abreviado). */
const GraficoColumnas = ({ datos, etiquetaAria }) => {
    const maximo = Math.max(...datos.map((dato) => dato.valor), 1);

    return (
        <div>
            <ol className="flex h-56 items-end gap-2 border-b border-slate-700 sm:gap-4" aria-label={etiquetaAria}>
                {datos.map((dato) => (
                    <li key={dato.clave} title={dato.descripcion} className="group flex h-full flex-1 flex-col items-center justify-end">
                        <span className="sr-only">{dato.etiqueta}: </span>
                        <span className="mb-1 text-sm font-semibold text-white tabular-nums">{dato.textoValor ?? dato.valor}</span>
                        <span
                            className="w-full max-w-12 rounded-t bg-marca transition-opacity group-hover:opacity-80"
                            style={{ height: `${(dato.valor / maximo) * 80}%` }}
                            aria-hidden="true"
                        />
                    </li>
                ))}
            </ol>
            <div className="mt-2 flex gap-2 sm:gap-4" aria-hidden="true">
                {datos.map((dato) => (
                    <span key={dato.clave} className="flex-1 text-center text-xs text-slate-400">
                        {dato.etiqueta}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default GraficoColumnas;
