import { Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import Aviso from "../../componentes/Aviso.jsx";
import BarraFiltros from "../../componentes/panel/BarraFiltros.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FilaSolicitud from "../../componentes/panel/FilaSolicitud.jsx";
import ResultadosPaginados from "../../componentes/panel/ResultadosPaginados.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import { useFiltroPaginado } from "../../hooks/useFiltroPaginado.js";
import { useSolicitudes } from "../../hooks/useSolicitudes.js";
import { cumpleFiltrosSolicitud, FILTROS_SOLICITUD_VACIOS, opcionesEstadoSolicitud } from "../../utilidades/filtros.js";

const MisSolicitudes = () => {
    const { solicitudes, cargando, error } = useSolicitudes();
    const paginado = useFiltroPaginado(solicitudes, cumpleFiltrosSolicitud, FILTROS_SOLICITUD_VACIOS);

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
                    <BarraFiltros
                        id="solicitudes"
                        etiqueta="Filtrar solicitudes"
                        placeholder="Código, equipo o problema"
                        paginado={paginado}
                        opcionesEstado={opcionesEstadoSolicitud(solicitudes)}
                        conFechas
                    />

                    <ResultadosPaginados id="solicitudes" paginado={paginado}>
                        <ul className="space-y-3">
                            {paginado.elementos.map((solicitud) => (
                                <FilaSolicitud key={solicitud.id} solicitud={solicitud} />
                            ))}
                        </ul>
                    </ResultadosPaginados>
                </>
            )}
        </>
    );
};

export default MisSolicitudes;
