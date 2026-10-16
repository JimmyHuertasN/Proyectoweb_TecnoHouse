import { useState } from "react";
import { buscarOpcion, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { formatearFecha } from "../../utilidades/formato.js";
import Aviso from "../Aviso.jsx";
import { EtiquetaGravedad } from "./Etiquetas.jsx";

/* "alTomar" la recibe del padre, que llama a la API. Si falla, el error se muestra en la tarjeta. */
const TarjetaPendiente = ({ solicitud, alTomar }) => {
    const [error, setError] = useState("");
    const [tomando, setTomando] = useState(false);
    const { dispositivo } = solicitud;
    const tipo = buscarOpcion(TIPOS_DISPOSITIVO, dispositivo.tipo);

    const tomar = async () => {
        if (!window.confirm(`¿Tomar el servicio ${solicitud.codigo}? Quedará asignado a ti.`)) return;

        setError("");
        setTomando(true);

        try {
            await alTomar(solicitud);
        } catch (errorApi) {
            setError(errorApi.message);
            setTomando(false);
        }
    };

    return (
        <article className="tarjeta flex flex-col">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="text-2xl" aria-hidden="true">{tipo.icono}</span>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-marca">{solicitud.codigo}</p>
                        <h2 className="truncate font-semibold">
                            {dispositivo.marca} {dispositivo.modelo}
                        </h2>
                        <p className="text-xs text-slate-400">{tipo.etiqueta}</p>
                    </div>
                </div>
                <EtiquetaGravedad gravedad={solicitud.gravedad} />
            </div>

            <Aviso texto={error} tipo="error" />

            <p className="flex-1 text-sm leading-relaxed whitespace-pre-line text-slate-300">{solicitud.descripcion}</p>

            <dl className="mt-4 space-y-1 text-sm">
                <div className="flex gap-2">
                    <dt className="text-slate-400">Cliente:</dt>
                    <dd className="truncate">{solicitud.nombreCliente}</dd>
                </div>
                <div className="flex gap-2">
                    <dt className="text-slate-400">Solicitada:</dt>
                    <dd>{formatearFecha(solicitud.creadaEn)}</dd>
                </div>
            </dl>

            <button type="button" onClick={tomar} disabled={tomando} className="boton-primario mt-5 w-full">
                {tomando ? "Tomando..." : "Tomar servicio"}
            </button>
        </article>
    );
};

export default TarjetaPendiente;
