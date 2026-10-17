import { Camera, Mail, MapPin, Phone, UsersRound } from "lucide-react";
import { CONTACTO } from "../../datos/contacto.js";

const ENLACES = [
    { href: "/#servicios", texto: "Servicios" },
    { href: "/#como-funciona", texto: "Cómo funciona" },
    { href: "/#tecnicos", texto: "Nuestros técnicos" },
    { href: "/#resenas", texto: "Reseñas" },
    { href: "/#preguntas-frecuentes", texto: "Preguntas frecuentes" },
    { href: "/#ubicacion", texto: "Ubicación" },
    { href: "/#contacto", texto: "Contáctanos" },
    { href: "/#catalogo", texto: "Catálogo" },
];

// Lucide no incluye logotipos de marcas: se usan símbolos genéricos disponibles.
const ICONOS_RED = { Facebook: UsersRound, Instagram: Camera };
const telefonoConfigurado = CONTACTO.telefono.replace(/\D/g, "").length >= 7;
const correoConfigurado = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONTACTO.correo);

const PiePagina = () => (
    <footer className="border-t border-borde bg-[#030509] px-6 py-12 sm:px-[8%]">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
                <a href="/" className="text-2xl font-bold text-white">TECNO<span className="text-marca">HOUSE</span></a>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">Servicio técnico profesional para tus equipos tecnológicos.</p>
            </div>

            <nav aria-label="Enlaces del pie de página">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Explora</h2>
                <ul className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm text-slate-400">
                    {ENLACES.map((enlace) => <li key={enlace.href}><a className="transition hover:text-marca" href={enlace.href}>{enlace.texto}</a></li>)}
                </ul>
            </nav>

            <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Contacto</h2>
                <ul className="space-y-3 text-sm text-slate-400">
                    <li className="flex items-start gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />{telefonoConfigurado ? <a href={`tel:${CONTACTO.telefono.replace(/[^\d+]/g, "")}`} className="hover:text-marca">{CONTACTO.telefono}</a> : CONTACTO.telefono}</li>
                    <li className="flex items-start gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />{correoConfigurado ? <a href={`mailto:${CONTACTO.correo}`} className="break-all hover:text-marca">{CONTACTO.correo}</a> : CONTACTO.correo}</li>
                    <li className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />{CONTACTO.direccion}</li>
                    <li className="text-xs text-slate-500">{CONTACTO.horario}</li>
                </ul>
            </div>

            <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Redes sociales</h2>
                {CONTACTO.redes.length > 0 ? (
                    <ul className="flex gap-3">
                        {CONTACTO.redes.map((red) => {
                            const Icono = ICONOS_RED[red.nombre];
                            if (!Icono) return null;
                            const urlValida = /^https?:\/\//.test(red.url);
                            return (
                                <li key={red.nombre}>
                                    {urlValida ? (
                                        <a href={red.url} target="_blank" rel="noreferrer" aria-label={red.nombre} className="flex size-10 items-center justify-center rounded-lg border border-borde text-slate-300 transition hover:border-marca hover:text-marca"><Icono size={18} aria-hidden="true" /></a>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 text-sm text-slate-500"><Icono size={16} aria-hidden="true" />{red.nombre}: {red.url}</span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : <p className="text-sm text-slate-500">Perfiles por confirmar.</p>}
            </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 border-t border-borde pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} TecnoHouse. Todos los derechos reservados.</p>
            <div className="flex gap-4"><a href="/login" className="hover:text-marca">Iniciar sesión</a><a href="/registro" className="hover:text-marca">Crear cuenta</a></div>
        </div>
    </footer>
);

export default PiePagina;
