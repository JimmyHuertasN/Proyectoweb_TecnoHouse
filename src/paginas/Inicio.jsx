import { useEffect } from "react";
import BarraNavegacion from "../componentes/BarraNavegacion.jsx";
import TarjetaServicio from "../componentes/TarjetaServicio.jsx";
import TarjetaTecnico from "../componentes/TarjetaTecnico.jsx";
import Skeleton from "../componentes/panel/Skeleton.jsx";
import ComoFunciona from "../componentes/inicio/ComoFunciona.jsx";
import PiePagina from "../componentes/inicio/PiePagina.jsx";
import PreguntasFrecuentes from "../componentes/inicio/PreguntasFrecuentes.jsx";
import SeccionCatalogo from "../componentes/inicio/SeccionCatalogo.jsx";
import SeccionContacto from "../componentes/inicio/SeccionContacto.jsx";
import SeccionResenas from "../componentes/inicio/SeccionResenas.jsx";
import SeccionUbicacion from "../componentes/inicio/SeccionUbicacion.jsx";
import { SERVICIOS } from "../datos/servicios.js";
import { useTecnicos } from "../hooks/useTecnicos.js";

const Inicio = () => {
    const { tecnicos, cargando, error } = useTecnicos();

    useEffect(() => {
        const elementos = document.querySelectorAll("[data-animacion-entrada]:not(.entrada-visible)");
        if (!("IntersectionObserver" in window)) {
            elementos.forEach((elemento) => elemento.classList.add("entrada-visible"));
            return undefined;
        }

        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                entrada.target.classList.add("entrada-visible");
                observador.unobserve(entrada.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });

        elementos.forEach((elemento) => observador.observe(elemento));
        return () => observador.disconnect();
    }, [tecnicos.length, cargando]);

    return (
        <>
            <BarraNavegacion />

            <main>
                <section id="inicio" data-animacion-entrada className="relative isolate flex min-h-[600px] scroll-mt-20 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#00aaff]/10 via-[#05060a] to-[#05060a] px-6 py-24 text-center sm:px-[10%]">
                    <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-[30rem] -translate-x-1/2 rounded-full bg-marca/10 blur-3xl" />
                    <p className="antetitulo">Servicio técnico profesional</p>
                    <h1 className="mb-6 text-4xl leading-tight font-bold sm:text-5xl lg:text-[58px]">
                        SOLUCIONES TECNOLÓGICAS
                        <br />
                        AL ALCANCE DE TU PANTALLA
                    </h1>

                    <p className="mb-9 w-full max-w-[650px] text-lg leading-[1.7] text-slate-300">
                        Servicio técnico y mantenimiento profesional para computadoras, celulares, consolas de videojuegos y sistemas de cámaras de seguridad.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="#servicios" className="boton-primario px-6 py-3.5 text-[15px] font-bold">Ver Servicios</a>
                        <a href="#contacto" className="boton-secundario px-6 py-3.5 text-[15px] font-bold text-white">Contáctanos</a>
                    </div>
                </section>

                <section id="servicios" data-animacion-entrada aria-labelledby="titulo-servicios" className="scroll-mt-20 bg-fondo px-[8%] py-24 text-center">
                    <h2 id="titulo-servicios" className="mb-4 text-4xl font-bold text-marca">NUESTROS SERVICIOS</h2>
                    <p className="mb-12 text-slate-400">Soluciones profesionales para todos tus dispositivos.</p>

                    <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {SERVICIOS.map((servicio) => <TarjetaServicio key={servicio.id} {...servicio} />)}
                    </div>
                </section>

                <ComoFunciona />
                <SeccionResenas />

                <section id="tecnicos" data-animacion-entrada aria-labelledby="titulo-tecnicos" className="scroll-mt-20 bg-fondo px-[8%] py-24 text-center">
                    <h2 id="titulo-tecnicos" className="mb-4 text-4xl font-bold text-marca">NUESTROS TÉCNICOS</h2>
                    <p className="mb-12 text-slate-400">Profesionales certificados listos para resolver cualquier problema tecnológico que se te presente.</p>
                    <div id="contenedor-tecnicos" className="flex flex-wrap justify-center gap-6">
                        {cargando && <Skeleton tipo="tarjeta" cantidad={3} etiqueta="Cargando técnicos" className="w-full max-w-5xl" />}
                        {error && <p className="text-slate-400">{error}</p>}
                        {!cargando && !error && tecnicos.length === 0 && <p className="text-slate-400">Pronto conocerás a nuestro equipo de técnicos.</p>}
                        {!cargando && !error && tecnicos.map((tecnico) => <TarjetaTecnico key={tecnico.id} tecnico={tecnico} />)}
                    </div>
                </section>

                <PreguntasFrecuentes />

                <SeccionCatalogo id="catalogo" />

                <SeccionUbicacion />
                <SeccionContacto />
            </main>

            <PiePagina />
        </>
    );
};

export default Inicio;
