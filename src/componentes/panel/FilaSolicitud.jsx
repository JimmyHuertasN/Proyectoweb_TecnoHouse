import { Link } from "react-router-dom";
import { buscarOpcion, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { formatearFecha } from "../../utilidades/formato.js";
import { EtiquetaEstado, EtiquetaGravedad } from "./Etiquetas.jsx";

/* Una solicitud dentro de una lista; toda la fila lleva al detalle. */
const FilaSolicitud = ({ solicitud }) => {
    const { dispositivo } = solicitud;
    const tipo = buscarOpcion(TIPOS_DISPOSITIVO, dispositivo.tipo);

    return (
        <li>
            <Link
                to={`/cliente/solicitudes/${solicitud.id}`}
                className="flex flex-col gap-3 rounded-lg border border-borde bg-fondo/60 p-4 transition hover:border-marca/60 sm:flex-row sm:items-center"
            >
                <span className="hidden text-2xl sm:block" aria-hidden="true">{tipo.icono}</span>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-marca">{solicitud.codigo}</p>
                    <p className="truncate font-medium">
                        {dispositivo.marca} {dispositivo.modelo}
                    </p>
                    <p className="truncate text-sm text-slate-400">{solicitud.descripcion}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                    <EtiquetaEstado estado={solicitud.estado} />
                    <EtiquetaGravedad gravedad={solicitud.gravedad} />
                    <span className="text-xs text-slate-500">{formatearFecha(solicitud.creadaEn)}</span>
                </div>
            </Link>
        </li>
    );
};

export default FilaSolicitud;
