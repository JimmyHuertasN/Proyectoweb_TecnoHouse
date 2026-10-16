import { useState } from "react";
import { AVANCES_TECNICO, buscarOpcion, ESTADOS_SOLICITUD } from "../../datos/opciones.js";
import Aviso from "../Aviso.jsx";

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

    const avanzar = async () => {
        const destino = buscarOpcion(ESTADOS_SOLICITUD, avance.siguiente).etiqueta;
        if (!window.confirm(`¿Pasar el servicio a "${destino}"? El cliente recibirá una notificación.`)) return;

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
        <section className="tarjeta mb-6">
            <h2 className="mb-3 text-lg font-semibold">Próximo paso</h2>
            <Aviso texto={error} tipo="error" />

            {avance ? (
                <button type="button" onClick={avanzar} disabled={avanzando} className="boton-primario">
                    {avanzando ? "Guardando..." : avance.accion}
                </button>
            ) : (
                <p className="text-sm text-slate-300">{ESPERAS[estado]}</p>
            )}
        </section>
    );
};

export default ProximoPaso;
