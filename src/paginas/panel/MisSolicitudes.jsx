import { useState } from "react";
import { Link } from "react-router-dom";
import { estaActiva } from "../../api/solicitudes.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FilaSolicitud from "../../componentes/panel/FilaSolicitud.jsx";
import { useSolicitudes } from "../../hooks/useSolicitudes.js";

const FILTROS = [
    { valor: "todas", etiqueta: "Todas", cumple: () => true },
    { valor: "activas", etiqueta: "En curso", cumple: estaActiva },
    { valor: "finalizadas", etiqueta: "Finalizadas", cumple: (solicitud) => !estaActiva(solicitud) },
];

const MisSolicitudes = () => {
    const { solicitudes, cargando, error } = useSolicitudes();
    const [filtro, setFiltro] = useState("todas");

    const filtroActual = FILTROS.find((opcion) => opcion.valor === filtro);
    const visibles = solicitudes.filter(filtroActual.cumple);

    return (
        <>
            <EncabezadoPagina titulo="Solicitudes de servicio" descripcion="Consulta el estado y el historial de cada reparación.">
                <Link to="/cliente/solicitudes/nueva" className="boton-primario">+ Nueva solicitud</Link>
            </EncabezadoPagina>

            <Aviso texto={error} tipo="error" />

            {cargando && <p className="text-slate-400">Cargando solicitudes...</p>}

            {!cargando && !error && solicitudes.length === 0 && (
                <EstadoVacio
                    icono="🛠️"
                    titulo="Aún no has solicitado ningún servicio"
                    descripcion="Elige uno de tus dispositivos, cuéntanos qué le pasa y un técnico lo revisará."
                >
                    <Link to="/cliente/solicitudes/nueva" className="boton-primario">Solicitar mi primera reparación</Link>
                </EstadoVacio>
            )}

            {solicitudes.length > 0 && (
                <>
                    <div className="mb-5 inline-flex rounded-lg border border-borde bg-fondo p-1" role="group" aria-label="Filtrar solicitudes">
                        {FILTROS.map((opcion) => (
                            <button
                                key={opcion.valor}
                                type="button"
                                onClick={() => setFiltro(opcion.valor)}
                                aria-pressed={filtro === opcion.valor}
                                className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition ${
                                    filtro === opcion.valor ? "bg-marca text-white" : "text-slate-400 hover:text-white"
                                }`}
                            >
                                {opcion.etiqueta} ({solicitudes.filter(opcion.cumple).length})
                            </button>
                        ))}
                    </div>

                    {visibles.length === 0 ? (
                        <p className="py-8 text-center text-slate-400">No hay solicitudes en esta categoría.</p>
                    ) : (
                        <ul className="space-y-3">
                            {visibles.map((solicitud) => (
                                <FilaSolicitud key={solicitud.id} solicitud={solicitud} />
                            ))}
                        </ul>
                    )}
                </>
            )}
        </>
    );
};

export default MisSolicitudes;
