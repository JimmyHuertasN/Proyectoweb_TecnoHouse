import { CircleCheck } from "lucide-react";
import Aviso from "../../componentes/Aviso.jsx";
import BarraFiltros from "../../componentes/panel/BarraFiltros.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import ResultadosPaginados from "../../componentes/panel/ResultadosPaginados.jsx";
import TarjetaPendiente from "../../componentes/panel/TarjetaPendiente.jsx";
import { useFiltroPaginado } from "../../hooks/useFiltroPaginado.js";
import { usePendientes } from "../../hooks/usePendientes.js";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import useToast from "../../hooks/useToast.js";
import { cumpleFiltrosSolicitud } from "../../utilidades/filtros.js";

// Todas las pendientes están en "solicitado": no hace falta filtrar por estado.
const FILTROS_VACIOS = { texto: "", desde: "", hasta: "" };

const SolicitudesPendientes = () => {
    const { pendientes, cargando, error, recargar, tomarServicio } = usePendientes();
    const toast = useToast();
    const paginado = useFiltroPaginado(pendientes, cumpleFiltrosSolicitud, FILTROS_VACIOS);

    const manejarToma = async (solicitud) => {
        await tomarServicio(solicitud.id);
        toast.exito(`Tomaste el servicio ${solicitud.codigo}. Lo encuentras en "Mis servicios".`);
    };

    const actualizar = () => {
        recargar();
    };

    return (
        <>
            <EncabezadoPagina titulo="Solicitudes pendientes" descripcion="Servicios que todavía no tienen técnico. Toma los que puedas atender.">
                <button type="button" onClick={actualizar} className="boton-secundario">
                    ↻ Actualizar
                </button>
            </EncabezadoPagina>

            <Aviso texto={error} tipo="error" />

            {cargando && <Skeleton tipo="tarjeta" cantidad={3} etiqueta="Cargando solicitudes" />}

            {!cargando && !error && pendientes.length === 0 && (
                <EstadoVacio
                    icono={CircleCheck}
                    titulo="No hay solicitudes pendientes"
                    descripcion="Cuando un cliente pida un servicio, aparecerá aquí. Usa “Actualizar” para revisar de nuevo."
                />
            )}

            {pendientes.length > 0 && (
                <>
                    <BarraFiltros
                        id="pendientes"
                        etiqueta="Filtrar solicitudes pendientes"
                        placeholder="Código, cliente, equipo o problema"
                        paginado={paginado}
                        conFechas
                    />

                    <ResultadosPaginados id="pendientes" paginado={paginado}>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {paginado.elementos.map((solicitud) => (
                                <TarjetaPendiente key={solicitud.id} solicitud={solicitud} alTomar={manejarToma} />
                            ))}
                        </div>
                    </ResultadosPaginados>
                </>
            )}
        </>
    );
};

export default SolicitudesPendientes;
