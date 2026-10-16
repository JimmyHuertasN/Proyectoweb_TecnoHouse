import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { avanzarEstado, obtenerAsignado } from "../../api/tecnico.js";
import Aviso from "../../componentes/Aviso.jsx";
import BarraProgreso from "../../componentes/panel/BarraProgreso.jsx";
import { EtiquetaEstado, EtiquetaGravedad } from "../../componentes/panel/Etiquetas.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { AVANCES_TECNICO, buscarOpcion, ESTADOS_SOLICITUD, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { formatearFecha } from "../../utilidades/formato.js";

/* Qué decirle al técnico cuando el siguiente paso no depende de un botón. */
const ESPERAS = {
    en_diagnostico: "Revisa el equipo, registra el diagnóstico y envía la cotización al cliente.",
    cotizado: "Esperando que el cliente apruebe o rechace la cotización.",
    finalizado: "Servicio terminado. Esperando la calificación del cliente.",
    calificado: "Servicio terminado y calificado por el cliente.",
};

const ProximoPaso = ({ servicio, alAvanzar }) => {
    const [error, setError] = useState("");
    const [avanzando, setAvanzando] = useState(false);
    const avance = AVANCES_TECNICO[servicio.estado];

    const avanzar = async () => {
        const destino = buscarOpcion(ESTADOS_SOLICITUD, avance.siguiente).etiqueta;
        if (!window.confirm(`¿Pasar el servicio a "${destino}"? El cliente recibirá una notificación.`)) return;

        setError("");
        setAvanzando(true);

        try {
            await alAvanzar();
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
                <p className="text-sm text-slate-300">{ESPERAS[servicio.estado]}</p>
            )}
        </section>
    );
};

const DetalleServicio = () => {
    const { id } = useParams();
    const { usuario } = useSesion();
    const [servicio, setServicio] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [aviso, setAviso] = useState("");
    // Cada vez que aumenta, el useEffect vuelve a pedir el servicio a Supabase.
    const [recargas, setRecargas] = useState(0);

    useEffect(() => {
        let vigente = true;

        obtenerAsignado(usuario.id, id)
            .then((encontrado) => vigente && setServicio(encontrado))
            .catch((errorApi) => vigente && setError(errorApi.message))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [usuario.id, id, recargas]);

    const manejarAvance = async () => {
        await avanzarEstado(usuario.id, servicio);
        const destino = buscarOpcion(ESTADOS_SOLICITUD, AVANCES_TECNICO[servicio.estado].siguiente).etiqueta;
        setAviso(`El servicio pasó a "${destino}".`);
        setRecargas((anterior) => anterior + 1);
    };

    if (cargando) {
        return <p className="text-slate-400">Cargando servicio...</p>;
    }

    if (error) {
        return (
            <EstadoVacio icono="🔍" titulo={error} descripcion="Vuelve a tu lista de servicios y elige uno.">
                <Link to="/tecnico/servicios" className="boton-primario">Ver mis servicios</Link>
            </EstadoVacio>
        );
    }

    const { dispositivo, cliente } = servicio;
    const tipo = buscarOpcion(TIPOS_DISPOSITIVO, dispositivo.tipo);

    return (
        <>
            <Link to="/tecnico/servicios" className="mb-6 inline-block text-sm text-slate-400 hover:text-marca">
                ← Volver a mis servicios
            </Link>

            <Aviso texto={aviso} tipo="exito" />

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-marca">{servicio.codigo}</p>
                    <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                        {dispositivo.marca} {dispositivo.modelo}
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">Solicitado el {formatearFecha(servicio.creadaEn)}</p>
                </div>
                <EtiquetaEstado estado={servicio.estado} />
            </div>

            <section className="tarjeta mb-6">
                <BarraProgreso estado={servicio.estado} />
            </section>

            <ProximoPaso servicio={servicio} alAvanzar={manejarAvance} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="tarjeta lg:col-span-2">
                    <h2 className="mb-4 text-lg font-semibold">Detalle de la falla</h2>
                    <EtiquetaGravedad gravedad={servicio.gravedad} />
                    <p className="mt-3 leading-relaxed whitespace-pre-line text-slate-300">{servicio.descripcion}</p>

                    <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-400">Dispositivo</h3>
                    <p className="flex items-center gap-2">
                        <span aria-hidden="true">{tipo.icono}</span>
                        {tipo.etiqueta} · {dispositivo.marca} {dispositivo.modelo}
                    </p>
                    {dispositivo.numeroSerie && <p className="mt-1 text-sm text-slate-400">N.º de serie: {dispositivo.numeroSerie}</p>}
                </section>

                <section className="tarjeta">
                    <h2 className="mb-4 text-lg font-semibold">Cliente</h2>
                    <p className="font-medium">{cliente.nombre}</p>
                    {cliente.telefono ? (
                        <a href={`tel:${cliente.telefono}`} className="mt-1 inline-block text-sm text-marca hover:underline">
                            📞 {cliente.telefono}
                        </a>
                    ) : (
                        <p className="mt-1 text-sm text-slate-400">Sin teléfono registrado</p>
                    )}
                </section>
            </div>
        </>
    );
};

export default DetalleServicio;
