import { useEffect, useState } from "react";
import { BriefcaseBusiness, UsersRound, Wrench } from "lucide-react";
import { obtenerMetricas } from "../../api/admin.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import GraficoBarras from "../../componentes/panel/GraficoBarras.jsx";
import ResumenIngresos from "../../componentes/panel/ResumenIngresos.jsx";
import TarjetaMetrica from "../../componentes/panel/TarjetaMetrica.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";

const formatoNumero = new Intl.NumberFormat("es-CO");

const Dashboard = () => {
    const [metricas, setMetricas] = useState(null);
    const [error, setError] = useState("");
    // Cada vez que aumenta, el useEffect vuelve a pedir las métricas a Supabase.
    const [recargas, setRecargas] = useState(0);

    useEffect(() => {
        let vigente = true;

        obtenerMetricas()
            .then((datos) => vigente && setMetricas(datos))
            .catch(() => vigente && setError("No se pudieron cargar las métricas."));

        return () => {
            vigente = false;
        };
    }, [recargas]);

    return (
        <>
            <EncabezadoPagina titulo="Dashboard" descripcion="Resumen general de TecnoHouse.">
                <button type="button" onClick={() => setRecargas((anterior) => anterior + 1)} className="boton-secundario">
                    ↻ Actualizar
                </button>
            </EncabezadoPagina>

            <Aviso texto={error} tipo="error" />

            {!metricas && !error && <Skeleton tipo="metrica" cantidad={3} etiqueta="Cargando métricas" className="mb-6" />}

            {metricas && (
                <>
                    <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <TarjetaMetrica icono={UsersRound} titulo="Clientes" valor={formatoNumero.format(metricas.clientes)} />
                        <TarjetaMetrica
                            icono={BriefcaseBusiness}
                            titulo="Técnicos"
                            valor={formatoNumero.format(metricas.tecnicos)}
                            detalle={`${metricas.tecnicosDisponibles} disponibles`}
                        />
                        <TarjetaMetrica
                            icono={Wrench}
                            titulo="Servicios"
                            valor={formatoNumero.format(metricas.totalServicios)}
                            detalle={`${metricas.serviciosEnCurso} en curso`}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <section className="tarjeta lg:col-span-3">
                            <h2 className="mb-1 text-lg font-semibold">Servicios por estado</h2>
                            <p className="mb-5 text-sm text-slate-400">En el orden del proceso de reparación</p>
                            <GraficoBarras
                                etiquetaAria="Servicios por estado"
                                datos={metricas.serviciosPorEstado.map((estado) => ({
                                    clave: estado.valor,
                                    etiqueta: estado.etiqueta,
                                    valor: estado.cantidad,
                                    descripcion: `${estado.etiqueta}: ${estado.cantidad} de ${metricas.totalServicios} servicios`,
                                }))}
                            />
                        </section>

                        <div className="lg:col-span-2">
                            <ResumenIngresos ingresos={metricas.ingresos} />
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Dashboard;
