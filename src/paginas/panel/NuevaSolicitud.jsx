import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { estaActiva, LONGITUD_MINIMA_DESCRIPCION } from "../../api/solicitudes.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import { buscarOpcion, GRAVEDADES, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { useDispositivos } from "../../hooks/useDispositivos.js";
import { useSolicitudes } from "../../hooks/useSolicitudes.js";

const LONGITUD_MAXIMA_DESCRIPCION = 500;

/* Clases de las opciones tipo "tarjeta" (radio oculto + label que se resalta al marcarse). */
const CLASES_OPCION =
    "flex cursor-pointer items-center gap-3 rounded-lg border border-slate-600 p-4 transition hover:border-slate-400 has-checked:border-marca has-checked:bg-marca/10 has-focus-visible:ring-2 has-focus-visible:ring-marca has-disabled:cursor-not-allowed has-disabled:opacity-50 has-disabled:hover:border-slate-600";

const NuevaSolicitud = () => {
    const { dispositivos, cargando: cargandoDispositivos } = useDispositivos();
    const { solicitudes, cargando: cargandoSolicitudes, crearSolicitud } = useSolicitudes();
    const [parametros] = useSearchParams();
    const navegar = useNavigate();

    // Si se llega desde "Solicitar reparación" en una tarjeta, el equipo viene preseleccionado (?dispositivo=id).
    const [dispositivoId, setDispositivoId] = useState(parametros.get("dispositivo") ?? "");
    const [gravedad, setGravedad] = useState("media");
    const [descripcion, setDescripcion] = useState("");
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);

    // Equipos que ya están en el taller: no se pueden volver a elegir.
    const ocupados = new Set(solicitudes.filter(estaActiva).map((solicitud) => solicitud.dispositivoId));
    const seleccionado = ocupados.has(dispositivoId) ? "" : dispositivoId;

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        if (!seleccionado) {
            setError("Elige el dispositivo que necesita servicio.");
            return;
        }

        if (descripcion.trim().length < LONGITUD_MINIMA_DESCRIPCION) {
            setError(`Describe la falla con al menos ${LONGITUD_MINIMA_DESCRIPCION} caracteres.`);
            return;
        }

        setError("");
        setEnviando(true);

        try {
            const nueva = await crearSolicitud({ dispositivoId: seleccionado, gravedad, descripcion });
            navegar(`/cliente/solicitudes/${nueva.id}`, { state: { recienCreada: true } });
        } catch (errorApi) {
            setError(errorApi.message);
            setEnviando(false);
        }
    };

    if (cargandoDispositivos || cargandoSolicitudes) {
        return <p className="text-slate-400">Cargando...</p>;
    }

    if (dispositivos.length === 0) {
        return (
            <div className="mx-auto max-w-3xl">
                <EncabezadoPagina titulo="Solicitar reparación" />
                <EstadoVacio
                    icono="💻"
                    titulo="Primero registra un dispositivo"
                    descripcion="Para crear una solicitud necesitamos saber qué equipo vas a traer."
                >
                    <Link to="/cliente/dispositivos" className="boton-primario">Ir a Mis dispositivos</Link>
                </EstadoVacio>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl">
            <EncabezadoPagina titulo="Solicitar reparación" descripcion="Cuéntanos qué equipo falla y qué le pasa. Un técnico revisará tu caso." />

            <form onSubmit={manejarEnvio} noValidate className="tarjeta space-y-8">
                <Aviso texto={error} tipo="error" />

                {/* 1. DISPOSITIVO */}
                <fieldset>
                    <legend className="etiqueta">1. ¿Qué dispositivo necesita servicio?</legend>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {dispositivos.map((dispositivo) => {
                            const ocupado = ocupados.has(dispositivo.id);
                            return (
                                <label key={dispositivo.id} className={CLASES_OPCION}>
                                    <input
                                        type="radio"
                                        name="dispositivo"
                                        value={dispositivo.id}
                                        checked={seleccionado === dispositivo.id}
                                        onChange={(evento) => setDispositivoId(evento.target.value)}
                                        disabled={ocupado}
                                        className="sr-only"
                                    />
                                    <span className="text-2xl" aria-hidden="true">{buscarOpcion(TIPOS_DISPOSITIVO, dispositivo.tipo).icono}</span>
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">{dispositivo.marca} {dispositivo.modelo}</span>
                                        <span className="block text-xs text-slate-400">
                                            {ocupado ? "Ya tiene una solicitud en curso" : dispositivo.numeroSerie || "Sin número de serie"}
                                        </span>
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                        ¿No está en la lista? <Link to="/cliente/dispositivos" className="font-semibold text-marca hover:underline">Regístralo aquí</Link>.
                    </p>
                </fieldset>

                {/* 2. GRAVEDAD */}
                <fieldset>
                    <legend className="etiqueta">2. ¿Qué tan grave es la falla?</legend>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {GRAVEDADES.map((opcion) => (
                            <label key={opcion.valor} className={`${CLASES_OPCION} flex-col items-start gap-1`}>
                                <input
                                    type="radio"
                                    name="gravedad"
                                    value={opcion.valor}
                                    checked={gravedad === opcion.valor}
                                    onChange={(evento) => setGravedad(evento.target.value)}
                                    className="sr-only"
                                />
                                <span className="font-semibold">{opcion.etiqueta}</span>
                                <span className="text-xs text-slate-400">{opcion.descripcion}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                {/* 3. DESCRIPCIÓN */}
                <div>
                    <label htmlFor="descripcion" className="etiqueta">3. Describe la falla</label>
                    <textarea
                        id="descripcion"
                        rows={5}
                        maxLength={LONGITUD_MAXIMA_DESCRIPCION}
                        className="campo resize-y"
                        placeholder="Ej. La pantalla parpadea al encenderlo y a los pocos minutos se apaga solo."
                        value={descripcion}
                        onChange={(evento) => setDescripcion(evento.target.value)}
                    />
                    <p className="mt-1 text-right text-xs text-slate-500">
                        {descripcion.length}/{LONGITUD_MAXIMA_DESCRIPCION}
                    </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-borde pt-6 sm:flex-row sm:justify-end">
                    <Link to="/cliente/solicitudes" className="boton-secundario">Cancelar</Link>
                    <button type="submit" disabled={enviando} className="boton-primario">
                        {enviando ? "Enviando..." : "Crear solicitud"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NuevaSolicitud;
