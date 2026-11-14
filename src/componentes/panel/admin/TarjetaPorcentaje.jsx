/* Una métrica en porcentaje: valor grande y una barra que lo muestra. Sin "total" no hay nada que medir. */
const TarjetaPorcentaje = ({ icono: Icono, titulo, porcentaje, cantidad, total, textoTotal }) => (
    <article className="tarjeta">
        <p className="flex items-center justify-between gap-2 text-sm font-medium text-slate-400">
            {titulo}
            <Icono size={18} className="shrink-0 text-slate-500" aria-hidden="true" />
        </p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-white tabular-nums">{total === 0 ? "Sin datos" : `${porcentaje}%`}</p>

        <div className="mt-3 h-2 rounded-full bg-slate-800" role="img" aria-label={total === 0 ? `${titulo}: sin datos` : `${titulo}: ${porcentaje}%`}>
            <div className="h-full rounded-full bg-marca" style={{ width: `${total === 0 ? 0 : porcentaje}%` }} />
        </div>

        <p className="mt-2 text-sm text-slate-400">{total === 0 ? "No hay cotizaciones en este periodo" : `${cantidad} de ${total} ${textoTotal}`}</p>
    </article>
);

export default TarjetaPorcentaje;
