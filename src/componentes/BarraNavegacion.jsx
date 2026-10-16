import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSesion } from "../contexto/ContextoSesion.js";
import { primerNombre } from "../utilidades/formato.js";
import { rutaInicio } from "../utilidades/rutas.js";

const ENLACES = [
    { href: "#inicio", texto: "Inicio" },
    { href: "#servicios", texto: "Servicios" },
    { href: "#tecnicos", texto: "Técnicos" },
    { href: "#catalogo", texto: "Catálogo" },
    { href: "#ubicacion", texto: "Ubicación" },
];

const TAMANO_BOTON = "whitespace-nowrap px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm";

const BarraNavegacion = () => {
    const { usuario } = useSesion();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [seccionActiva, setSeccionActiva] = useState("inicio");

    useEffect(() => {
        const secciones = ENLACES
            .map(({ href }) => document.getElementById(href.slice(1)))
            .filter(Boolean);
        if (!secciones.length) return undefined;

        const observador = new IntersectionObserver((entradas) => {
            const visibles = entradas
                .filter((entrada) => entrada.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            if (visibles[0]) setSeccionActiva(visibles[0].target.id);
        }, { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.15, 0.4, 0.7] });

        secciones.forEach((seccion) => observador.observe(seccion));
        return () => observador.disconnect();
    }, []);

    useEffect(() => {
        if (!menuAbierto) return undefined;
        const cerrarConEscape = (evento) => {
            if (evento.key === "Escape") setMenuAbierto(false);
        };
        window.addEventListener("keydown", cerrarConEscape);
        return () => window.removeEventListener("keydown", cerrarConEscape);
    }, [menuAbierto]);

    const claseEnlace = (href) => `rounded px-2 py-1 text-[15px] transition hover:text-marca focus-visible:outline-2 focus-visible:outline-marca ${
        seccionActiva === href.slice(1) ? "font-semibold text-marca" : "text-slate-300"
    }`;

    const enlaces = (movil = false) => ENLACES.map((enlace) => (
        <li key={enlace.href}>
            <a
                href={enlace.href}
                aria-current={seccionActiva === enlace.href.slice(1) ? "location" : undefined}
                onClick={() => movil && setMenuAbierto(false)}
                className={`${claseEnlace(enlace.href)} ${movil ? "block px-4 py-3" : ""}`}
            >
                {enlace.texto}
            </a>
        </li>
    ));

    return (
        <header className="sticky top-0 z-50 w-full border-b border-borde bg-black/95 backdrop-blur">
            <div className="flex h-[75px] items-center justify-between gap-3 px-5 lg:px-15">
                <Link to="/" className="shrink-0 text-lg font-bold text-white sm:text-2xl">
                    TECNO<span className="text-marca">HOUSE</span>
                </Link>

                <nav aria-label="Navegación principal" className="hidden md:block">
                    <ul className="flex gap-4 lg:gap-6">{enlaces()}</ul>
                </nav>

                <div className="hidden gap-2 sm:flex sm:gap-3">
                    {usuario ? (
                        <Link to={rutaInicio(usuario.rol)} className={`boton-primario ${TAMANO_BOTON}`}>Mi panel ({primerNombre(usuario.nombre)})</Link>
                    ) : (
                        <>
                            <Link to="/login" className={`boton-secundario border-marca text-marca hover:bg-marca hover:text-white ${TAMANO_BOTON}`}>Iniciar sesión</Link>
                            <Link to="/registro" className={`boton-primario ${TAMANO_BOTON}`}>Registrarse</Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className="inline-flex size-11 items-center justify-center rounded-lg border border-borde text-white transition hover:border-marca hover:text-marca focus-visible:outline-2 focus-visible:outline-marca md:hidden"
                    aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                    aria-controls="menu-movil"
                    aria-expanded={menuAbierto}
                    onClick={() => setMenuAbierto((abierto) => !abierto)}
                >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6">
                        {menuAbierto ? <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /> : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
                    </svg>
                </button>
            </div>

            {menuAbierto && (
                <nav id="menu-movil" aria-label="Navegación móvil" className="border-t border-borde bg-black px-4 py-3 shadow-xl md:hidden">
                    <ul className="flex flex-col">{enlaces(true)}</ul>
                    <div className="mt-3 flex gap-3 border-t border-borde pt-4 sm:hidden">
                        {usuario ? (
                            <Link to={rutaInicio(usuario.rol)} onClick={() => setMenuAbierto(false)} className="boton-primario w-full">Mi panel ({primerNombre(usuario.nombre)})</Link>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMenuAbierto(false)} className="boton-secundario w-full">Iniciar sesión</Link>
                                <Link to="/registro" onClick={() => setMenuAbierto(false)} className="boton-primario w-full">Registrarse</Link>
                            </>
                        )}
                    </div>
                </nav>
            )}
        </header>
    );
};

export default BarraNavegacion;
