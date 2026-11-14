import { useState } from "react";
import { AVANCES_TECNICO, buscarOpcion, ESTADOS_SOLICITUD } from "../../../datos/opciones.js";
import Aviso from "../../Aviso.jsx";
import useConfirmar from "../../../hooks/useConfirmar.js";

/* Qué decirle al técnico cuando el siguiente paso no depende de un botón. */
const ESPERAS = {
    en_diagnostico: "Registra el diagnóstico y luego envía la cotización al cliente.",
    cotizado: "Esperando que el cliente apruebe o rechace la cotización.",
    finalizado: "Servicio terminado. Esperando la calificación del cliente.",
    calificado: "Servicio terminado y calificado por el cliente.",
};

/* "alAvanzar" la recibe del padre, que llama a la API. Si falla, el error se muestra en la tarjeta. */
const ProximoPaso = ({ estado, alAvanzar }) => {
    const [error, setError] = useState("");
    const [avanzando, setAvanzando] = useState(false);
    const avance = AVANCES_TECNICO[estado];
    const confirmar = useConfirmar();

    const avanzar = async () => {
        const destino = buscarOpcion(ESTADOS_SOLICITUD, avance.siguiente).etiqueta;
        if (!await confirmar({ titulo: "Actualizar estado", mensaje: `¿Pasar el servicio a "${destino}"? El cliente recibirá una notificación.` })) return;

        setError("");
        setAvanzando(true);

        try {
            await alAvanzar(destino);
        } catch (errorApi) {
            setError(errorApi.message);
        } finally {
            setAvanzando(false);
        }
    };

    return (
        <section className="mb-6 rounded-2xl border border-marca/40 bg-marca/5 p-5 sm:p-6">
            <Aviso texto={error} tipo="error" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xs font-medium tracking-wide text-sky-300 uppercase">Próximo paso</h2>
                    <p className="mt-1 text-white">{avance ? "Cuando termines esta etapa, actualiza el estado del servicio." : ESPERAS[estado]}</p>
                </div>
                {avance && (
                    <button type="button" onClick={avanzar} disabled={avanzando} className="boton-primario shrink-0">
                        {avanzando ? "Guardando..." : avance.accion}
                    </button>
                )}
            </div>
        </section>
    );
};

export default ProximoPaso;
