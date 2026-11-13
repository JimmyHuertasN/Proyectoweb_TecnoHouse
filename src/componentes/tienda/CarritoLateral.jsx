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
        <li className="flex gap-3 border-b border-borde py-4">
            <ImagenProducto url={producto.imagenUrl} className="size-20 shrink-0 rounded-lg border border-borde" />

            <div className="flex min-w-0 flex-1 flex-col">
                <Link to={`/tienda/${producto.id}`} onClick={cerrarCarrito} className="line-clamp-2 text-sm font-semibold hover:text-marca">
                    {producto.nombre}
                </Link>
                <p className="text-xs text-slate-400">{formatearPesos(producto.precio)} c/u</p>

                <div className="mt-2 flex items-center justify-between gap-2">
                    <SelectorCantidad cantidad={cantidad} maximo={producto.stock} alCambiar={(nueva) => cambiarCantidad(producto.id, nueva)} nombre={`de ${producto.nombre}`} />
                    <p className="text-sm font-bold">{formatearPesos(producto.precio * cantidad)}</p>
                </div>
            </div>

            <button type="button" onClick={() => quitar(producto.id)} aria-label={`Quitar ${producto.nombre} del carrito`} className="self-start text-slate-500 transition hover:text-red-300">
                <Trash2 size={18} aria-hidden="true" />
            </button>
        </li>
    );
};

const CarritoLateral = () => {
    const { lineas, total, cantidadEnCarrito, carritoAbierto, cerrarCarrito, vaciar } = useTienda();
    const botonCerrar = useRef(null);

    // Al abrir: foco en el botón de cerrar, cierre con Escape y sin scroll en el fondo.
    useEffect(() => {
        if (!carritoAbierto) return undefined;

        botonCerrar.current?.focus();
        const cerrarConEscape = (evento) => evento.key === "Escape" && cerrarCarrito();
        window.addEventListener("keydown", cerrarConEscape);
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", cerrarConEscape);
            document.body.style.overflow = "";
        };
    }, [carritoAbierto, cerrarCarrito]);

    if (!carritoAbierto) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/70" onClick={cerrarCarrito} aria-hidden="true" />

            <aside role="dialog" aria-modal="true" aria-labelledby="titulo-carrito" className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l border-borde bg-tarjeta shadow-2xl">
                <div className="flex items-center justify-between border-b border-borde px-5 py-4">
                    <h2 id="titulo-carrito" className="text-lg font-bold">
                        Tu carrito <span className="text-sm font-normal text-slate-400">({cantidadEnCarrito} {cantidadEnCarrito === 1 ? "producto" : "productos"})</span>
                    </h2>
                    <button ref={botonCerrar} type="button" onClick={cerrarCarrito} aria-label="Cerrar carrito" className="rounded-lg p-1 text-slate-400 transition hover:text-marca">
                        <X size={22} aria-hidden="true" />
                    </button>
                </div>

                {lineas.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                        <ShoppingCart className="mb-3 size-12 text-slate-600" aria-hidden="true" />
                        <p className="font-semibold">Tu carrito está vacío</p>
                        <p className="mt-1 text-sm text-slate-400">Agrega productos desde la tienda.</p>
                        <button type="button" onClick={cerrarCarrito} className="boton-secundario mt-5">Seguir comprando</button>
                    </div>
                ) : (
                    <>
                        <ul className="flex-1 overflow-y-auto px-5">
                            {lineas.map((linea) => <LineaCarrito key={linea.producto.id} {...linea} />)}
                        </ul>

                        <div className="border-t border-borde px-5 py-4">
                            <div className="mb-1 flex items-center justify-between">
                                <p className="text-slate-300">Total</p>
                                <p className="text-2xl font-bold">{formatearPesos(total)}</p>
                            </div>
                            <p className="mb-4 text-xs text-slate-500">Te confirmamos disponibilidad y forma de entrega por WhatsApp.</p>

                            {/* PENDIENTE BASE: guardar el pedido en la tabla "pedidos" antes de abrir WhatsApp (ver api/pedidos.js). */}
                            {whatsappConfigurado ? (
                                <a href={enlacePedido(lineas, total)} target="_blank" rel="noopener noreferrer" className="boton-primario w-full py-3">
                                    <MessageCircle size={18} aria-hidden="true" /> Enviar pedido por WhatsApp
                                </a>
                            ) : (
                                <p className="rounded-lg border border-borde p-3 text-center text-sm text-slate-400">Pronto podrás enviar tu pedido por WhatsApp.</p>
                            )}

                            <div className="mt-3 flex gap-3">
                                <button type="button" onClick={cerrarCarrito} className="boton-secundario flex-1">Seguir comprando</button>
                                <button type="button" onClick={vaciar} className="boton-peligro flex-1">Vaciar</button>
                            </div>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
};

export default CarritoLateral;
