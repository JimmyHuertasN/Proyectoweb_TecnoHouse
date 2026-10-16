import { Link } from "react-router-dom";
import { buscarOpcion, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { formatearFecha } from "../../utilidades/formato.js";
import { EtiquetaEstado, EtiquetaGravedad } from "./Etiquetas.jsx";

/*
    Una solicitud dentro de una lista; toda la fila lleva al detalle. "rutaBase" cambia según
    el panel, y "subtitulo" reemplaza la descripción de la falla (el admin muestra cliente y técnico).
*/
const FilaSolicitud = ({ solicitud, rutaBase = "/cliente/solicitudes", subtitulo = solicitud.descripcion }) => {
    const { dispositivo } = solicitud;
    const tipo = buscarOpcion(TIPOS_DISPOSITIVO, dispositivo.tipo);
    const Icono = tipo.icono;

    return (
        <li>
            <Link
                to={`${rutaBase}/${solicitud.id}`}
                className="flex flex-col gap-3 rounded-lg border border-borde bg-fondo/60 p-4 transition hover:border-marca/60 sm:flex-row sm:items-center"
            >
                <Icono className="hidden size-6 text-marca sm:block" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-marca">{solicitud.codigo}</p>
                    <p className="truncate font-medium">
                        {dispositivo.marca} {dispositivo.modelo}
                    </p>
                    <p className="truncate text-sm text-slate-400">{subtitulo}</p>
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
