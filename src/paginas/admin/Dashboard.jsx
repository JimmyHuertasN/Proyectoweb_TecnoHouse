import { useEffect, useState } from "react";
import { BriefcaseBusiness, Clock, ThumbsUp, UsersRound, Wrench } from "lucide-react";
import { obtenerMetricas, obtenerPorcentajeAprobadas, obtenerTiempoPromedio } from "../../api/admin.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import GraficoBarras from "../../componentes/panel/GraficoBarras.jsx";
import ResumenIngresos from "../../componentes/panel/ResumenIngresos.jsx";
import SelectorRangoFechas from "../../componentes/panel/SelectorRangoFechas.jsx";
import TarjetaMetrica from "../../componentes/panel/TarjetaMetrica.jsx";
import TarjetaPorcentaje from "../../componentes/panel/TarjetaPorcentaje.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import { useRangoFechas } from "../../hooks/useRangoFechas.js";

const formatoNumero = new Intl.NumberFormat("es-CO");

const Dashboard = () => {
    const rango = useRangoFechas();
    const { desde, hasta } = rango;
    // { clave, datos } o { clave, error }; "clave" identifica el periodo y la recarga a los que pertenece.
    const [resultado, setResultado] = useState(null);
    // Cada vez que aumenta, el useEffect vuelve a pedir las métricas a Supabase.
    const [recargas, setRecargas] = useState(0);

    useEffect(() => {
        let vigente = true;
        const clave = `${desde}|${hasta}|${recargas}`;

        Promise.all([obtenerMetricas(desde, hasta), obtenerTiempoPromedio(desde, hasta), obtenerPorcentajeAprobadas(desde, hasta)])
            .then(([metricas, tiempo, aprobadas]) => vigente && setResultado({ clave, datos: { metricas, tiempo, aprobadas } }))
            .catch(() => vigente && setResultado({ clave, error: "No se pudieron cargar las métricas." }));

        return () => {
            vigente = false;
        };
    }, [desde, hasta, recargas]);

    // Mientras llega el periodo nuevo se siguen mostrando los datos anteriores, atenuados.
    const esActual = resultado?.clave === `${desde}|${hasta}|${recargas}`;
    const actualizando = resultado !== null && !esActual;
    const error = esActual ? (resultado.error ?? "") : "";
    const datos = resultado?.datos;

    return (
        <>
            <EncabezadoPagina titulo="Dashboard" descripcion="Resumen general de TecnoHouse.">
                <button type="button" onClick={() => setRecargas((anterior) => anterior + 1)} className="boton-secundario">
                    ↻ Actualizar
                </button>
            </EncabezadoPagina>

            <SelectorRangoFechas id="dashboard" rango={rango} />

            <Aviso texto={error} tipo="error" />

            {!datos && !error && <Skeleton tipo="metrica" cantidad={3} etiqueta="Cargando métricas" className="mb-6" />}

            {datos && (
                <div aria-busy={actualizando} className={actualizando ? "opacity-60 transition-opacity" : "transition-opacity"}>
                    <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <TarjetaMetrica
                            icono={UsersRound}
                            titulo="Clientes"
                            valor={formatoNumero.format(datos.metricas.clientes)}
                            detalle={`${formatoNumero.format(datos.metricas.clientesNuevos)} nuevos en el periodo`}
                        />
                        <TarjetaMetrica
                            icono={BriefcaseBusiness}
                            titulo="Técnicos"
                            valor={formatoNumero.format(datos.metricas.tecnicos)}
                            detalle={`${datos.metricas.tecnicosDisponibles} disponibles`}
                        />
                        <TarjetaMetrica
                            icono={Wrench}
                            titulo="Servicios"
                            valor={formatoNumero.format(datos.metricas.totalServicios)}
                            detalle={`${datos.metricas.serviciosEnCurso} en curso`}
                        />
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <TarjetaMetrica
                            icono={Clock}
                            titulo="Tiempo promedio de atención"
                            valor={datos.tiempo ? `${formatoNumero.format(datos.tiempo.dias)} ${datos.tiempo.dias === 1 ? "día" : "días"}` : "Sin datos"}
                            detalle={
                                datos.tiempo
                                    ? `Desde la solicitud hasta la calificación, en ${datos.tiempo.servicios} ${datos.tiempo.servicios === 1 ? "servicio calificado" : "servicios calificados"}`
                                    : "Aún no hay servicios calificados en este periodo"
                            }
                        />
                        <TarjetaPorcentaje
                            icono={ThumbsUp}
                            titulo="Cotizaciones aprobadas"
                            porcentaje={datos.aprobadas.porcentaje}
                            cantidad={datos.aprobadas.aprobadas}
                            total={datos.aprobadas.cotizadas}
                            textoTotal="cotizaciones"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <section className="tarjeta lg:col-span-3">
                            <h2 className="mb-1 text-lg font-semibold">Servicios por estado</h2>
                            <p className="mb-5 text-sm text-slate-400">En el orden del proceso de reparación</p>
                            <GraficoBarras
                                etiquetaAria="Servicios por estado"
                                datos={datos.metricas.serviciosPorEstado.map((estado) => ({
                                    clave: estado.valor,
                                    etiqueta: estado.etiqueta,
                                    valor: estado.cantidad,
                                    descripcion: `${estado.etiqueta}: ${estado.cantidad} de ${datos.metricas.totalServicios} servicios`,
                                }))}
                            />
                        </section>

                        <div className="lg:col-span-2">
                            <ResumenIngresos ingresos={datos.metricas.ingresos} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
