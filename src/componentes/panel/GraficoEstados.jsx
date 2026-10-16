/*
    Barras horizontales con la cantidad de servicios en cada estado. Los estados
    van en el orden del flujo de reparación, no ordenados por cantidad.
*/
const GraficoEstados = ({ estados, total }) => {
    const maximo = Math.max(...estados.map((estado) => estado.cantidad), 1);

    return (
        <ul className="space-y-3" aria-label="Servicios por estado">
            {estados.map((estado) => {
                const porcentaje = total > 0 ? Math.round((estado.cantidad / total) * 100) : 0;
                const descripcion = `${estado.etiqueta}: ${estado.cantidad} ${estado.cantidad === 1 ? "servicio" : "servicios"} (${porcentaje}%)`;

                return (
                    <li key={estado.valor} title={descripcion} className="group grid grid-cols-[9rem_1fr_2.5rem] items-center gap-3 rounded-md py-1 sm:grid-cols-[11rem_1fr_2.5rem]">
                        <span className="truncate text-sm text-slate-300">{estado.etiqueta}</span>
                        <span className="h-3 rounded-full bg-slate-800" aria-hidden="true">
                            <span
                                className="block h-full rounded-full bg-marca transition-opacity group-hover:opacity-80"
                                style={{ width: `${(estado.cantidad / maximo) * 100}%` }}
                            />
                        </span>
                        <span className="text-right text-sm font-semibold text-white tabular-nums">{estado.cantidad}</span>
                    </li>
                );
            })}
        </ul>
    );
};

export default GraficoEstados;
