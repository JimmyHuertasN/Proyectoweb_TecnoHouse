import { useEffect } from "react";
import { ExternalLink, LogOut, PanelLeftClose, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import CampanaNotificaciones from "./CampanaNotificaciones.jsx";
import BotonTema from "../BotonTema.jsx";
import Logotipo from "../Logotipo.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { iniciales } from "../../utilidades/formato.js";

const NOMBRE_ROL = { cliente: "Cliente", tecnico: "Técnico", admin: "Administrador", gestor_tienda: "Gestor de tienda" };

// Duración común de las animaciones del menú; con "reducir movimiento" del sistema no se animan.
const ANIMACION = "duration-300 ease-out motion-reduce:transition-none";

/*
    La página activa se reconoce por el fondo claro y la barra azul de la izquierda,
    que crece al seleccionarla. Al pasar el mouse, el enlace se corre un poco y el ícono se agranda.
*/
const clasesEnlace = ({ isActive }) =>
    `group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${ANIMACION} hover:translate-x-1
    before:absolute before:top-1/2 before:left-0 before:h-6 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-marca before:transition-transform before:duration-300 ${
        isActive ? "bg-white/10 text-white before:scale-y-100" : "text-slate-400 before:scale-y-0 hover:bg-white/5 hover:text-white"
    }`;

const CLASE_ENLACE_PIE = `group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-slate-400 transition ${ANIMACION} hover:translate-x-1 hover:bg-white/5 hover:text-white`;
const CLASE_ICONO = "shrink-0 transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none";

/*
    En pantallas grandes el menú queda fijo a la izquierda y se puede ocultar ("visibleEscritorio").
    En celulares se oculta fuera de la pantalla y se desliza cuando "abierto" es true.
*/
const MenuLateral = ({ menu, abierto, visibleEscritorio, alCerrar, alOcultar }) => {
    const { usuario } = useSesion();

    useEffect(() => {
        if (!abierto) return undefined;
        const cerrarConEscape = (evento) => evento.key === "Escape" && alCerrar();
        window.addEventListener("keydown", cerrarConEscape);
        return () => window.removeEventListener("keydown", cerrarConEscape);
    }, [abierto, alCerrar]);

    // Los enlaces aparecen uno tras otro cuando el menú se abre (celular) o se vuelve a mostrar (escritorio).
    const clasesEntrada = `transition ${ANIMACION} ${abierto ? "" : "max-lg:-translate-x-3 max-lg:opacity-0"} ${visibleEscritorio ? "" : "lg:-translate-x-3 lg:opacity-0"}`;

    return (
        <>
            {/* Fondo oscuro del celular: aparece y desaparece suavemente. */}
            <div
                className={`fixed inset-0 z-30 bg-black/70 transition-opacity ${ANIMACION} lg:hidden ${abierto ? "opacity-100" : "pointer-events-none opacity-0"}`}
                onClick={alCerrar}
                aria-hidden="true"
            />

            {/* En escritorio este contenedor anima su ancho, así el contenido se acomoda al ocultar el menú. */}
            <div className={`shrink-0 transition-[width] ${ANIMACION} max-lg:contents ${visibleEscritorio ? "lg:w-64" : "lg:w-0"}`}>
                {/* Oculto queda invisible para que el teclado no entre a enlaces fuera de la pantalla;
                    "visibility" también se anima para que se oculte al terminar de deslizarse. */}
                <aside
                    className={`fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 bg-superficie shadow-2xl shadow-black/40 transition-[translate,visibility] ${ANIMACION} lg:sticky lg:shadow-none ${
                        abierto ? "translate-x-0" : "max-lg:invisible max-lg:-translate-x-full"
                    } ${visibleEscritorio ? "lg:translate-x-0" : "lg:invisible lg:-translate-x-full"}`}
                >
                    <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-4">
                        <div className="min-w-0">
                            {/* Un tamaño menor que en el sitio: así el logo cabe junto a la campana y al botón de ocultar. */}
                            <Logotipo className="text-base" />
                            <p className="truncate text-[11px] font-medium tracking-wide text-slate-500 uppercase">Panel · {NOMBRE_ROL[usuario.rol]}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            {/* En escritorio la campana se alinea hacia el contenido para que su lista no se corte. */}
                            <div className="hidden lg:block">
                                <CampanaNotificaciones enMenuLateral />
                            </div>
                            <button type="button" onClick={alOcultar} className={`group hidden size-10 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition ${ANIMACION} hover:bg-white/5 hover:text-white lg:flex`} aria-label="Ocultar menú del panel" title="Ocultar menú del panel">
                                <PanelLeftClose size={20} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-0.5 motion-reduce:transition-none" />
                            </button>
                            <button type="button" onClick={alCerrar} className={`group flex size-11 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition ${ANIMACION} hover:bg-white/5 hover:text-white lg:hidden`} aria-label="Cerrar menú">
                                <X size={22} aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none" />
                            </button>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto p-3" aria-label="Menú del panel">
                        {menu.enlaces.map((enlace, indice) => {
                            const Icono = enlace.icono;
                            return (
                                // El retraso va en este contenedor para que el efecto al pasar el mouse no espere.
                                <div key={enlace.ruta} className={clasesEntrada} style={{ transitionDelay: `${(indice + 1) * 40}ms` }}>
                                    <NavLink to={enlace.ruta} end={enlace.exacta} className={clasesEnlace} onClick={alCerrar}>
                                        <Icono size={18} strokeWidth={1.8} aria-hidden="true" className={CLASE_ICONO} />
                                        {enlace.texto}
                                    </NavLink>
                                </div>
                            );
                        })}

                        {menu.accion && (
                            <div className={clasesEntrada} style={{ transitionDelay: `${(menu.enlaces.length + 1) * 40}ms` }}>
                                <Link to={menu.accion.ruta} onClick={alCerrar} className="boton-primario mt-5 w-full">
                                    {menu.accion.texto}
                                </Link>
                            </div>
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
                        <BotonTema conTexto className={`w-full cursor-pointer ${CLASE_ENLACE_PIE}`} />
                        <Link to="/" className={CLASE_ENLACE_PIE}>
                            <ExternalLink size={17} strokeWidth={1.8} aria-hidden="true" className={CLASE_ICONO} /> Ver el sitio
                        </Link>
                        <Link to="/salir" className={CLASE_ENLACE_PIE}>
                            <LogOut size={17} strokeWidth={1.8} aria-hidden="true" className={CLASE_ICONO} /> Cerrar sesión
                        </Link>
                    </div>
                </aside>
            </div>
        </>
    );
};

export default MenuLateral;
