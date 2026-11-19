import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import useNotificaciones from "../../hooks/useNotificaciones.js";
import { formatearFechaHora } from "../../utilidades/formato.js";

/* Campana y menú con avisos recientes del usuario conectado. */
const CampanaNotificaciones = ({ enMenuLateral = false }) => {
    // Controla la apertura del menú y los errores de las acciones de lectura.
    const [abiertas, setAbiertas] = useState(false);
    const [errorAccion, setErrorAccion] = useState("");
    const { notificaciones, noLeidas, cargando, error, marcarUna, marcarTodas } = useNotificaciones();

    // Marca el aviso como leído y cierra el desplegable antes de navegar.
    const marcarAlAbrirEnlace = (notificacion) => {
        setAbiertas(false);
        if (!notificacion.leida) {
            marcarUna(notificacion.id).catch((errorApi) => setErrorAccion(errorApi.message));
        }
    };

    // Marca en lote los avisos pendientes desde el encabezado del menú.
    const manejarMarcarTodas = async () => {
        setErrorAccion("");
        try {
            await marcarTodas();
        } catch (errorApi) {
            setErrorAccion(errorApi.message);
        }
    };

    return (
        <div className="relative">
            {/* La campana muestra el total de avisos pendientes. */}
            <button
                type="button"
                onClick={() => setAbiertas((anterior) => !anterior)}
                className="relative flex size-11 cursor-pointer items-center justify-center rounded-xl border border-slate-700/80 bg-gradient-to-b from-white/[0.07] to-white/[0.02] text-slate-300 shadow-sm shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:text-white hover:shadow-md hover:shadow-black/30 active:translate-y-0 active:scale-[0.97]"
                aria-label={noLeidas ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
                aria-expanded={abiertas}
                aria-controls="menu-notificaciones"
            >
                <Bell size={19} aria-hidden="true" />
                {noLeidas > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full border-2 border-superficie bg-gradient-to-b from-rose-400 to-red-600 px-1 text-[10px] font-bold leading-4 text-white shadow-md shadow-red-950/40">
                        {noLeidas > 99 ? "99+" : noLeidas}
                    </span>
                )}
            </button>

            {/* Lista los avisos recientes con enlace al detalle del servicio. */}
            {abiertas && (
                <section
                    id="menu-notificaciones"
                    className={`notificacion-entrada absolute top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-borde/90 bg-tarjeta/95 shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-xl ${
                        enMenuLateral ? "left-0 right-auto" : "right-0 left-auto"
                    }`}
                    aria-label="Notificaciones recientes"
                >
                    <div className="flex items-center justify-between border-b border-borde bg-white/[0.025] px-4 py-3.5">
                        <h2 className="font-semibold tracking-tight">Notificaciones</h2>
                        <button
                            type="button"
                            onClick={manejarMarcarTodas}
                            disabled={noLeidas === 0}
                            className="flex cursor-pointer items-center gap-1 text-xs text-marca hover:underline disabled:cursor-not-allowed disabled:text-slate-500"
                        >
                            <CheckCheck size={15} aria-hidden="true" /> Marcar todas como leídas
                        </button>
                    </div>

                    {(error || errorAccion) && <p role="alert" className="px-4 pt-3 text-xs text-red-300">{errorAccion || error}</p>}
                    <div className="max-h-[min(70vh,28rem)] overflow-y-auto">
                        {cargando ? (
                            <p className="px-4 py-6 text-sm text-slate-400">Cargando notificaciones...</p>
                        ) : notificaciones.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-slate-400">No tienes notificaciones.</p>
                        ) : notificaciones.map((notificacion) => (
                            <Link
                                key={notificacion.id}
                                to={notificacion.enlace || "/"}
                                onClick={() => marcarAlAbrirEnlace(notificacion)}
                                className={`block border-b border-borde/70 px-4 py-3 transition duration-200 hover:translate-x-0.5 hover:bg-white/[0.06] ${notificacion.leida ? "" : "border-l-2 border-l-marca bg-marca/[0.06] pl-[14px]"}`}
                            >
                                <div className="flex items-start gap-2">
                                    {!notificacion.leida && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-marca" aria-label="Sin leer" />}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-white">{notificacion.titulo}</p>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-300">{notificacion.detalle}</p>
                                        <time className="mt-1 block text-[11px] text-slate-500" dateTime={notificacion.creadaEn}>
                                            {formatearFechaHora(notificacion.creadaEn)}
                                        </time>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default CampanaNotificaciones;
