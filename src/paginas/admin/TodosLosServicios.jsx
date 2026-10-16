import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { listarServicios } from "../../api/admin.js";
import { filtrarSolicitudes } from "../../api/solicitudes.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FilaSolicitud from "../../componentes/panel/FilaSolicitud.jsx";
import FiltroSolicitudes from "../../componentes/panel/FiltroSolicitudes.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";

const describirPersonas = (servicio) =>
    `Cliente: ${servicio.cliente.nombre} · ${servicio.tecnico ? `Técnico: ${servicio.tecnico.nombre}` : "Sin técnico"}`;

const TodosLosServicios = () => {
    const [servicios, setServicios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [filtro, setFiltro] = useState("activas");
    const visibles = filtrarSolicitudes(servicios, filtro);

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
                    <FiltroSolicitudes solicitudes={servicios} filtro={filtro} alCambiar={setFiltro} />

                    {visibles.length === 0 ? (
                        <p className="py-8 text-center text-slate-400">No hay servicios en esta categoría.</p>
                    ) : (
                        <ul className="space-y-3">
                            {visibles.map((servicio) => (
                                <FilaSolicitud
                                    key={servicio.id}
                                    solicitud={servicio}
                                    rutaBase="/admin/servicios"
                                    subtitulo={describirPersonas(servicio)}
                                />
                            ))}
                        </ul>
                    )}
                </>
            )}
        </>
    );
};

export default TodosLosServicios;
