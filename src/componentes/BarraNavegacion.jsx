import { Link } from "react-router-dom";
import { useSesion } from "../contexto/ContextoSesion.js";
import { primerNombre } from "../utilidades/formato.js";

const ENLACES = [
    { href: "#inicio", texto: "Inicio" },
    { href: "#servicios", texto: "Servicios" },
    { href: "#tecnicos", texto: "Técnicos" },
    { href: "#catalogo", texto: "Catálogo" },
    { href: "#ubicacion", texto: "Ubicación" },
];

/* Botones más compactos en celulares para que quepan junto al logo. */
const TAMANO_BOTON = "whitespace-nowrap px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm";

const BarraNavegacion = () => {
    const { usuario } = useSesion();

    return (
        <header className="sticky top-0 z-50 flex h-[75px] w-full items-center justify-between border-b border-borde bg-black px-5 lg:px-15">
            <Link to="/" className="text-lg font-bold text-white sm:text-2xl">
                TECNO<span className="text-marca">HOUSE</span>
            </Link>

            {/* En celulares se ocultan los enlaces para que no se amontonen. */}
            <nav className="hidden md:block">
                <ul className="flex gap-8">
                    {ENLACES.map((enlace) => (
                        <li key={enlace.href}>
                            <a href={enlace.href} className="text-[15px] text-slate-300 transition hover:text-marca">
                                {enlace.texto}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="flex gap-2 sm:gap-3">
                {usuario ? (
                    <Link to="/panel" className={`boton-primario ${TAMANO_BOTON}`}>Mi panel ({primerNombre(usuario.nombre)})</Link>
                ) : (
                    <>
                        <Link to="/login" className={`boton-secundario border-marca text-marca hover:bg-marca hover:text-white ${TAMANO_BOTON}`}>
                            Iniciar Sesión
                        </Link>
                        <Link to="/registro" className={`boton-primario ${TAMANO_BOTON}`}>Registrarse</Link>
                    </>
                )}
            </div>
        </header>
    );
};

export default BarraNavegacion;
