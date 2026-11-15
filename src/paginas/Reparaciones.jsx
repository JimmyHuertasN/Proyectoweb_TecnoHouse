import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import EncabezadoSitio from "../componentes/EncabezadoSitio.jsx";
import PiePagina from "../componentes/PiePagina.jsx";
import Skeleton from "../componentes/panel/Skeleton.jsx";
import ComoFunciona from "../componentes/reparaciones/ComoFunciona.jsx";
import NavegacionSecciones from "../componentes/reparaciones/NavegacionSecciones.jsx";
import PreguntasFrecuentes from "../componentes/reparaciones/PreguntasFrecuentes.jsx";
import SeccionContacto from "../componentes/reparaciones/SeccionContacto.jsx";
import SeccionResenas from "../componentes/reparaciones/SeccionResenas.jsx";
import SeccionUbicacion from "../componentes/reparaciones/SeccionUbicacion.jsx";
import TarjetaServicio from "../componentes/reparaciones/TarjetaServicio.jsx";
import TarjetaTecnico from "../componentes/reparaciones/TarjetaTecnico.jsx";
import { useSesion } from "../contexto/ContextoSesion.js";
import { SERVICIOS } from "../datos/servicios.js";
import useAnimacionEntrada from "../hooks/useAnimacionEntrada.js";
import { useTecnicos } from "../hooks/useTecnicos.js";
import { rutaSolicitarReparacion } from "../utilidades/rutas.js";

const PASOS_SOLICITUD = [
    "Crea tu cuenta o inicia sesión.",
    "Registra el equipo que necesita revisión.",
    "Describe la falla y adjunta fotos si quieres.",
];

/* Título, acciones y un resumen de cómo se pide una reparación. */
const PrimeraSeccion = () => {
    const { usuario } = useSesion();
    const rutaSolicitud = rutaSolicitarReparacion(usuario);

    return (
        <section id="inicio" className="border-b border-white/10 bg-gradient-to-b from-superficie to-fondo">
            <div className="contenedor grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.3fr_1fr]">
                <div>
                    <p className="antetitulo">Servicio técnico</p>
                    <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-5xl">
                        Reparación y mantenimiento para tus equipos
                    </h1>
                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
                        Atendemos computadores, celulares, consolas de videojuegos y sistemas de cámaras de seguridad. Pides el servicio en línea y sigues su avance desde tu cuenta.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link to={rutaSolicitud} className="boton-primario px-6 py-3 text-base">
                            Solicitar una reparación <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                        <a href="#servicios" className="boton-secundario px-6 py-3 text-base">Ver servicios</a>
                    </div>
                </div>

                <aside aria-labelledby="titulo-solicitud" className="tarjeta sm:p-8">
                    <h2 id="titulo-solicitud" className="text-lg font-semibold text-white">Cómo pedir tu reparación</h2>
                    <ol className="mt-5 space-y-4">
                        {PASOS_SOLICITUD.map((paso, indice) => (
                            <li key={paso} className="flex items-start gap-3.5 text-sm leading-relaxed text-slate-300">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-marca/15 text-xs font-bold text-marca" aria-hidden="true">{indice + 1}</span>
                                <span className="pt-0.5">{paso}</span>
                            </li>
                        ))}
                    </ol>
                    <p className="mt-5 border-t border-borde pt-5 text-sm text-slate-400">
                        Un técnico la revisa y te envía la cotización antes de reparar.
                    </p>
                </aside>
            </div>
        </section>
    );
};

const SeccionServicios = () => (
    <section id="servicios" data-animacion-entrada aria-labelledby="titulo-servicios" className="seccion">
        <div className="contenedor">
            <p className="antetitulo">Servicios</p>
            <h2 id="titulo-servicios" className="titulo-seccion">Qué podemos hacer por tu equipo</h2>
            <p className="texto-seccion">Elige el tipo de equipo para empezar tu solicitud.</p>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {SERVICIOS.map((servicio) => <TarjetaServicio key={servicio.id} {...servicio} />)}

                {/* Completa la cuadrícula y da una salida a quien no encuentra su caso. */}
                <li className="flex flex-col justify-center rounded-2xl border border-dashed border-slate-700 p-6">
                    <MessageCircle size={26} strokeWidth={1.7} className="text-slate-400" aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-semibold text-white">¿No encuentras tu caso?</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">Cuéntanos qué equipo tienes y te decimos si podemos ayudarte.</p>
                    <a href="#contacto" className="enlace mt-5 text-sm">Escribirnos <ArrowRight size={15} aria-hidden="true" /></a>
                </li>
            </ul>
        </div>
    </section>
);

const SeccionTecnicos = ({ tecnicos, cargando, error }) => (
    <section id="tecnicos" data-animacion-entrada aria-labelledby="titulo-tecnicos" className="seccion">
        <div className="contenedor">
            <p className="antetitulo">Técnicos</p>
            <h2 id="titulo-tecnicos" className="titulo-seccion">El equipo que atiende tu solicitud</h2>
            <p className="texto-seccion mb-10">La calificación de cada técnico es el promedio que le dan los clientes al terminar un servicio.</p>

            {cargando && <Skeleton tipo="tarjeta" cantidad={3} etiqueta="Cargando técnicos" />}
            {/* "error" trae el detalle técnico; al público se le muestra un mensaje breve. */}
            {error && <p className="rounded-2xl border border-dashed border-slate-700 px-6 py-10 text-center text-slate-400" role="status">No pudimos cargar el equipo de técnicos en este momento.</p>}
            {!cargando && !error && tecnicos.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-700 px-6 py-10 text-center text-slate-400" role="status">Pronto conocerás a nuestro equipo de técnicos.</p>
            )}
            {!cargando && !error && tecnicos.length > 0 && (
                <ul id="contenedor-tecnicos" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tecnicos.map((tecnico) => <TarjetaTecnico key={tecnico.id} tecnico={tecnico} />)}
                </ul>
            )}
        </div>
    </section>
);

const Reparaciones = () => {
    const { tecnicos, cargando, error } = useTecnicos();
    useAnimacionEntrada(cargando);

    return (
        <>
            <EncabezadoSitio />
            <NavegacionSecciones />

            <main>
                <PrimeraSeccion />
                <SeccionServicios />
                <ComoFunciona />
                <SeccionTecnicos tecnicos={tecnicos} cargando={cargando} error={error} />
                <SeccionResenas />
                <PreguntasFrecuentes />
                <SeccionUbicacion />
                <SeccionContacto />
            </main>

            <PiePagina />
        </>
    );
};

export default Reparaciones;
