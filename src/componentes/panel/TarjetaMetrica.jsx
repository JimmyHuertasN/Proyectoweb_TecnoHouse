/* Una métrica del dashboard: nombre, valor grande y un detalle opcional debajo. */
const TarjetaMetrica = ({ icono: Icono, titulo, valor, detalle }) => (
    <article className="tarjeta">
        <p className="flex items-center gap-2 text-sm text-slate-400">
            <Icono size={20} className="text-marca" aria-hidden="true" />
            {titulo}
        </p>
        <p className="mt-2 text-3xl font-semibold text-white">{valor}</p>
        {detalle && <p className="mt-1 text-sm text-slate-400">{detalle}</p>}
    </article>
);

export default TarjetaMetrica;
