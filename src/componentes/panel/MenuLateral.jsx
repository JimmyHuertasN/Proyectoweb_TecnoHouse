import { useEffect } from "react";
import { ExternalLink, LogOut, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import CampanaNotificaciones from "./CampanaNotificaciones.jsx";
import Logotipo from "../Logotipo.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { iniciales } from "../../utilidades/formato.js";

const NOMBRE_ROL = { cliente: "Cliente", tecnico: "Técnico", admin: "Administrador" };

// La página activa se reconoce por el fondo claro y la barra azul de la izquierda.
const clasesEnlace = ({ isActive }) =>
    `flex min-h-11 items-center gap-3 rounded-lg border-l-2 px-3 text-sm font-medium transition ${
        isActive ? "border-marca bg-white/10 text-white" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
    }`;

const CLASE_ENLACE_PIE = "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white";

/*
    En pantallas grandes el menú queda fijo a la izquierda. En celulares se
    oculta fuera de la pantalla y se desliza cuando "abierto" es true.
*/
const MenuLateral = ({ menu, abierto, alCerrar }) => {
    const { usuario } = useSesion();

    useEffect(() => {
        if (!abierto) return undefined;
        const cerrarConEscape = (evento) => evento.key === "Escape" && alCerrar();
        window.addEventListener("keydown", cerrarConEscape);
        return () => window.removeEventListener("keydown", cerrarConEscape);
    }, [abierto, alCerrar]);

    return (
        <>
            {abierto && (
                <div className="fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={alCerrar} aria-hidden="true" />
            )}

            {/* Cerrado en celulares queda invisible para que el teclado no entre a enlaces fuera de la pantalla. */}
            <aside
                className={`fixed top-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-superficie transition-transform duration-200 lg:sticky lg:translate-x-0 ${
                    abierto ? "translate-x-0" : "-translate-x-full max-lg:invisible"
                }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
                    <div>
                        <Logotipo />
                        <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">Panel · {NOMBRE_ROL[usuario.rol]}</p>
                    </div>
                    {/* En escritorio la campana se alinea hacia el contenido para que su lista no se corte. */}
                    <div className="hidden lg:block">
                        <CampanaNotificaciones enMenuLateral />
                    </div>
                    <button type="button" onClick={alCerrar} className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Cerrar menú">
                        <X size={22} aria-hidden="true" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Menú del panel">
                    {menu.enlaces.map((enlace) => {
                        const Icono = enlace.icono;
                        return (
                            <NavLink key={enlace.ruta} to={enlace.ruta} end={enlace.exacta} className={clasesEnlace} onClick={alCerrar}>
                                <Icono size={18} strokeWidth={1.8} aria-hidden="true" />
                                {enlace.texto}
                            </NavLink>
                        );
                    })}

                    {menu.accion && (
                        <Link to={menu.accion.ruta} onClick={alCerrar} className="boton-primario mt-5 w-full">
                            {menu.accion.texto}
                        </Link>
                    )}
                </nav>

                <div className="border-t border-white/10 p-3">
                    <div className="mb-2 flex items-center gap-3 px-2 py-2">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-200" aria-hidden="true">
                            {iniciales(usuario.nombre)}
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{usuario.nombre}</p>
                            <p className="truncate text-xs text-slate-400">{usuario.correo}</p>
                        </div>
                    </div>
                    <Link to="/" className={CLASE_ENLACE_PIE}>
                        <ExternalLink size={17} strokeWidth={1.8} aria-hidden="true" /> Ver el sitio
                    </Link>
                    <Link to="/salir" className={CLASE_ENLACE_PIE}>
                        <LogOut size={17} strokeWidth={1.8} aria-hidden="true" /> Cerrar sesión
                    </Link>
                </div>
            </aside>
        </>
    );
};

export default MenuLateral;
