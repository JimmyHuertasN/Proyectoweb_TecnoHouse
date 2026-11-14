import { MapPin } from "lucide-react";
import { CONTACTO } from "../../datos/contacto.js";

const SeccionUbicacion = () => {
    const direccion = CONTACTO.direccion.trim();
    const ubicacionDisponible = direccion.length > 0 && !direccion.includes("PENDIENTE");
    // Google Maps geocodifica la dirección al cargar el mapa; cambiar CONTACTO.direccion
    // actualiza también la ubicación mostrada sin mantener coordenadas duplicadas.
    const mapa = `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`;

    return (
        <section id="ubicacion" data-animacion-entrada aria-labelledby="titulo-ubicacion" className="seccion border-t border-white/10 bg-superficie">
            <div className="contenedor grid items-center gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
                <div>
                    <p className="antetitulo">Ubicación</p>
                    <h2 id="titulo-ubicacion" className="titulo-seccion">Dónde encontrarnos</h2>
                    <address className="mt-5 flex gap-3 leading-relaxed text-slate-300 not-italic">
                        <MapPin size={20} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />
                        {CONTACTO.direccion}
                    </address>
                    {!ubicacionDisponible && <p className="mt-3 text-sm text-slate-500">La dirección se publicará cuando esté confirmada.</p>}
                </div>

                <div className="overflow-hidden rounded-2xl border border-borde bg-tarjeta">
                    {ubicacionDisponible ? (
                        <iframe
                            title={`Mapa de ubicación de TecnoHouse: ${direccion}`}
                            src={mapa}
                            className="block h-80 w-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            allowFullScreen
                        />
                    ) : (
                        <div className="flex h-80 items-center justify-center px-6 text-center text-sm text-slate-500">
                            El mapa estará disponible cuando confirmemos la dirección.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default SeccionUbicacion;
