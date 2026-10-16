import { useEffect, useState } from "react";
import { obtenerMetricas } from "../../api/admin.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import GraficoEstados from "../../componentes/panel/GraficoEstados.jsx";
import ResumenIngresos from "../../componentes/panel/ResumenIngresos.jsx";
import TarjetaMetrica from "../../componentes/panel/TarjetaMetrica.jsx";

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

            {!metricas && !error && <p className="text-slate-400">Cargando métricas...</p>}

            {metricas && (
                <>
                    <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <TarjetaMetrica icono="👥" titulo="Clientes" valor={formatoNumero.format(metricas.clientes)} />
                        <TarjetaMetrica
                            icono="🧑‍🔧"
                            titulo="Técnicos"
                            valor={formatoNumero.format(metricas.tecnicos)}
                            detalle={`${metricas.tecnicosDisponibles} disponibles`}
                        />
                        <TarjetaMetrica
                            icono="🛠️"
                            titulo="Servicios"
                            valor={formatoNumero.format(metricas.totalServicios)}
                            detalle={`${metricas.serviciosEnCurso} en curso`}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <section className="tarjeta lg:col-span-3">
                            <h2 className="mb-1 text-lg font-semibold">Servicios por estado</h2>
                            <p className="mb-5 text-sm text-slate-400">En el orden del proceso de reparación</p>
                            <GraficoEstados estados={metricas.serviciosPorEstado} total={metricas.totalServicios} />
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
