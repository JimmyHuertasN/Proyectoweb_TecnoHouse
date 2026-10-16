import { MapPin } from "lucide-react";
import { CONTACTO } from "../../datos/contacto.js";

const SeccionUbicacion = () => {
    const latitud = Number(CONTACTO.coordenadas.latitud);
    const longitud = Number(CONTACTO.coordenadas.longitud);
    const ubicacionDisponible = Number.isFinite(latitud) && Number.isFinite(longitud)
        && Math.abs(latitud) <= 90 && Math.abs(longitud) <= 180;
    const mapa = `https://www.google.com/maps?q=${latitud},${longitud}&output=embed`;

    return (
        <section id="ubicacion" data-animacion-entrada aria-labelledby="titulo-ubicacion" className="scroll-mt-20 bg-fondo px-6 py-20 sm:px-[8%] sm:py-24">
            <div className="mx-auto max-w-6xl">
                <p className="antetitulo text-center">Ven a visitarnos</p>
                <h2 id="titulo-ubicacion" className="mb-8 text-center text-3xl font-bold sm:text-4xl">UBICACIÓN</h2>
                <div className="grid overflow-hidden rounded-2xl border border-borde bg-tarjeta md:grid-cols-5">
                    <div className="flex flex-col justify-center p-6 sm:p-9 md:col-span-2">
                        <MapPin size={26} className="mb-4 text-marca" aria-hidden="true" />
                        <h3 className="mb-2 text-lg font-semibold">TecnoHouse</h3>
                        <address className="not-italic leading-relaxed text-slate-300">{CONTACTO.direccion}</address>
                        {!ubicacionDisponible && <p className="mt-3 text-sm text-slate-500">La dirección se publicará cuando esté confirmada.</p>}
                    </div>
                    <div className="min-h-72 bg-[#080d16] md:col-span-3">
                        {ubicacionDisponible ? (
                            <iframe
                                title={`Mapa de ubicación de TecnoHouse: ${CONTACTO.direccion}`}
                                src={mapa}
                                className="size-full min-h-72 border-0 grayscale-[0.2]"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                            />
                        ) : (
                            <div className="flex min-h-72 items-center justify-center px-6 text-center text-sm text-slate-500">
                                El mapa estará disponible cuando confirmemos la dirección.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SeccionUbicacion;
