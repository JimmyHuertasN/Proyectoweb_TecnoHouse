import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { listarServicios } from "../../api/admin.js";
import Aviso from "../../componentes/Aviso.jsx";
import BarraFiltros from "../../componentes/panel/BarraFiltros.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FilaSolicitud from "../../componentes/panel/FilaSolicitud.jsx";
import ResultadosPaginados from "../../componentes/panel/ResultadosPaginados.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import { useFiltroPaginado } from "../../hooks/useFiltroPaginado.js";
import { cumpleFiltrosSolicitud, FILTROS_SOLICITUD_VACIOS, opcionesEstadoSolicitud } from "../../utilidades/filtros.js";

// Abre mostrando solo los servicios en curso, como antes.
const FILTROS_INICIALES = { ...FILTROS_SOLICITUD_VACIOS, estado: "activas" };

const describirPersonas = (servicio) =>
    `Cliente: ${servicio.cliente.nombre} · ${servicio.tecnico ? `Técnico: ${servicio.tecnico.nombre}` : "Sin técnico"}`;

const TodosLosServicios = () => {
    const [servicios, setServicios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const paginado = useFiltroPaginado(servicios, cumpleFiltrosSolicitud, FILTROS_SOLICITUD_VACIOS, 10, FILTROS_INICIALES);

    useEffect(() => {
        let vigente = true;

        listarServicios()
            .then((lista) => vigente && setServicios(lista))
            .catch(() => vigente && setError("No se pudieron cargar los servicios."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, []);

    return (
        <>
            <EncabezadoPagina titulo="Servicios" descripcion="Todos los servicios del taller. Abre uno para ver el detalle o cambiar el técnico." />

            <Aviso texto={error} tipo="error" />

            {cargando && <Skeleton tipo="fila" cantidad={4} etiqueta="Cargando servicios" />}

            {!cargando && !error && servicios.length === 0 && (
                <EstadoVacio icono={Wrench} titulo="Todavía no hay servicios" descripcion="Aparecerán aquí cuando los clientes los soliciten." />
            )}

            {servicios.length > 0 && (
                <>
                    <BarraFiltros
                        id="servicios"
                        etiqueta="Filtrar servicios"
                        placeholder="Código, cliente, técnico, equipo o problema"
                        paginado={paginado}
                        opcionesEstado={opcionesEstadoSolicitud(servicios)}
                        conFechas
                    />

                    <ResultadosPaginados id="servicios" paginado={paginado}>
                        <ul className="space-y-3">
                            {paginado.elementos.map((servicio) => (
                                <FilaSolicitud
                                    key={servicio.id}
                                    solicitud={servicio}
                                    rutaBase="/admin/servicios"
                                    subtitulo={describirPersonas(servicio)}
                                />
                            ))}
                        </ul>
                    </ResultadosPaginados>
                </>
            )}
        </>
    );
};

export default TodosLosServicios;
