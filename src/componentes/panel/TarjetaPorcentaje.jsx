/* Una métrica en porcentaje: valor grande y una barra que lo muestra. Sin "total" no hay nada que medir. */
const TarjetaPorcentaje = ({ icono: Icono, titulo, porcentaje, cantidad, total, textoTotal }) => (
    <article className="tarjeta">
        <p className="flex items-center gap-2 text-sm text-slate-400">
            <Icono size={20} className="text-marca" aria-hidden="true" />
            {titulo}
        </p>
        <p className="mt-2 text-3xl font-semibold text-white">{total === 0 ? "Sin datos" : `${porcentaje}%`}</p>

        <div className="mt-3 h-3 rounded-full bg-marca/20" role="img" aria-label={total === 0 ? `${titulo}: sin datos` : `${titulo}: ${porcentaje}%`}>
            <div className="h-full rounded-full bg-marca" style={{ width: `${total === 0 ? 0 : porcentaje}%` }} />
        </div>

        <p className="mt-2 text-sm text-slate-400">{total === 0 ? "No hay cotizaciones en este periodo" : `${cantidad} de ${total} ${textoTotal}`}</p>
    </article>
);

export default TarjetaPorcentaje;
