import { Link } from "react-router-dom";
import { CircleCheck, Laptop, Wrench } from "lucide-react";
import { estaActiva } from "../../api/solicitudes.js";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FilaSolicitud from "../../componentes/panel/FilaSolicitud.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { buscarOpcion, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { useDispositivos } from "../../hooks/useDispositivos.js";
import { useSolicitudes } from "../../hooks/useSolicitudes.js";
import { primerNombre } from "../../utilidades/formato.js";
import Skeleton from "../../componentes/panel/Skeleton.jsx";

const saludoSegunHora = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 19) return "Buenas tardes";
    return "Buenas noches";
};

const Indicador = ({ valor, texto, icono: Icono }) => (
    <div className="tarjeta flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-lg bg-marca/10 text-marca" aria-hidden="true"><Icono size={22} /></span>
        <div>
            <p className="text-3xl font-bold">{valor}</p>
            <p className="text-sm text-slate-400">{texto}</p>
        </div>
    </div>
);

const ResumenPanel = () => {
    const { usuario } = useSesion();
    const { dispositivos, cargando: cargandoDispositivos } = useDispositivos();
    const { solicitudes, cargando: cargandoSolicitudes } = useSolicitudes();

    const activas = solicitudes.filter(estaActiva);
    const finalizadas = solicitudes.filter((solicitud) => !estaActiva(solicitud));
    const cargando = cargandoDispositivos || cargandoSolicitudes;

    return (
        <>
            {/* BIENVENIDA */}
            <section className="mb-8 overflow-hidden rounded-2xl border border-borde bg-linear-to-br from-tarjeta via-tarjeta to-marca/20 p-6 sm:p-8">
                <p className="text-sm font-semibold tracking-widest text-marca uppercase">{saludoSegunHora()}</p>
                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Hola, {primerNombre(usuario.nombre)}</h1>
                <p className="mt-3 max-w-xl text-slate-300">
                    {activas.length > 0
                        ? `Tienes ${activas.length} ${activas.length === 1 ? "servicio en curso" : "servicios en curso"}. Aquí puedes seguir su avance.`
                        : "Desde aquí gestionas tus equipos y sigues cada reparación paso a paso."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/cliente/solicitudes/nueva" className="boton-primario">+ Solicitar reparación</Link>
                    <Link to="/cliente/dispositivos" className="boton-secundario">Registrar un dispositivo</Link>
                </div>
            </section>

            {/* RESUMEN EN NÚMEROS */}
            {cargando ? <Skeleton tipo="metrica" cantidad={3} etiqueta="Cargando resumen" className="mb-8" /> : (
                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Resumen">
                    <Indicador icono={Laptop} valor={dispositivos.length} texto="Dispositivos registrados" />
                    <Indicador icono={Wrench} valor={activas.length} texto="Servicios en curso" />
                    <Indicador icono={CircleCheck} valor={finalizadas.length} texto="Servicios finalizados" />
                </section>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/* SOLICITUDES RECIENTES */}
                <section className="tarjeta lg:col-span-3">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Solicitudes recientes</h2>
                        <Link to="/cliente/solicitudes" className="text-sm font-semibold text-marca hover:underline">Ver todas</Link>
                    </div>
                    {cargando ? <Skeleton tipo="fila" cantidad={3} etiqueta="Cargando solicitudes recientes" /> : solicitudes.length === 0 ? (
                        <EstadoVacio icono={Wrench} titulo="Aún no tienes solicitudes" descripcion="Cuando pidas una reparación podrás ver aquí su estado." />
                    ) : (
                        <ul className="space-y-3">
                            {solicitudes.slice(0, 4).map((solicitud) => (
                                <FilaSolicitud key={solicitud.id} solicitud={solicitud} />
                            ))}
                        </ul>
                    )}
                </section>

                {/* DISPOSITIVOS */}
                <section className="tarjeta lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Tus dispositivos</h2>
                        <Link to="/cliente/dispositivos" className="text-sm font-semibold text-marca hover:underline">Gestionar</Link>
                    </div>
                    {cargando ? <Skeleton tipo="fila" cantidad={3} etiqueta="Cargando dispositivos" /> : dispositivos.length === 0 ? (
                        <EstadoVacio icono={Laptop} titulo="Sin dispositivos" descripcion="Registra tu computador, celular o consola para pedir servicio más rápido." />
                    ) : (
                        <ul className="divide-y divide-borde">
                            {dispositivos.slice(0, 5).map((dispositivo) => {
                                const Icono = buscarOpcion(TIPOS_DISPOSITIVO, dispositivo.tipo).icono;
                                return (
                                    <li key={dispositivo.id} className="flex items-center gap-3 py-3">
                                        <Icono className="size-5 text-marca" aria-hidden="true" />
                                        <span className="truncate">{dispositivo.marca} {dispositivo.modelo}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
};

export default ResumenPanel;
