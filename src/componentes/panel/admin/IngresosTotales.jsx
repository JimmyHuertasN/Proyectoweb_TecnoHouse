import { ShoppingBag, Wrench } from "lucide-react";
import { formatearPesos } from "../../../utilidades/formato.js";
import { COLORES_GRAFICO } from "../../../utilidades/graficos.js";
import VisorIngresos from "../graficos/VisorIngresos.jsx";

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

/*
    Lo ganado en el periodo sumando reparaciones y tienda, y cuánto aporta cada una.
    "porMesReparaciones" y "porMesTienda" son los meses del periodo ({ clave, etiqueta, nombreCompleto, valor })
    para las vistas de área y barras.
*/
const IngresosTotales = ({ reparaciones, tienda, porMesReparaciones, porMesTienda }) => {
    const total = reparaciones + tienda;
    const [colorReparaciones, colorTienda] = COLORES_GRAFICO;

    return (
        <section className="tarjeta mb-6 border-marca/40 bg-gradient-to-br from-marca/10 to-tarjeta">
            <VisorIngresos
                id="dashboard-ingresos-totales"
                titulo="Ingresos totales"
                encabezado={
                    <>
                        <h2 className="text-lg font-semibold">Ingresos totales</h2>
                        <p className="mt-1 text-sm text-slate-400">Lo ganado en el periodo con reparaciones y tienda</p>
                        <p className="mt-4 text-5xl font-semibold text-white">{formatearPesos(total)}</p>
                    </>
                }
                descripciones={{
                    actual: "Cuánto aporta cada fuente al total del periodo.",
                    area: "Evolución mes a mes de los ingresos de reparaciones y de la tienda. Pasa el cursor para ver cada mes.",
                    barras: "Ingresos de cada mes, con reparaciones y tienda lado a lado para compararlos.",
                    circular: "Qué parte del total viene de reparaciones y qué parte de la tienda.",
                }}
                actual={
                    <div className="space-y-4">
                        <FilaIngreso Icono={Wrench} texto="Reparaciones" valor={reparaciones} total={total} colorBarra="bg-marca" nota="Cotizaciones aprobadas de servicios terminados" />
                        <FilaIngreso Icono={ShoppingBag} texto="Tienda" valor={tienda} total={total} colorBarra="bg-emerald-400" nota="Pedidos entregados" />
                    </div>
                }
                categorias={porMesReparaciones}
                series={[
                    { clave: "reparaciones", nombre: "Reparaciones", color: colorReparaciones, valores: porMesReparaciones.map((mes) => mes.valor) },
                    { clave: "tienda", nombre: "Tienda", color: colorTienda, valores: porMesTienda.map((mes) => mes.valor) },
                ]}
                partes={[
                    { clave: "reparaciones", nombre: "Reparaciones", valor: reparaciones, color: colorReparaciones },
                    { clave: "tienda", nombre: "Tienda", valor: tienda, color: colorTienda },
                ]}
            />
        </section>
    );
};

export default IngresosTotales;
