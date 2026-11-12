import { ShoppingBag, Wrench } from "lucide-react";
import { formatearPesos } from "../../utilidades/formato.js";

const porcentaje = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0);

const FilaIngreso = ({ Icono, texto, valor, total, colorBarra, nota }) => (
    <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-300">
                <Icono size={16} className="text-marca" aria-hidden="true" /> {texto}
            </span>
            <span className="font-semibold text-white">
                {formatearPesos(valor)} <span className="font-normal text-slate-500">({porcentaje(valor, total)}%)</span>
            </span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-800" aria-hidden="true">
            <div className={`h-full rounded-full ${colorBarra}`} style={{ width: `${porcentaje(valor, total)}%` }} />
        </div>
        {nota && <p className="mt-1 text-xs text-slate-500">{nota}</p>}
    </div>
);

/* Lo ganado en el periodo sumando reparaciones y tienda, y cuánto aporta cada una. */
const IngresosTotales = ({ reparaciones, tienda }) => {
    const total = reparaciones + tienda;

    return (
        <section className="tarjeta mb-6 border-marca/40 bg-gradient-to-br from-marca/10 to-tarjeta">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
                <div>
                    <h2 className="text-lg font-semibold">Ingresos totales</h2>
                    <p className="mt-1 text-sm text-slate-400">Lo ganado en el periodo con reparaciones y tienda</p>
                    <p className="mt-4 text-5xl font-semibold text-white">{formatearPesos(total)}</p>
                </div>

                <div className="space-y-4">
                    <FilaIngreso Icono={Wrench} texto="Reparaciones" valor={reparaciones} total={total} colorBarra="bg-marca" nota="Cotizaciones aprobadas de servicios terminados" />
                    {/* PENDIENTE BASE: la tienda suma cuando existan los pedidos entregados. */}
                    <FilaIngreso Icono={ShoppingBag} texto="Tienda" valor={tienda} total={total} colorBarra="bg-emerald-400" nota="Pendiente: se suma cuando la base registre los pedidos" />
                </div>
            </div>
        </section>
    );
};

export default IngresosTotales;
