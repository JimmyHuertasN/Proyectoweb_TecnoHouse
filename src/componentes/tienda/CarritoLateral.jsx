import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ShoppingCart, Trash2, X } from "lucide-react";
import { crearPedido } from "../../api/pedidos.js";
import { useSesion } from "../../contexto/ContextoSesion.js";
import useTienda from "../../hooks/useTienda.js";
import { codigoPedido, formatearPesos } from "../../utilidades/formato.js";
import { enlacePedido, whatsappConfigurado } from "../../utilidades/whatsapp.js";
import Aviso from "../Aviso.jsx";
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
    const { lineas, total, cantidadEnCarrito, carritoAbierto, cerrarCarrito, vaciar, recargarProductos } = useTienda();
    const { usuario } = useSesion();
    const botonCerrar = useRef(null);
    const [datosCliente, setDatosCliente] = useState({ nombre: null, telefono: null, notas: "" });
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [pedidoRegistrado, setPedidoRegistrado] = useState(null);

    const cerrarPanel = useCallback(() => {
        setPedidoRegistrado(null);
        setError("");
        cerrarCarrito();
    }, [cerrarCarrito]);

    // Al abrir: foco en el botón de cerrar, cierre con Escape y sin scroll en el fondo.
    // Al cerrar, el foco vuelve al elemento que lo tenía (el botón del carrito).
    useEffect(() => {
        if (!carritoAbierto) return undefined;

        const focoAnterior = document.activeElement;
        botonCerrar.current?.focus();
        const cerrarConEscape = (evento) => evento.key === "Escape" && cerrarPanel();
        window.addEventListener("keydown", cerrarConEscape);
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", cerrarConEscape);
            document.body.style.overflow = "";
            if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) focoAnterior.focus();
        };
    }, [carritoAbierto, cerrarPanel]);

    const cambiarDato = (evento) => {
        const { name, value } = evento.target;
        setDatosCliente((actuales) => ({ ...actuales, [name]: value }));
    };

    const nombreFormulario = datosCliente.nombre ?? usuario?.nombre ?? "";
    const telefonoFormulario = datosCliente.telefono ?? usuario?.telefono ?? "";

    const enviarPedido = async (evento) => {
        evento.preventDefault();
        if (guardando) return;

        const nombre = nombreFormulario.trim();
        const telefono = telefonoFormulario.trim();
        if (nombre.length < 2 || nombre.length > 120) {
            setError("El nombre debe tener entre 2 y 120 caracteres.");
            return;
        }
        if (telefono.length < 7 || telefono.length > 20) {
            setError("El teléfono debe tener entre 7 y 20 caracteres.");
            return;
        }
        if (datosCliente.notas.length > 500) {
            setError("Las notas pueden tener máximo 500 caracteres.");
            return;
        }
        if (lineas.length === 0) {
            setError("Agrega al menos un producto antes de hacer el pedido.");
            return;
        }

        setError("");
        setGuardando(true);
        try {
            const pedido = await crearPedido({ nombre, telefono, notas: datosCliente.notas, lineas });
            setPedidoRegistrado({ ...pedido, lineas, total: pedido.total });
            vaciar();
        } catch (errorApi) {
            setError(errorApi.message || "No se pudo registrar el pedido.");
            if (/stock|disponible/i.test(errorApi.message ?? "")) {
                try {
                    await recargarProductos();
                } catch {
                    // Se conserva el error del pedido y el siguiente intento volverá a consultar el catálogo.
                }
            }
        } finally {
            setGuardando(false);
        }
    };

    if (!carritoAbierto) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/70" onClick={cerrarPanel} aria-hidden="true" />

            <aside role="dialog" aria-modal="true" aria-labelledby="titulo-carrito" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-superficie shadow-2xl shadow-black">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div>
                        <h2 id="titulo-carrito" className="text-lg font-semibold text-white">Tu carrito</h2>
                        <p className="text-sm text-slate-400">{cantidadEnCarrito} {cantidadEnCarrito === 1 ? "producto" : "productos"}</p>
                    </div>
                    <button ref={botonCerrar} type="button" onClick={cerrarPanel} aria-label="Cerrar carrito" className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white">
                        <X size={22} aria-hidden="true" />
                    </button>
                </div>

                {pedidoRegistrado ? (
                    <div role="status" aria-live="polite" className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 text-center">
                        <ShoppingCart className="size-12 text-emerald-400" strokeWidth={1.5} aria-hidden="true" />
                        <h3 className="mt-4 text-lg font-semibold text-white">Pedido {codigoPedido(pedidoRegistrado.numero)} registrado</h3>
                        <p className="mt-2 text-slate-300">Total: {formatearPesos(pedidoRegistrado.total)}</p>
                        {whatsappConfigurado ? (
                            <a href={enlacePedido(pedidoRegistrado, pedidoRegistrado.lineas)} target="_blank" rel="noopener noreferrer" aria-label={`Avisar por WhatsApp el pedido ${codigoPedido(pedidoRegistrado.numero)}`} className="boton-primario mt-6 w-full py-3 text-base">
                                <MessageCircle size={18} aria-hidden="true" /> Avisar por WhatsApp
                            </a>
                        ) : (
                            <p className="mt-6 rounded-lg border border-slate-700 p-3 text-sm text-slate-300">El negocio te contactará para confirmar disponibilidad y forma de entrega.</p>
                        )}
                        <button type="button" onClick={cerrarPanel} className="enlace mt-4 min-h-11 cursor-pointer text-sm">Seguir comprando</button>
                    </div>
                ) : lineas.length === 0 ? (
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

                        <div className="max-h-[65vh] overflow-y-auto border-t border-white/10 bg-fondo px-5 py-5">
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="text-sm text-slate-300">Total del pedido</p>
                                <p className="text-2xl font-bold text-white tabular-nums">{formatearPesos(total)}</p>
                            </div>
                            <p className="mt-1 mb-4 text-xs leading-relaxed text-slate-500">Registra tu pedido y luego podrás avisarnos por WhatsApp. Confirmaremos disponibilidad y forma de entrega.</p>

                            <form onSubmit={enviarPedido} className="space-y-3">
                                <Aviso texto={error} tipo="error" />
                                <label className="block text-sm text-slate-300" htmlFor="nombre-pedido">
                                    Nombre
                                    <input id="nombre-pedido" name="nombre" value={nombreFormulario} onChange={cambiarDato} required minLength={2} maxLength={120} autoComplete="name" className="campo mt-1 w-full" />
                                </label>
                                <label className="block text-sm text-slate-300" htmlFor="telefono-pedido">
                                    Teléfono
                                    <input id="telefono-pedido" name="telefono" type="tel" value={telefonoFormulario} onChange={cambiarDato} required minLength={7} maxLength={20} autoComplete="tel" className="campo mt-1 w-full" />
                                </label>
                                <label className="block text-sm text-slate-300" htmlFor="notas-pedido">
                                    Notas <span className="text-slate-500">(opcional)</span>
                                    <textarea id="notas-pedido" name="notas" value={datosCliente.notas} onChange={cambiarDato} maxLength={500} rows={2} className="campo mt-1 w-full resize-y" />
                                </label>
                                <button type="submit" disabled={guardando} className="boton-primario w-full py-3 text-base disabled:cursor-wait disabled:opacity-60">
                                    {guardando ? "Registrando pedido…" : "Hacer pedido"}
                                </button>
                            </form>

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
