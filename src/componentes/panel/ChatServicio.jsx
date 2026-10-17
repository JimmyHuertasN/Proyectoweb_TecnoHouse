import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { enviarMensaje, listarMensajes, LONGITUD_MAXIMA_MENSAJE, suscribirMensajes } from "../../api/mensajes.js";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { formatearFechaHora } from "../../utilidades/formato.js";

/* Conversación del servicio; el modo de solo lectura se usa en el panel admin. */
const ChatServicio = ({ servicioId, soloLectura = false }) => {
    const { usuario } = useSesion();
    const [mensajes, setMensajes] = useState([]);
    const [texto, setTexto] = useState("");
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState("");

    // Recarga los mensajes cuando llega un cambio por Realtime o después de enviar.
    const cargarMensajes = useCallback(async () => {
        try {
            const lista = await listarMensajes(servicioId);
            setMensajes(lista);
            setError("");
        } catch (errorApi) {
            setError(errorApi.message);
        } finally {
            setCargando(false);
        }
    }, [servicioId]);

    // Carga el historial y escucha mensajes nuevos mientras el componente esté abierto.
    useEffect(() => {
        let vigente = true;
        const actualizar = async () => {
            try {
                const lista = await listarMensajes(servicioId);
                if (vigente) {
                    setMensajes(lista);
                    setError("");
                }
            } catch (errorApi) {
                if (vigente) setError(errorApi.message);
            } finally {
                if (vigente) setCargando(false);
            }
        };

        setCargando(true);
        actualizar();
        const cancelar = suscribirMensajes(servicioId, cargarMensajes);
        return () => {
            vigente = false;
            cancelar();
        };
    }, [servicioId, cargarMensajes]);

    // Valida y envía el texto; Enter envía el formulario.
    const manejarEnvio = async (evento) => {
        evento.preventDefault();
        if (!texto.trim() || enviando || soloLectura) return;

        setEnviando(true);
        setError("");
        try {
            await enviarMensaje(servicioId, usuario.id, texto);
            setTexto("");
            await cargarMensajes();
        } catch (errorApi) {
            setError(errorApi.message);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <section className="tarjeta mt-6" aria-label="Conversación del servicio">
            <div className="mb-4 flex items-center gap-2">
                <MessageCircle size={20} className="text-marca" aria-hidden="true" />
                <h2 className="text-lg font-semibold">Conversación</h2>
                {soloLectura && <span className="ml-auto text-xs text-slate-400">Solo lectura</span>}
            </div>

            {/* Distingue los mensajes propios y ajenos con alineación y color. */}
            <div className="max-h-96 min-h-32 space-y-3 overflow-y-auto rounded-lg border border-borde bg-fondo p-3" aria-live="polite">
                {cargando ? (
                    <p className="text-sm text-slate-400">Cargando mensajes...</p>
                ) : mensajes.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">Aún no hay mensajes en esta conversación.</p>
                ) : mensajes.map((mensaje) => {
                    const propio = mensaje.autorId === usuario.id;
                    return (
                        <article key={mensaje.id} className={`flex ${propio ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 ${propio ? "bg-marca/20 text-white" : "bg-tarjeta text-slate-200"}`}>
                                <p className="mb-1 text-xs font-semibold text-marca">{propio ? "Tú" : mensaje.autor}</p>
                                <p className="whitespace-pre-wrap break-words text-sm">{mensaje.texto}</p>
                                <time className="mt-1 block text-right text-[11px] text-slate-400" dateTime={mensaje.creadoEn}>
                                    {formatearFechaHora(mensaje.creadoEn)}
                                </time>
                            </div>
                        </article>
                    );
                })}
            </div>

            {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}

            {/* El administrador consulta la conversación sin el campo de envío. */}
            {!soloLectura && (
                <form onSubmit={manejarEnvio} className="mt-4">
                    <label htmlFor={`mensaje-${servicioId}`} className="etiqueta">Escribe un mensaje</label>
                    <div className="flex items-start gap-2">
                        <textarea
                            id={`mensaje-${servicioId}`}
                            className="campo min-h-11 resize-y"
                            rows={2}
                            value={texto}
                            maxLength={LONGITUD_MAXIMA_MENSAJE}
                            onChange={(evento) => setTexto(evento.target.value)}
                            placeholder="Escribe aquí..."
                            aria-describedby={`contador-mensaje-${servicioId}`}
                        />
                        <button type="submit" className="boton-primario min-h-11 px-3" disabled={enviando || !texto.trim()} aria-label="Enviar mensaje">
                            <Send size={18} aria-hidden="true" />
                        </button>
                    </div>
                    <p id={`contador-mensaje-${servicioId}`} className="mt-1 text-right text-xs text-slate-500">{texto.length}/{LONGITUD_MAXIMA_MENSAJE}</p>
                </form>
            )}
        </section>
    );
};

export default ChatServicio;
