import { X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { iniciales } from "../../utilidades/formato.js";

const clasesEnlace = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        isActive ? "bg-marca/10 text-marca" : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

/*
    En pantallas grandes el menú queda fijo a la izquierda. En celulares se
    oculta fuera de la pantalla y se desliza cuando "abierto" es true.
*/
const MenuLateral = ({ menu, abierto, alCerrar }) => {
    const { usuario } = useSesion();

    return (
        <>
            {abierto && (
                <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={alCerrar} aria-hidden="true" />
            )}

            <aside
                className={`fixed top-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-borde bg-fondo transition-transform duration-200 lg:sticky lg:translate-x-0 ${
                    abierto ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-[75px] items-center justify-between border-b border-borde px-6">
                    <Link to="/" className="text-xl font-bold text-white">
                        TECNO<span className="text-marca">HOUSE</span>
                    </Link>
                    <button
                        type="button"
                        onClick={alCerrar}
                        className="cursor-pointer text-2xl text-slate-400 hover:text-white lg:hidden"
                        aria-label="Cerrar menú"
                    >
                        <X size={22} aria-hidden="true" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Menú del panel">
                    {menu.enlaces.map((enlace) => {
                        const Icono = enlace.icono;
                        return (
                            <NavLink key={enlace.ruta} to={enlace.ruta} end={enlace.exacta} className={clasesEnlace} onClick={alCerrar}>
                                <Icono size={19} strokeWidth={1.8} aria-hidden="true" />
                                {enlace.texto}
                            </NavLink>
                        );
                    })}

                    {menu.accion && (
                        <Link to={menu.accion.ruta} onClick={alCerrar} className="boton-primario mt-6 w-full">
                            {menu.accion.texto}
                        </Link>
                    )}
                </nav>

                <div className="border-t border-borde p-4">
                    <div className="mb-3 flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-marca/15 text-sm font-bold text-marca">
                            {iniciales(usuario.nombre)}
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{usuario.nombre}</p>
                            <p className="truncate text-xs text-slate-400">{usuario.correo}</p>
                        </div>
                    </div>
                    <Link to="/salir" className="boton-secundario w-full">
                        Cerrar sesión
                    </Link>
                </div>
            </aside>
        </>
    );
};

export default MenuLateral;
