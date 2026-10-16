import { useEffect, useState } from "react";
import { Phone, Search } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { listarCotizaciones } from "../../api/solicitudes.js";
import { avanzarEstado, crearCotizacion, listarDiagnosticos, obtenerAsignado, registrarDiagnostico } from "../../api/tecnico.js";
import Aviso from "../../componentes/Aviso.jsx";
import BarraProgreso from "../../componentes/panel/BarraProgreso.jsx";
import { EtiquetaEstado, EtiquetaGravedad } from "../../componentes/panel/Etiquetas.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FormularioCotizacion from "../../componentes/panel/FormularioCotizacion.jsx";
import FormularioDiagnostico from "../../componentes/panel/FormularioDiagnostico.jsx";
import ListaDiagnosticos from "../../componentes/panel/ListaDiagnosticos.jsx";
import ProximoPaso from "../../componentes/panel/ProximoPaso.jsx";
import TarjetaCotizacion from "../../componentes/panel/TarjetaCotizacion.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { buscarOpcion, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { formatearFecha } from "../../utilidades/formato.js";

const DetalleServicio = () => {
    const { id } = useParams();
    const { usuario } = useSesion();
    const [servicio, setServicio] = useState(null);
    const [diagnosticos, setDiagnosticos] = useState([]);
    const [cotizaciones, setCotizaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [aviso, setAviso] = useState("");
    // Cada vez que aumenta, el useEffect vuelve a pedir los datos a Supabase.
    const [recargas, setRecargas] = useState(0);

    useEffect(() => {
        let vigente = true;

        const cargar = async () => {
            try {
                const encontrado = await obtenerAsignado(usuario.id, id);
                const [listaDiagnosticos, listaCotizaciones] = await Promise.all([
                    listarDiagnosticos(encontrado.id),
                    listarCotizaciones(encontrado.id),
                ]);
                if (vigente) {
                    setServicio(encontrado);
                    setDiagnosticos(listaDiagnosticos);
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

    const terminarAccion = (mensaje) => {
        setAviso(mensaje);
        setRecargas((anterior) => anterior + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const manejarAvance = async (destino) => {
        await avanzarEstado(usuario.id, servicio);
        terminarAccion(`El servicio pasó a "${destino}".`);
    };

    const manejarDiagnostico = async (datos) => {
        await registrarDiagnostico(servicio.id, datos);
        terminarAccion("Diagnóstico guardado.");
    };

    const manejarCotizacion = async (items) => {
        await crearCotizacion(servicio.id, items);
        terminarAccion("Cotización enviada. El cliente debe aprobarla o rechazarla.");
    };

    if (cargando) {
        return <p className="text-slate-400">Cargando servicio...</p>;
    }

    if (error) {
        return (
            <EstadoVacio icono={Search} titulo={error} descripcion="Vuelve a tu lista de servicios y elige uno.">
                <Link to="/tecnico/servicios" className="boton-primario">Ver mis servicios</Link>
            </EstadoVacio>
        );
    }

    const { dispositivo, cliente } = servicio;
    const tipo = buscarOpcion(TIPOS_DISPOSITIVO, dispositivo.tipo);
    const enDiagnostico = servicio.estado === "en_diagnostico";

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

            <ProximoPaso estado={servicio.estado} alAvanzar={manejarAvance} />

            {enDiagnostico && (
                <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <FormularioDiagnostico alGuardar={manejarDiagnostico} />
                    {diagnosticos.length > 0 ? (
                        <FormularioCotizacion alEnviar={manejarCotizacion} />
                    ) : (
                        <section className="tarjeta border-dashed">
                            <h2 className="mb-2 text-lg font-semibold text-slate-400">2. Crear cotización</h2>
                            <p className="text-sm text-slate-400">Registra primero el diagnóstico para poder cotizar.</p>
                        </section>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="tarjeta lg:col-span-2">
                    <h2 className="mb-4 text-lg font-semibold">Detalle de la falla</h2>
                    <EtiquetaGravedad gravedad={servicio.gravedad} />
                    <p className="mt-3 leading-relaxed whitespace-pre-line text-slate-300">{servicio.descripcion}</p>

                    <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-400">Dispositivo</h3>
                    <p className="flex items-center gap-2">
                        <tipo.icono size={18} className="text-marca" aria-hidden="true" />
                        {tipo.etiqueta} · {dispositivo.marca} {dispositivo.modelo}
                    </p>
                    {dispositivo.numeroSerie && <p className="mt-1 text-sm text-slate-400">N.º de serie: {dispositivo.numeroSerie}</p>}
                </section>

                <section className="tarjeta">
                    <h2 className="mb-4 text-lg font-semibold">Cliente</h2>
                    <p className="font-medium">{cliente.nombre}</p>
                    {cliente.telefono ? (
                        <a href={`tel:${cliente.telefono}`} className="mt-1 inline-block text-sm text-marca hover:underline">
                            <span className="inline-flex items-center gap-2"><Phone size={14} aria-hidden="true" />{cliente.telefono}</span>
                        </a>
                    ) : (
                        <p className="mt-1 text-sm text-slate-400">Sin teléfono registrado</p>
                    )}
                </section>
            </div>

            <div className="mt-6">
                {diagnosticos.length > 0 && <ListaDiagnosticos diagnosticos={diagnosticos} />}
                {cotizaciones.map((cotizacion) => (
                    <TarjetaCotizacion key={cotizacion.id} cotizacion={cotizacion} />
                ))}
            </div>
        </>
    );
};

export default DetalleServicio;
