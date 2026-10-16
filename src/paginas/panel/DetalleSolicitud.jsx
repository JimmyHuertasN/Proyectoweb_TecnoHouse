import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { listarCotizaciones, obtenerHistorial, obtenerSolicitud, responderCotizacion } from "../../api/solicitudes.js";
import Aviso from "../../componentes/Aviso.jsx";
import { EtiquetaEstado, EtiquetaGravedad } from "../../componentes/panel/Etiquetas.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import TarjetaCotizacion from "../../componentes/panel/TarjetaCotizacion.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { buscarOpcion, ESTADOS_SOLICITUD, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { formatearFecha, formatearFechaHora } from "../../utilidades/formato.js";

/* Pasos de la barra de progreso: "calificado" ocurre después de finalizar, así que no es un paso aparte. */
const PASOS = ESTADOS_SOLICITUD.filter((estado) => estado.valor !== "calificado");

const BarraProgreso = ({ estado }) => {
    const pasoActual = estado === "calificado" ? PASOS.length - 1 : PASOS.findIndex((paso) => paso.valor === estado);

    return (
        <>
            <ol className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Progreso de la reparación">
                {PASOS.map((paso, indice) => {
                    const completado = indice <= pasoActual;
                    return (
                        <li key={paso.valor} aria-current={indice === pasoActual ? "step" : undefined}>
                            <div className={`h-1.5 rounded-full ${completado ? "bg-marca" : "bg-slate-700"}`} />
                            {/* En celulares no caben los 7 nombres: se muestra solo el paso actual debajo. */}
                            <p className={`mt-2 hidden text-xs md:block ${indice === pasoActual ? "font-semibold text-marca" : completado ? "text-slate-300" : "text-slate-500"}`}>
                                {paso.etiqueta}
                            </p>
                        </li>
                    );
                })}
            </ol>
            <p className="mt-3 text-sm text-slate-300 md:hidden">
                Paso {pasoActual + 1} de {PASOS.length}: <span className="font-semibold text-marca">{PASOS[pasoActual]?.etiqueta}</span>
            </p>
        </>
    );
};

const DetalleSolicitud = () => {
    const { id } = useParams();
    const { usuario } = useSesion();
    const ubicacion = useLocation();
    const [solicitud, setSolicitud] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [cotizaciones, setCotizaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [aviso, setAviso] = useState("");
    // Cada vez que aumenta, el useEffect vuelve a pedir los datos a Supabase.
    const [recargas, setRecargas] = useState(0);
    const recienCreada = ubicacion.state?.recienCreada;

    useEffect(() => {
        let vigente = true;

        const cargar = async () => {
            try {
                const encontrada = await obtenerSolicitud(usuario.id, id);
                const [eventos, listaCotizaciones] = await Promise.all([
                    obtenerHistorial(encontrada),
                    listarCotizaciones(encontrada.id),
                ]);
                if (vigente) {
                    setSolicitud(encontrada);
                    setHistorial(eventos);
                    setCotizaciones(listaCotizaciones);
                }
            } catch (errorApi) {
                if (vigente) setError(errorApi.message);
            } finally {
                if (vigente) setCargando(false);
            }
        };

        cargar();
        return () => {
            vigente = false;
        };
    }, [usuario.id, id, recargas]);

    // Se recarga todo porque responder la cotización también cambia el estado del servicio.
    const manejarRespuestaCotizacion = async (cotizacion, aprobar) => {
        await responderCotizacion(cotizacion.id, aprobar);
        setAviso(aprobar ? "Aprobaste la cotización. El técnico empezará la reparación." : "Rechazaste la cotización.");
        setRecargas((anterior) => anterior + 1);
    };

    if (cargando) {
        return <p className="text-slate-400">Cargando solicitud...</p>;
    }

    if (error) {
        return (
            <EstadoVacio icono="🔍" titulo={error} descripcion="Vuelve a tu lista de solicitudes y elige una.">
                <Link to="/cliente/solicitudes" className="boton-primario">Ver mis solicitudes</Link>
            </EstadoVacio>
        );
    }

    const { dispositivo } = solicitud;
    const tipo = buscarOpcion(TIPOS_DISPOSITIVO, dispositivo.tipo);

    return (
        <>
            <Link to="/cliente/solicitudes" className="mb-6 inline-block text-sm text-slate-400 hover:text-marca">
                ← Volver a solicitudes
            </Link>

            {recienCreada && (
                <Aviso texto={`¡Listo! Registramos tu solicitud ${solicitud.codigo}. Te contactaremos cuando un técnico la revise.`} tipo="exito" />
            )}
            <Aviso texto={aviso} tipo="exito" />

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-marca">{solicitud.codigo}</p>
                    <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                        {dispositivo.marca} {dispositivo.modelo}
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">Creada el {formatearFecha(solicitud.creadaEn)}</p>
                </div>
                <EtiquetaEstado estado={solicitud.estado} />
            </div>

            <section className="tarjeta mb-6">
                <BarraProgreso estado={solicitud.estado} />
            </section>

            {cotizaciones.map((cotizacion) => (
                <TarjetaCotizacion key={cotizacion.id} cotizacion={cotizacion} alResponder={manejarRespuestaCotizacion} />
            ))}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="tarjeta lg:col-span-2">
                    <h2 className="mb-4 text-lg font-semibold">Detalle de la falla</h2>
                    <EtiquetaGravedad gravedad={solicitud.gravedad} />
                    <p className="mt-3 leading-relaxed whitespace-pre-line text-slate-300">{solicitud.descripcion}</p>

                    <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-400">Dispositivo</h3>
                    <p className="flex items-center gap-2">
                        <span aria-hidden="true">{tipo.icono}</span>
                        {tipo.etiqueta} · {dispositivo.marca} {dispositivo.modelo}
                    </p>
                    {dispositivo.numeroSerie && <p className="mt-1 text-sm text-slate-400">N.º de serie: {dispositivo.numeroSerie}</p>}

                    <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-400">Técnico</h3>
                    <p className="text-sm">{solicitud.tieneTecnico ? "Ya hay un técnico asignado a tu solicitud." : "Aún no se ha asignado un técnico."}</p>
                </section>

                <section className="tarjeta">
                    <h2 className="mb-4 text-lg font-semibold">Historial</h2>
                    <ol className="relative space-y-6 border-l border-borde pl-5">
                        {historial.map((evento) => (
                            <li key={`${evento.titulo}-${evento.fecha}`} className="relative">
                                <span className="absolute top-1.5 -left-[26px] size-2.5 rounded-full bg-marca ring-4 ring-tarjeta" />
                                <p className="text-sm font-semibold">{evento.titulo}</p>
                                {evento.detalle && <p className="mt-1 text-sm text-slate-300">{evento.detalle}</p>}
                                <p className="mt-1 text-xs text-slate-500">{formatearFechaHora(evento.fecha)}</p>
                            </li>
                        ))}
                    </ol>
                </section>
            </div>
        </>
    );
};

export default DetalleSolicitud;
