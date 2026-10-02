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
                <section className="hero-section">
                    <p className="subtitle">SERVICIO TÉCNICO PROFESIONAL</p>
                    <h2>
                        SOLUCIONES TECNOLOGICAS
                        <br />
                        AL ALCANCE DE TU PANTALLA
                    </h2>

                    <p className="description">
                        Servicio técnico y mantenimiento profesional para
                        computadoras, celulares, consolas de videojuegos
                        y sistemas de cámaras de seguridad.
                    </p>

                    <div className="hero-buttons">
                        <button className="primary-button">Ver Servicios</button>
                        <button className="secondary-button">Contáctanos</button>
                    </div>
                </section>

                {/* SERVICIOS */}
                <section id="servicios" className="services-section">
                    <h2>NUESTROS SERVICIOS</h2>
                    <p className="services-description">
                        Soluciones profesionales para todos tus dispositivos.
                    </p>

                    <div className="services-container">
                        {SERVICIOS.map((servicio) => (
                            <TarjetaServicio key={servicio.id} {...servicio} />
                        ))}
                    </div>
                </section>

                {/* TECNICOS */}
                <section id="tecnicos" className="tecnicos-section">
                    <h2>NUESTROS TÉCNICOS</h2>
                    <p className="tecnicos-description">
                        Profesionales certificados listos para resolver cualquier problema tecnologico que se le presente.
                    </p>
                    <div id="contenedor-tecnicos" className="tecnicos-container">
                        {cargando && <p className="tecnicos-description">Cargando técnicos...</p>}
                        {error && <p className="tecnicos-description">{error}</p>}
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
