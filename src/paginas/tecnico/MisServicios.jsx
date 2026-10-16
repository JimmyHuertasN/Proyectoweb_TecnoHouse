import { useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { Link } from "react-router-dom";
import { filtrarSolicitudes } from "../../api/solicitudes.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FilaSolicitud from "../../componentes/panel/FilaSolicitud.jsx";
import FiltroSolicitudes from "../../componentes/panel/FiltroSolicitudes.jsx";
import { useServiciosAsignados } from "../../hooks/useServiciosAsignados.js";

const MisServicios = () => {
    const { servicios, cargando, error } = useServiciosAsignados();
    const [filtro, setFiltro] = useState("activas");
    const visibles = filtrarSolicitudes(servicios, filtro);

    return (
        <>
            <EncabezadoPagina titulo="Mis servicios" descripcion="Servicios asignados a ti. Abre uno para avanzar su estado." />

            <Aviso texto={error} tipo="error" />

            {cargando && <p className="text-slate-400">Cargando servicios...</p>}

            {!cargando && !error && servicios.length === 0 && (
                <EstadoVacio icono={BriefcaseBusiness} titulo="Todavía no tienes servicios asignados" descripcion="Toma una solicitud pendiente para empezar a trabajar.">
                    <Link to="/tecnico/pendientes" className="boton-primario">Ver solicitudes pendientes</Link>
                </EstadoVacio>
            )}

            {servicios.length > 0 && (
                <>
                    <FiltroSolicitudes solicitudes={servicios} filtro={filtro} alCambiar={setFiltro} />

                    {visibles.length === 0 ? (
                        <p className="py-8 text-center text-slate-400">No hay servicios en esta categoría.</p>
                    ) : (
                        <ul className="space-y-3">
                            {visibles.map((servicio) => (
                                <FilaSolicitud key={servicio.id} solicitud={servicio} rutaBase="/tecnico/servicios" />
                            ))}
                        </ul>
                    )}
                </>
            )}
        </>
    );
};

export default MisServicios;
