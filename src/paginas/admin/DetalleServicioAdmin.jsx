import { useEffect, useState } from "react";
import { Phone, Search } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { listarTecnicos, obtenerServicio, reasignarTecnico } from "../../api/admin.js";
import { estaActiva, listarCotizaciones } from "../../api/solicitudes.js";
import { listarDiagnosticos } from "../../api/tecnico.js";
import BarraProgreso from "../../componentes/panel/BarraProgreso.jsx";
import { EtiquetaEstado, EtiquetaGravedad } from "../../componentes/panel/Etiquetas.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import GaleriaFotosServicio from "../../componentes/panel/GaleriaFotosServicio.jsx";
import ListaDiagnosticos from "../../componentes/panel/ListaDiagnosticos.jsx";
import SelectorTecnico from "../../componentes/panel/SelectorTecnico.jsx";
import TarjetaCotizacion from "../../componentes/panel/TarjetaCotizacion.jsx";
import { buscarOpcion, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { formatearFecha } from "../../utilidades/formato.js";
import useToast from "../../hooks/useToast.js";

const DatosPersona = ({ titulo, persona, textoSinPersona }) => (
    <div>
        <h3 className="mb-1 text-sm font-semibold text-slate-400">{titulo}</h3>
        {persona ? (
            <>
                <p className="font-medium">{persona.nombre}</p>
                {persona.telefono && <p className="flex items-center gap-2 text-sm text-slate-400"><Phone size={14} aria-hidden="true" />{persona.telefono}</p>}
            </>
        ) : (
            <p className="text-sm text-amber-300">{textoSinPersona}</p>
        )}
    </div>
);

const DetalleServicioAdmin = () => {
    const { id } = useParams();
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState("");
    const toast = useToast();
    // Cada vez que aumenta, el useEffect vuelve a pedir los datos a Supabase.
    const [recargas, setRecargas] = useState(0);

    useEffect(() => {
        let vigente = true;

        const cargar = async () => {
            try {
                const servicio = await obtenerServicio(id);
                const [tecnicos, diagnosticos, cotizaciones] = await Promise.all([
                    listarTecnicos(),
                    listarDiagnosticos(servicio.id),
                    listarCotizaciones(servicio.id),
                ]);
                if (vigente) setDatos({ servicio, tecnicos, diagnosticos, cotizaciones });
            } catch (errorApi) {
                if (vigente) setError(errorApi.message);
            }
        };

        cargar();
        return () => {
            vigente = false;
        };
    }, [id, recargas]);

    const manejarAsignacion = async (tecnico) => {
        await reasignarTecnico(datos.servicio, tecnico.id);
        toast.exito(`El servicio quedó asignado a ${tecnico.nombre}.`);
        setRecargas((anterior) => anterior + 1);
    };

    if (error) {
        return (
            <EstadoVacio icono={Search} titulo={error} descripcion="Vuelve a la lista de servicios y elige uno.">
                <Link to="/admin/servicios" className="boton-primario">Ver servicios</Link>
            </EstadoVacio>
        );
    }

    if (!datos) {
        return <p className="text-slate-400">Cargando servicio...</p>;
    }

    const { servicio, tecnicos, diagnosticos, cotizaciones } = datos;
    const { dispositivo } = servicio;
    const tipo = buscarOpcion(TIPOS_DISPOSITIVO, dispositivo.tipo);

    return (
        <>
            <Link to="/admin/servicios" className="mb-6 inline-block text-sm text-slate-400 hover:text-marca">
                ← Volver a servicios
            </Link>

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

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
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

                <section className="tarjeta space-y-5">
                    <DatosPersona titulo="Cliente" persona={servicio.cliente} />
                    <DatosPersona titulo="Técnico" persona={servicio.tecnico} textoSinPersona="Sin técnico asignado" />

                    {estaActiva(servicio) ? (
                        <div className="border-t border-borde pt-5">
                            <SelectorTecnico
                                tecnicos={tecnicos.filter((tecnico) => tecnico.activo)}
                                tecnicoActualId={servicio.tecnicoId}
                                alAsignar={manejarAsignacion}
                            />
                        </div>
                    ) : (
                        <p className="border-t border-borde pt-5 text-sm text-slate-400">El servicio terminó: ya no se puede cambiar el técnico.</p>
                    )}
                </section>
            </div>

            {/* El administrador también puede consultar las fotos con URL firmada. */}
            <GaleriaFotosServicio servicioId={servicio.id} />

            {diagnosticos.length > 0 && <ListaDiagnosticos diagnosticos={diagnosticos} />}
            {cotizaciones.map((cotizacion) => (
                <TarjetaCotizacion key={cotizacion.id} cotizacion={cotizacion} />
            ))}
        </>
    );
};

export default DetalleServicioAdmin;
