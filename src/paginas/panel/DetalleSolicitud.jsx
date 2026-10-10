import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { cancelarSolicitud, obtenerSolicitud } from "../../api/solicitudes.js";
import Aviso from "../../componentes/Aviso.jsx";
import { EtiquetaEstado, EtiquetaGravedad } from "../../componentes/panel/Etiquetas.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { buscarOpcion, ESTADOS_SOLICITUD, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { formatearFecha, formatearFechaHora } from "../../utilidades/formato.js";

/* Los pasos de la barra de progreso: todos los estados excepto "cancelada". */
const PASOS = ESTADOS_SOLICITUD.filter((estado) => estado.valor !== "cancelada");

const BarraProgreso = ({ estado }) => {
    const pasoActual = PASOS.findIndex((paso) => paso.valor === estado);

    return (
        <ol className="grid grid-cols-5 gap-2" aria-label="Progreso de la reparación">
            {PASOS.map((paso, indice) => {
                const completado = indice <= pasoActual;
                return (
                    <li key={paso.valor} aria-current={indice === pasoActual ? "step" : undefined}>
                        <div className={`h-1.5 rounded-full ${completado ? "bg-marca" : "bg-slate-700"}`} />
                        <p className={`mt-2 text-xs ${indice === pasoActual ? "font-semibold text-marca" : completado ? "text-slate-300" : "text-slate-500"}`}>
                            {paso.etiqueta}
                        </p>
                    </li>
                );
            })}
        </ol>
    );
};

const DetalleSolicitud = () => {
    const { codigo } = useParams();
    const { perfil } = useAuth();
    const ubicacion = useLocation();
    const [solicitud, setSolicitud] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [aviso, setAviso] = useState(
        ubicacion.state?.recienCreada
            ? { texto: `¡Listo! Registramos tu solicitud ${codigo}. Te contactaremos cuando un técnico la revise.`, tipo: "exito" }
            : { texto: "", tipo: "" }
    );

    useEffect(() => {
        let vigente = true;

        obtenerSolicitud(perfil.id, codigo)
            .then((encontrada) => vigente && setSolicitud(encontrada))
            .catch((errorApi) => vigente && setError(errorApi.message))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [perfil.id, codigo]);

    const cancelar = async () => {
        if (!window.confirm("¿Seguro que quieres cancelar esta solicitud?")) return;

        try {
            setSolicitud(await cancelarSolicitud(perfil.id, codigo));
            setAviso({ texto: "La solicitud fue cancelada.", tipo: "info" });
        } catch (errorApi) {
            setAviso({ texto: errorApi.message, tipo: "error" });
        }
    };

    if (cargando) {
        return <p className="text-slate-400">Cargando solicitud...</p>;
    }

    if (error) {
        return (
            <EstadoVacio icono="🔍" titulo={error} descripcion={`Revisa el código ${codigo} o vuelve a tu lista de solicitudes.`}>
                <Link to="/panel/solicitudes" className="boton-primario">Ver mis solicitudes</Link>
            </EstadoVacio>
        );
    }

    const { dispositivo } = solicitud;
    const tipo = buscarOpcion(TIPOS_DISPOSITIVO, dispositivo.tipo);

    return (
        <>
            <Link to="/panel/solicitudes" className="mb-6 inline-block text-sm text-slate-400 hover:text-marca">
                ← Volver a solicitudes
            </Link>

            <Aviso texto={aviso.texto} tipo={aviso.tipo} />

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-marca">{solicitud.codigo}</p>
                    <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                        {dispositivo.marca} {dispositivo.modelo}
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">Creada el {formatearFecha(solicitud.creadaEn)}</p>
                </div>
                <div className="flex items-center gap-3">
                    <EtiquetaEstado estado={solicitud.estado} />
                    {solicitud.estado === "pendiente" && (
                        <button type="button" onClick={cancelar} className="boton-peligro px-3 py-2">Cancelar solicitud</button>
                    )}
                </div>
            </div>

            <section className="tarjeta mb-6">
                {solicitud.estado === "cancelada" ? (
                    <p className="text-sm text-red-300">Esta solicitud fue cancelada y no seguirá en proceso.</p>
                ) : (
                    <BarraProgreso estado={solicitud.estado} />
                )}
            </section>

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
                </section>

                <section className="tarjeta">
                    <h2 className="mb-4 text-lg font-semibold">Historial</h2>
                    <ol className="relative space-y-6 border-l border-borde pl-5">
                        {[...solicitud.historial].reverse().map((evento) => (
                            <li key={`${evento.estado}-${evento.fecha}`} className="relative">
                                <span className="absolute top-1.5 -left-[26px] size-2.5 rounded-full bg-marca ring-4 ring-tarjeta" />
                                <EtiquetaEstado estado={evento.estado} />
                                <p className="mt-2 text-sm">{evento.nota}</p>
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
