import { useState } from "react";
import { Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { filtrarSolicitudes } from "../../api/solicitudes.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FilaSolicitud from "../../componentes/panel/FilaSolicitud.jsx";
import FiltroSolicitudes from "../../componentes/panel/FiltroSolicitudes.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import { useSolicitudes } from "../../hooks/useSolicitudes.js";

const MisSolicitudes = () => {
    const { solicitudes, cargando, error } = useSolicitudes();
    const [filtro, setFiltro] = useState("todas");
    const visibles = filtrarSolicitudes(solicitudes, filtro);

    return (
        <>
            <EncabezadoPagina titulo="Solicitudes de servicio" descripcion="Consulta el estado y el historial de cada reparación.">
                <Link to="/cliente/solicitudes/nueva" className="boton-primario">+ Nueva solicitud</Link>
            </EncabezadoPagina>

            <Aviso texto={error} tipo="error" />

            {cargando && <Skeleton tipo="fila" cantidad={4} etiqueta="Cargando solicitudes" />}

            {!cargando && !error && solicitudes.length === 0 && (
                <EstadoVacio
                    icono={Wrench}
                    titulo="Aún no has solicitado ningún servicio"
                    descripcion="Elige uno de tus dispositivos, cuéntanos qué le pasa y un técnico lo revisará."
                >
                    <Link to="/cliente/solicitudes/nueva" className="boton-primario">Solicitar mi primera reparación</Link>
                </EstadoVacio>
            )}

            {solicitudes.length > 0 && (
                <>
                    <FiltroSolicitudes solicitudes={solicitudes} filtro={filtro} alCambiar={setFiltro} />

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
