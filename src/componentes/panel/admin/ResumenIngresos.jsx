import { formatearPesos } from "../../../utilidades/formato.js";
import { COLORES_GRAFICO } from "../../../utilidades/graficos.js";
import VisorIngresos from "../graficos/VisorIngresos.jsx";

/*
    Total de ingresos de reparaciones y qué parte ya se cobró. "porMes" son los meses del periodo
    ({ mes, etiqueta, nombreCompleto, total, porCobrar }, ver obtenerIngresosPorMes) para área y barras.
*/
const ResumenIngresos = ({ ingresos, porMes }) => {
    const porcentajeRealizado = ingresos.total > 0 ? (ingresos.realizados / ingresos.total) * 100 : 0;
    // Azul (lo realizado, como en el resto del panel) y naranja (lo pendiente) para distinguirlos a simple vista.
    const colorRealizados = COLORES_GRAFICO[0];
    const colorPorCobrar = COLORES_GRAFICO[2];

    return (
        <section className="tarjeta">
            <VisorIngresos
                id="dashboard-ingresos-reparaciones"
                titulo="Ingresos de reparaciones"
                encabezado={
                    <>
                        <h2 className="text-lg font-semibold">Ingresos de reparaciones</h2>
                        <p className="mt-1 text-sm text-slate-400">Suma de las cotizaciones aprobadas</p>
                        <p className="mt-4 text-5xl font-semibold text-white">{formatearPesos(ingresos.total)}</p>
                    </>
                }
                descripciones={{
                    actual: "Qué parte del total ya se realizó y cuánto falta por cobrar.",
                    area: "Mes a mes: lo realizado frente a lo que sigue por cobrar, según el mes de la solicitud.",
                    barras: "Realizado y por cobrar de cada mes, lado a lado.",
                    circular: "Reparto del total entre lo ya realizado y lo que falta por cobrar.",
                }}
                actual={
                    <>
                        <div className="h-3 rounded-full bg-marca/20" role="img" aria-label={`${Math.round(porcentajeRealizado)}% de los ingresos ya se realizó`}>
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
                    </>
                }
                categorias={porMes.map((mes) => ({ clave: mes.mes, etiqueta: mes.etiqueta, nombreCompleto: mes.nombreCompleto }))}
                series={[
                    { clave: "realizados", nombre: "Realizados", color: colorRealizados, valores: porMes.map((mes) => mes.total) },
                    { clave: "por-cobrar", nombre: "Por cobrar", color: colorPorCobrar, valores: porMes.map((mes) => mes.porCobrar) },
                ]}
                partes={[
                    { clave: "realizados", nombre: "Realizados", valor: ingresos.realizados, color: colorRealizados },
                    { clave: "por-cobrar", nombre: "Por cobrar", valor: ingresos.porCobrar, color: colorPorCobrar },
                ]}
            />
        </section>
    );
};

export default ResumenIngresos;
