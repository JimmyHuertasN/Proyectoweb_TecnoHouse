import { Link, NavLink } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useSesion } from "../../contexto/ContextoSesion.js";
import useTienda from "../../hooks/useTienda.js";
import { primerNombre } from "../../utilidades/formato.js";
import { rutaInicio } from "../../utilidades/rutas.js";

const claseEnlace = ({ isActive }) => `rounded px-2 py-1 text-[15px] transition hover:text-marca ${isActive ? "font-semibold text-marca" : "text-slate-300"}`;

const EncabezadoTienda = () => {
    const { usuario } = useSesion();
    const { cantidadEnCarrito, abrirCarrito } = useTienda();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-borde bg-black/95 backdrop-blur">
            <div className="flex h-[75px] items-center justify-between gap-3 px-5 lg:px-15">
                <Link to="/" className="shrink-0 text-lg font-bold text-white sm:text-2xl">
                    TECNO<span className="text-marca">HOUSE</span>
                </Link>

                <nav aria-label="Navegación de la tienda">
                    <ul className="flex gap-2 sm:gap-4">
                        <li><NavLink to="/tienda" className={claseEnlace}>Tienda</NavLink></li>
                        <li><NavLink to="/reparaciones" className={claseEnlace}>Reparaciones</NavLink></li>
                    </ul>
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    {usuario ? (
                        <Link to={rutaInicio(usuario.rol)} className="boton-secundario hidden px-3 py-2 sm:inline-flex">Mi panel ({primerNombre(usuario.nombre)})</Link>
                    ) : (
                        <Link to="/login" className="boton-secundario hidden px-3 py-2 sm:inline-flex">Iniciar sesión</Link>
                    )}

                    <button type="button" onClick={abrirCarrito} aria-label={`Abrir carrito, ${cantidadEnCarrito} productos`} className="relative inline-flex size-11 items-center justify-center rounded-lg border border-borde text-white transition hover:border-marca hover:text-marca">
                        <ShoppingCart size={22} aria-hidden="true" />
                        {cantidadEnCarrito > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full bg-marca px-1 text-xs font-bold text-slate-950">
                                {cantidadEnCarrito}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default EncabezadoTienda;
