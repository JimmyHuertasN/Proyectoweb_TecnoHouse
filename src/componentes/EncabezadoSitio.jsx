import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, UserRound, X } from "lucide-react";
import { useSesion } from "../contexto/ContextoSesion.js";
import { rutaInicio } from "../utilidades/rutas.js";
import Logotipo from "./Logotipo.jsx";

const ENLACES = [
    { ruta: "/", texto: "Inicio", exacta: true },
    { ruta: "/reparaciones", texto: "Reparaciones" },
    { ruta: "/tienda", texto: "Tienda" },
];

const claseEnlaceEscritorio = ({ isActive }) =>
    `border-b-2 px-1 py-5 text-sm font-medium transition ${isActive ? "border-marca text-white" : "border-transparent text-slate-400 hover:text-white"}`;

const claseEnlaceMovil = ({ isActive }) =>
    `block rounded-lg px-3 py-3 text-base font-medium ${isActive ? "bg-white/5 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`;

/* Entrada a la cuenta: el panel del rol si hay sesión; si no, iniciar sesión o registrarse. */
const AccesoCuenta = ({ alNavegar, anchoCompleto = false }) => {
    const { usuario } = useSesion();
    const ancho = anchoCompleto ? "w-full" : "";

    if (usuario) {
        return (
            <Link to={rutaInicio(usuario.rol)} onClick={alNavegar} className={`boton-secundario ${ancho}`}>
                <UserRound size={16} aria-hidden="true" /> Mi panel
            </Link>
        );
    }

    return (
        <>
            <Link to="/login" onClick={alNavegar} className={`boton-secundario ${ancho}`}>Iniciar sesión</Link>
            <Link to="/registro" onClick={alNavegar} className={`boton-primario ${ancho}`}>Crear cuenta</Link>
        </>
    );
};

/*
    Navegación del sitio público: la comparten la portada, reparaciones, la tienda y
    las pantallas de acceso. "children" agrega acciones propias de una sección (el carrito).
*/
const EncabezadoSitio = ({ children }) => {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const botonMenu = useRef(null);
    const menuMovil = useRef(null);

    // Al abrir: foco en el primer enlace y cierre con Escape devolviendo el foco al botón.
    useEffect(() => {
        if (!menuAbierto) return undefined;

        menuMovil.current?.querySelector("a")?.focus();
        const cerrarConEscape = (evento) => {
            if (evento.key !== "Escape") return;
            setMenuAbierto(false);
            botonMenu.current?.focus();
        };
        window.addEventListener("keydown", cerrarConEscape);
        return () => window.removeEventListener("keydown", cerrarConEscape);
    }, [menuAbierto]);

    const cerrarMenu = () => setMenuAbierto(false);

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-fondo/90 backdrop-blur">
            <div className="contenedor flex h-16 items-center justify-between gap-4">
                <Logotipo />

                <nav aria-label="Navegación principal" className="hidden md:block">
                    <ul className="flex gap-7">
                        {ENLACES.map((enlace) => (
                            <li key={enlace.ruta}>
                                <NavLink to={enlace.ruta} end={enlace.exacta} className={claseEnlaceEscritorio}>{enlace.texto}</NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden items-center gap-3 md:flex">
                        <AccesoCuenta />
                    </div>

                    {children}

                    <button
                        ref={botonMenu}
                        type="button"
                        className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg border border-slate-700 text-slate-200 transition hover:border-slate-400 md:hidden"
                        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                        aria-controls="menu-movil"
                        aria-expanded={menuAbierto}
                        onClick={() => setMenuAbierto((abierto) => !abierto)}
                    >
                        {menuAbierto ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
                    </button>
                </div>
            </div>

            {menuAbierto && (
                <nav ref={menuMovil} id="menu-movil" aria-label="Navegación principal" className="absolute inset-x-0 top-full border-b border-white/10 bg-fondo px-5 pt-2 pb-5 shadow-2xl shadow-black/60 md:hidden">
                    <ul>
                        {ENLACES.map((enlace) => (
                            <li key={enlace.ruta}>
                                <NavLink to={enlace.ruta} end={enlace.exacta} onClick={cerrarMenu} className={claseEnlaceMovil}>{enlace.texto}</NavLink>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-3 flex flex-col gap-3 border-t border-white/10 pt-4">
                        <AccesoCuenta alNavegar={cerrarMenu} anchoCompleto />
                    </div>
                </nav>
            )}
        </header>
    );
};

export default EncabezadoSitio;
