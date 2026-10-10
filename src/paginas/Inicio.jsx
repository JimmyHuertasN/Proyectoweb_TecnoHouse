import BarraNavegacion from "../componentes/BarraNavegacion.jsx";
import PiePagina from "../componentes/PiePagina.jsx";
import TarjetaServicio from "../componentes/TarjetaServicio.jsx";
import TarjetaTecnico from "../componentes/TarjetaTecnico.jsx";
import { SERVICIOS } from "../datos/servicios.js";
import { useTecnicos } from "../hooks/useTecnicos.js";

const Inicio = () => {
    const { tecnicos, cargando, error, eliminarTecnico } = useTecnicos();

    return (
        <>
            <BarraNavegacion />

            <main id="inicio">
                {/* PORTADA */}
                <section className="flex min-h-[600px] flex-col items-center px-[10%] py-20 text-center">
                    <p className="antetitulo">Servicio técnico profesional</p>
                    <h2 className="mb-6 text-4xl leading-tight font-bold sm:text-5xl lg:text-[58px]">
                        SOLUCIONES TECNOLOGICAS
                        <br />
                        AL ALCANCE DE TU PANTALLA
                    </h2>

                    <p className="mb-9 w-full max-w-[650px] text-lg leading-[1.7] text-slate-400">
                        Servicio técnico y mantenimiento profesional para
                        computadoras, celulares, consolas de videojuegos
                        y sistemas de cámaras de seguridad.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <button className="boton-primario px-6 py-3.5 text-[15px] font-bold">Ver Servicios</button>
                        <button className="boton-secundario px-6 py-3.5 text-[15px] font-bold text-white">Contáctanos</button>
                    </div>
                </section>

                {/* SERVICIOS */}
                <section id="servicios" className="bg-[#050404] px-[8%] py-24 text-center">
                    <h2 className="mb-4 text-4xl font-bold text-marca">NUESTROS SERVICIOS</h2>
                    <p className="mb-12 text-slate-400">
                        Soluciones profesionales para todos tus dispositivos.
                    </p>

                    <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {SERVICIOS.map((servicio) => (
                            <TarjetaServicio key={servicio.id} {...servicio} />
                        ))}
                    </div>
                </section>

                {/* TECNICOS */}
                <section id="tecnicos" className="bg-[#050404] px-[8%] py-24 text-center">
                    <h2 className="mb-4 text-4xl font-bold text-marca">NUESTROS TÉCNICOS</h2>
                    <p className="mb-12 text-slate-400">
                        Profesionales certificados listos para resolver cualquier problema tecnologico que se le presente.
                    </p>
                    <div id="contenedor-tecnicos" className="flex flex-wrap justify-center gap-6">
                        {cargando && <p className="text-slate-400">Cargando técnicos...</p>}
                        {error && <p className="text-slate-400">{error}</p>}
                        {!cargando && !error && tecnicos.map((tecnico) => (
                            <TarjetaTecnico key={tecnico.id} tecnico={tecnico} alEliminar={eliminarTecnico} />
                        ))}
                    </div>
                </section>
            </main>

            <PiePagina />
        </>
    );
};

export default Inicio;
