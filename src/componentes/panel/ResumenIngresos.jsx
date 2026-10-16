import { formatearPesos } from "../../utilidades/formato.js";

/* Total de ingresos y una barra que muestra qué parte ya se cobró. */
const ResumenIngresos = ({ ingresos }) => {
    const porcentajeRealizado = ingresos.total > 0 ? (ingresos.realizados / ingresos.total) * 100 : 0;

    return (
        <section className="tarjeta">
            <h2 className="text-lg font-semibold">Ingresos</h2>
            <p className="mt-1 text-sm text-slate-400">Suma de las cotizaciones aprobadas</p>

            <p className="mt-4 text-5xl font-semibold text-white">{formatearPesos(ingresos.total)}</p>

            <div className="mt-6 h-3 rounded-full bg-marca/20" role="img" aria-label={`${Math.round(porcentajeRealizado)}% de los ingresos ya se realizó`}>
                <div className="h-full rounded-full bg-marca" style={{ width: `${porcentajeRealizado}%` }} />
            </div>

            <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-slate-300">
                        <span className="size-2.5 rounded-full bg-marca" aria-hidden="true" />
                        Realizados (servicios terminados)
                    </dt>
                    <dd className="font-semibold text-white">{formatearPesos(ingresos.realizados)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-slate-300">
                        <span className="size-2.5 rounded-full bg-marca/20" aria-hidden="true" />
                        Por cobrar (en reparación)
                    </dt>
                    <dd className="font-semibold text-white">{formatearPesos(ingresos.porCobrar)}</dd>
                </div>
            </dl>
        </section>
    );
};

export default ResumenIngresos;
