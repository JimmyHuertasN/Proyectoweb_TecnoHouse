import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ShoppingCart, Trash2, X } from "lucide-react";
import useTienda from "../../hooks/useTienda.js";
import { formatearPesos } from "../../utilidades/formato.js";
import { enlacePedido, whatsappConfigurado } from "../../utilidades/whatsapp.js";
import ImagenProducto from "../ImagenProducto.jsx";
import SelectorCantidad from "./SelectorCantidad.jsx";

const LineaCarrito = ({ producto, cantidad }) => {
    const { cambiarCantidad, quitar, cerrarCarrito } = useTienda();

    return (
        <li className="flex gap-4 border-b border-white/10 py-5">
            <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                <ImagenProducto url={producto.imagenUrl} contener className="size-full p-1.5" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                    <Link to={`/tienda/${producto.id}`} onClick={cerrarCarrito} className="line-clamp-2 text-sm font-medium text-white hover:underline">
                        {producto.nombre}
                    </Link>
                    <button type="button" onClick={() => quitar(producto.id)} aria-label={`Quitar ${producto.nombre} del carrito`} className="-mt-2 -mr-2 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:text-red-300">
                        <Trash2 size={17} aria-hidden="true" />
                    </button>
                </div>
                <p className="text-xs text-slate-500">{formatearPesos(producto.precio)} c/u</p>

                <div className="mt-3 flex items-center justify-between gap-2">
                    <SelectorCantidad cantidad={cantidad} maximo={producto.stock} alCambiar={(nueva) => cambiarCantidad(producto.id, nueva)} nombre={`de ${producto.nombre}`} />
                    <p className="font-semibold text-white tabular-nums">{formatearPesos(producto.precio * cantidad)}</p>
                </div>
            </div>
        </li>
    );
};

const CarritoLateral = () => {
    const { lineas, total, cantidadEnCarrito, carritoAbierto, cerrarCarrito, vaciar } = useTienda();
    const botonCerrar = useRef(null);

    // Al abrir: foco en el botón de cerrar, cierre con Escape y sin scroll en el fondo.
    // Al cerrar, el foco vuelve al elemento que lo tenía (el botón del carrito).
    useEffect(() => {
        if (!carritoAbierto) return undefined;

        const focoAnterior = document.activeElement;
        botonCerrar.current?.focus();
        const cerrarConEscape = (evento) => evento.key === "Escape" && cerrarCarrito();
        window.addEventListener("keydown", cerrarConEscape);
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", cerrarConEscape);
            document.body.style.overflow = "";
            if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) focoAnterior.focus();
        };
    }, [carritoAbierto, cerrarCarrito]);

    if (!carritoAbierto) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/70" onClick={cerrarCarrito} aria-hidden="true" />

            <aside role="dialog" aria-modal="true" aria-labelledby="titulo-carrito" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-superficie shadow-2xl shadow-black">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div>
                        <h2 id="titulo-carrito" className="text-lg font-semibold text-white">Tu carrito</h2>
                        <p className="text-sm text-slate-400">{cantidadEnCarrito} {cantidadEnCarrito === 1 ? "producto" : "productos"}</p>
                    </div>
                    <button ref={botonCerrar} type="button" onClick={cerrarCarrito} aria-label="Cerrar carrito" className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white">
                        <X size={22} aria-hidden="true" />
                    </button>
                </div>

                {lineas.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                        <ShoppingCart className="size-12 text-slate-600" strokeWidth={1.5} aria-hidden="true" />
                        <p className="mt-4 font-semibold text-white">Tu carrito está vacío</p>
                        <p className="mt-1 text-sm text-slate-400">Agrega productos desde la tienda para armar tu pedido.</p>
                        <button type="button" onClick={cerrarCarrito} className="boton-secundario mt-6">Seguir comprando</button>
                    </div>
                ) : (
                    <>
                        <ul className="flex-1 overflow-y-auto px-5">
                            {lineas.map((linea) => <LineaCarrito key={linea.producto.id} {...linea} />)}
                        </ul>

                        <div className="border-t border-white/10 bg-fondo px-5 py-5">
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="text-sm text-slate-300">Total del pedido</p>
                                <p className="text-2xl font-bold text-white tabular-nums">{formatearPesos(total)}</p>
                            </div>
                            <p className="mt-1 mb-4 text-xs leading-relaxed text-slate-500">El pedido se envía por WhatsApp. Ahí te confirmamos disponibilidad y forma de entrega.</p>

                            {/* PENDIENTE BASE: guardar el pedido en la tabla "pedidos" antes de abrir WhatsApp (ver api/pedidos.js). */}
                            {whatsappConfigurado ? (
                                <a href={enlacePedido(lineas, total)} target="_blank" rel="noopener noreferrer" className="boton-primario w-full py-3 text-base">
                                    <MessageCircle size={18} aria-hidden="true" /> Enviar pedido por WhatsApp
                                </a>
                            ) : (
                                <p className="rounded-lg border border-slate-700 p-3 text-center text-sm text-slate-400">Pronto podrás enviar tu pedido por WhatsApp.</p>
                            )}

                            <div className="mt-3 flex items-center justify-between gap-3">
                                <button type="button" onClick={cerrarCarrito} className="enlace min-h-11 cursor-pointer text-sm">Seguir comprando</button>
                                <button type="button" onClick={vaciar} className="min-h-11 cursor-pointer text-sm font-medium text-slate-400 transition hover:text-red-300">Vaciar carrito</button>
                            </div>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
};

export default CarritoLateral;
