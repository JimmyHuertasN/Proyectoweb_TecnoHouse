import { BriefcaseBusiness } from "lucide-react";
import { Link } from "react-router-dom";
import Aviso from "../../componentes/Aviso.jsx";
import BarraFiltros from "../../componentes/panel/BarraFiltros.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FilaSolicitud from "../../componentes/panel/FilaSolicitud.jsx";
import ResultadosPaginados from "../../componentes/panel/ResultadosPaginados.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import { useFiltroPaginado } from "../../hooks/useFiltroPaginado.js";
import { useServiciosAsignados } from "../../hooks/useServiciosAsignados.js";
import { cumpleFiltrosSolicitud, FILTROS_SOLICITUD_VACIOS, opcionesEstadoSolicitud } from "../../utilidades/filtros.js";

// Abre mostrando solo los servicios en curso, como antes.
const FILTROS_INICIALES = { ...FILTROS_SOLICITUD_VACIOS, estado: "activas" };

const MisServicios = () => {
    const { servicios, cargando, error } = useServiciosAsignados();
    const paginado = useFiltroPaginado(servicios, cumpleFiltrosSolicitud, FILTROS_SOLICITUD_VACIOS, 10, FILTROS_INICIALES);

    return (
        <>
            <EncabezadoPagina titulo="Mis servicios" descripcion="Servicios asignados a ti. Abre uno para avanzar su estado." />

            <Aviso texto={error} tipo="error" />

            {cargando && <Skeleton tipo="fila" cantidad={4} etiqueta="Cargando servicios" />}

            {!cargando && !error && servicios.length === 0 && (
                <EstadoVacio icono={BriefcaseBusiness} titulo="Todavía no tienes servicios asignados" descripcion="Toma una solicitud pendiente para empezar a trabajar.">
                    <Link to="/tecnico/pendientes" className="boton-primario">Ver solicitudes pendientes</Link>
                </EstadoVacio>
            )}

            {servicios.length > 0 && (
                <>
                    <BarraFiltros
                        id="mis-servicios"
                        etiqueta="Filtrar mis servicios"
                        placeholder="Código, cliente, equipo o problema"
                        paginado={paginado}
                        opcionesEstado={opcionesEstadoSolicitud(servicios)}
                        conFechas
                    />

                    <ResultadosPaginados id="mis-servicios" paginado={paginado}>
                        <ul className="space-y-3">
                            {paginado.elementos.map((servicio) => (
                                <FilaSolicitud key={servicio.id} solicitud={servicio} rutaBase="/tecnico/servicios" />
                            ))}
                        </ul>
                    </ResultadosPaginados>
                </>
            )}
        </>
    );
};

export default MisServicios;
