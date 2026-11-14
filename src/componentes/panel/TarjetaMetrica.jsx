/* Una métrica del panel: nombre, valor grande y un detalle opcional debajo. */
const TarjetaMetrica = ({ icono: Icono, titulo, valor, detalle }) => (
    <article className="tarjeta">
        <p className="flex items-center justify-between gap-2 text-sm font-medium text-slate-400">
            {titulo}
            <Icono size={18} className="shrink-0 text-slate-500" aria-hidden="true" />
        </p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-white tabular-nums">{valor}</p>
        {detalle && <p className="mt-1 text-sm text-slate-400">{detalle}</p>}
    </article>
);

export default TarjetaMetrica;
