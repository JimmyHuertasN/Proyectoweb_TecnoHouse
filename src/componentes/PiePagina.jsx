import { Link } from "react-router-dom";
import { Camera, Clock3, Mail, MapPin, MessageCircle, Phone, UsersRound } from "lucide-react";
import { CONTACTO } from "../datos/contacto.js";
import { enlaceWhatsApp, whatsappConfigurado } from "../utilidades/whatsapp.js";
import Logotipo from "./Logotipo.jsx";

const ANIO_ACTUAL = new Date().getFullYear();

const SECCIONES = [
    { ruta: "/", texto: "Inicio" },
    { ruta: "/reparaciones", texto: "Reparaciones" },
    { ruta: "/tienda", texto: "Tienda" },
];

// Son anclas dentro de la página de reparaciones: usan <a> para que el navegador baje hasta la sección.
const AYUDA = [
    { href: "/reparaciones#como-funciona", texto: "Cómo funciona" },
    { href: "/reparaciones#preguntas-frecuentes", texto: "Preguntas frecuentes" },
    { href: "/reparaciones#ubicacion", texto: "Ubicación" },
    { href: "/reparaciones#contacto", texto: "Contacto" },
];

// Lucide no incluye logotipos de marcas: se usan símbolos genéricos disponibles.
const ICONOS_RED = { Facebook: UsersRound, Instagram: Camera };

const telefonoConfigurado = CONTACTO.telefono.replace(/\D/g, "").length >= 7;
const correoConfigurado = CONTACTO.correoConfigurado && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONTACTO.correo);
const redesConfiguradas = CONTACTO.redes.filter((red) => /^https?:\/\//.test(red.url) && ICONOS_RED[red.nombre]);

const CLASE_ENLACE = "text-slate-400 transition hover:text-white";

const Columna = ({ titulo, children }) => (
    <div>
        <h2 className="mb-4 text-sm font-semibold text-white">{titulo}</h2>
        <ul className="space-y-3 text-sm">{children}</ul>
    </div>
);

const DatoContacto = ({ Icono, children }) => (
    <li className="flex items-start gap-2.5 text-slate-400">
        <Icono size={16} className="mt-0.5 shrink-0 text-slate-500" aria-hidden="true" />
        <span className="min-w-0 break-words">{children}</span>
    </li>
);

const PiePagina = () => (
    <footer className="border-t border-white/10 bg-superficie">
        <div className="contenedor grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
            <div>
                <Logotipo className="text-2xl" />
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
                    Reparación y mantenimiento de equipos tecnológicos, y venta de repuestos y accesorios en Valledupar.
                </p>
                {redesConfiguradas.length > 0 && (
                    <ul className="mt-5 flex gap-3">
                        {redesConfiguradas.map((red) => {
                            const Icono = ICONOS_RED[red.nombre];
                            return (
                                <li key={red.nombre}>
                                    <a href={red.url} target="_blank" rel="noopener noreferrer" aria-label={red.nombre} className="flex size-11 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-slate-400 hover:text-white">
                                        <Icono size={18} aria-hidden="true" />
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <nav aria-label="Secciones del sitio">
                <Columna titulo="Sitio">
                    {SECCIONES.map((enlace) => (
                        <li key={enlace.ruta}><Link to={enlace.ruta} className={CLASE_ENLACE}>{enlace.texto}</Link></li>
                    ))}
                    <li><Link to="/login" className={CLASE_ENLACE}>Iniciar sesión</Link></li>
                    <li><Link to="/registro" className={CLASE_ENLACE}>Crear cuenta</Link></li>
                </Columna>
            </nav>

            <nav aria-label="Ayuda">
                <Columna titulo="Ayuda">
                    {AYUDA.map((enlace) => (
                        <li key={enlace.href}><a href={enlace.href} className={CLASE_ENLACE}>{enlace.texto}</a></li>
                    ))}
                </Columna>
            </nav>

            <Columna titulo="Contacto">
                {whatsappConfigurado && (
                    <DatoContacto Icono={MessageCircle}>
                        <a href={enlaceWhatsApp("Hola, quiero información sobre TecnoHouse")} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                            WhatsApp {CONTACTO.whatsapp}
                        </a>
                    </DatoContacto>
                )}
                {telefonoConfigurado && (
                    <DatoContacto Icono={Phone}>
                        <a href={`tel:${CONTACTO.telefono.replace(/[^\d+]/g, "")}`} className="hover:text-white">{CONTACTO.telefono}</a>
                    </DatoContacto>
                )}
                {correoConfigurado && (
                    <DatoContacto Icono={Mail}>
                        <a href={`mailto:${CONTACTO.correo}`} className="hover:text-white">{CONTACTO.correo}</a>
                    </DatoContacto>
                )}
                <DatoContacto Icono={MapPin}>{CONTACTO.direccion}</DatoContacto>
                {CONTACTO.horarioConfigurado && <DatoContacto Icono={Clock3}>{CONTACTO.horario}</DatoContacto>}
            </Columna>
        </div>

        <div className="border-t border-white/10">
            <p className="contenedor py-5 text-xs text-slate-500">© {ANIO_ACTUAL} TecnoHouse. Todos los derechos reservados.</p>
        </div>
    </footer>
);

export default PiePagina;
