import { useEffect, useState } from "react";
import { Search, Wrench } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
    calificarServicio,
    listarCotizaciones,
    obtenerHistorial,
    obtenerSolicitud,
    obtenerTecnicoAsignado,
    responderCotizacion,
} from "../../api/solicitudes.js";
import Aviso from "../../componentes/Aviso.jsx";
import BarraProgreso from "../../componentes/panel/BarraProgreso.jsx";
import { EtiquetaEstado, EtiquetaGravedad } from "../../componentes/panel/Etiquetas.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import ChatServicio from "../../componentes/panel/ChatServicio.jsx";
import FormularioCalificacion from "../../componentes/panel/FormularioCalificacion.jsx";
import GaleriaFotosServicio from "../../componentes/panel/GaleriaFotosServicio.jsx";
import TarjetaCotizacion from "../../componentes/panel/TarjetaCotizacion.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { buscarOpcion, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { formatearFecha, formatearFechaHora } from "../../utilidades/formato.js";
import useToast from "../../hooks/useToast.js";

const DetalleSolicitud = () => {
    const { id } = useParams();
    const { usuario } = useSesion();
    const ubicacion = useLocation();
    const [solicitud, setSolicitud] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [cotizaciones, setCotizaciones] = useState([]);
    const [tecnico, setTecnico] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const toast = useToast();
    // Cada vez que aumenta, el useEffect vuelve a pedir los datos a Supabase.
    const [recargas, setRecargas] = useState(0);
    const recienCreada = ubicacion.state?.recienCreada;

    useEffect(() => {
        let vigente = true;

        const cargar = async () => {
            try {
                const encontrada = await obtenerSolicitud(usuario.id, id);
                const [eventos, listaCotizaciones, tecnicoAsignado] = await Promise.all([
                    obtenerHistorial(encontrada),
                    listarCotizaciones(encontrada.id),
                    encontrada.tecnicoId ? obtenerTecnicoAsignado(encontrada.tecnicoId) : null,
                ]);
                if (vigente) {
                    setSolicitud(encontrada);
                    setHistorial(eventos);
                    setCotizaciones(listaCotizaciones);
                    setTecnico(tecnicoAsignado);
                    // Quita el error de una carga anterior (otra solicitud o un fallo de red).
                    setError("");
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
        toast.exito(aprobar ? "Aprobaste la cotización. El técnico empezará la reparación." : "Rechazaste la cotización.");
        setRecargas((anterior) => anterior + 1);
    };

    const manejarCalificacion = async (datos) => {
        await calificarServicio(solicitud.id, datos);
        toast.exito("¡Gracias por calificar el servicio!");
        setRecargas((anterior) => anterior + 1);
    };

    if (cargando) {
        return <p className="text-slate-400">Cargando solicitud...</p>;
    }

    if (error) {
        return (
            <EstadoVacio icono={Search} titulo={error} descripcion="Vuelve a tu lista de solicitudes y elige una.">
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
            {ubicacion.state?.errorFotos && <Aviso texto={`La solicitud se creó, pero no se pudieron guardar las fotos: ${ubicacion.state.errorFotos}`} tipo="error" />}
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

            {solicitud.estado === "finalizado" && <FormularioCalificacion alCalificar={manejarCalificacion} />}

            {/* Pasa al PDF el servicio y el perfil del cliente que inició sesión. */}
            {cotizaciones.map((cotizacion) => (
                <TarjetaCotizacion
                    key={cotizacion.id}
                    cotizacion={cotizacion}
                    servicio={solicitud}
                    cliente={usuario}
                    alResponder={manejarRespuestaCotizacion}
                />
            ))}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="tarjeta lg:col-span-2">
                    <h2 className="mb-4 text-lg font-semibold">Detalle de la falla</h2>
                    <EtiquetaGravedad gravedad={solicitud.gravedad} />
                    <p className="mt-3 leading-relaxed whitespace-pre-line text-slate-300">{solicitud.descripcion}</p>

                    <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-400">Dispositivo</h3>
                    <p className="flex items-center gap-2">
                        <tipo.icono className="size-5 text-marca" aria-hidden="true" />
                        {tipo.etiqueta} · {dispositivo.marca} {dispositivo.modelo}
                    </p>
                    {dispositivo.numeroSerie && <p className="mt-1 text-sm text-slate-400">N.º de serie: {dispositivo.numeroSerie}</p>}

                    <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-400">Técnico</h3>
                    {tecnico ? (
                        <p className="flex items-center gap-2">
                            <Wrench size={18} aria-hidden="true" />
                            <span>
                                <span className="font-medium">{tecnico.nombre}</span>
                                {tecnico.especialidad && <span className="block text-sm text-slate-400">{tecnico.especialidad}</span>}
                            </span>
                        </p>
                    ) : (
                        <p className="text-sm text-slate-400">Aún no se ha asignado un técnico.</p>
                    )}
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

            {/* Las fotos privadas se muestran como galería con enlaces firmados. */}
            <GaleriaFotosServicio servicioId={solicitud.id} />
            {/* Conversación compartida con el técnico asignado. */}
            <ChatServicio servicioId={solicitud.id} />
        </>
    );
};

export default DetalleSolicitud;
