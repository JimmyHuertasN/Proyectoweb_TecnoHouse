import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, ShoppingCart, Trash2, X } from "lucide-react";
import { crearPedido } from "../../api/pedidos.js";
import { DEPARTAMENTOS_COLOMBIA } from "../../datos/departamentosColombia.js";
import { obtenerMunicipiosDepartamento } from "../../datos/municipiosPorDepartamento.js";
import { useSesion } from "../../contexto/ContextoSesion.js";
import useTienda from "../../hooks/useTienda.js";
import { formatearPesos } from "../../utilidades/formato.js";
import { enlaceWhatsApp, whatsappConfigurado } from "../../utilidades/whatsapp.js";
import BotonPagarWompi from "./BotonPagarWompi.jsx";
import Aviso from "../Aviso.jsx";
import ImagenProducto from "../ImagenProducto.jsx";
import SelectorCantidad from "./SelectorCantidad.jsx";
import SelectorCiudad from "./SelectorCiudad.jsx";
import SelectorDepartamento from "./SelectorDepartamento.jsx";

const PAIS_ENTREGA = "CO";

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

const validarEntrega = (entrega) => {
    const errores = {};
    const direccion = entrega.direccion.trim();
    const ciudad = entrega.ciudad.trim();
    const departamento = entrega.departamento.trim();
    const telefono = entrega.telefonoReceptor.trim();

    if (!direccion) errores.direccion = "Escribe la dirección de entrega.";
    else if (direccion.length > 250) errores.direccion = "La dirección no puede superar 250 caracteres.";

    if (!ciudad) errores.ciudad = "Selecciona la ciudad de entrega.";
    else if (ciudad.length > 120) errores.ciudad = "La ciudad no puede superar 120 caracteres.";
    else if (!obtenerMunicipiosDepartamento(departamento).includes(ciudad)) {
        errores.ciudad = "Selecciona una ciudad que pertenezca al departamento elegido.";
    }

    if (!departamento) errores.departamento = "Selecciona un departamento.";
    else if (!DEPARTAMENTOS_COLOMBIA.includes(departamento)) errores.departamento = "Selecciona un departamento de la lista.";

    if (!telefono) errores.telefonoReceptor = "Escribe el teléfono de quien recibe.";
    else if (telefono.length < 7 || telefono.length > 20 || !/^\+?[\d\s()-]+$/.test(telefono)) {
        errores.telefonoReceptor = "Ingresa un teléfono válido (entre 7 y 20 caracteres).";
    }

    return errores;
};

const CarritoLateral = () => {
    const { lineas, total, cantidadEnCarrito, carritoAbierto, cerrarCarrito, vaciar, recargarProductos } = useTienda();
    const { usuario, cargando: cargandoSesion } = useSesion();
    const navegar = useNavigate();
    const botonCerrar = useRef(null);
    const [entrega, setEntrega] = useState({ direccion: "", ciudad: "", departamento: "", telefonoReceptor: "" });
    const [erroresCampos, setErroresCampos] = useState({});
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [pedidoRegistrado, setPedidoRegistrado] = useState(null);

    const cerrarPanel = useCallback(() => {
        setPedidoRegistrado(null);
        setError("");
        setErroresCampos({});
        cerrarCarrito();
    }, [cerrarCarrito]);

    // Al abrir: foco en cerrar, Escape cierra y el fondo no se desplaza.
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

    const iniciarSesionParaComprar = () => {
        navegar("/login", { state: { desde: "/tienda" } });
    };

    const actualizarDatoEntrega = (name, value) => {
        setEntrega((actual) => ({ ...actual, [name]: value }));
        setErroresCampos((actual) => ({ ...actual, [name]: "" }));
        setError("");
    };

    const cambiarDatoEntrega = (evento) => actualizarDatoEntrega(evento.target.name, evento.target.value);

    const cambiarDepartamento = (departamento) => {
        setEntrega((actual) => ({ ...actual, departamento, ciudad: "" }));
        setErroresCampos((actual) => ({ ...actual, departamento: "", ciudad: "" }));
        setError("");
    };

    const enviarPedido = async (evento) => {
        evento.preventDefault();
        if (guardando) return;

        if (!usuario) {
            iniciarSesionParaComprar();
            return;
        }
        if (!usuario.nombre?.trim()) {
            setError("Completa tu nombre en el perfil antes de crear el pedido.");
            return;
        }
        if (lineas.length === 0) {
            setError("Agrega al menos un producto antes de confirmar el pedido.");
            return;
        }

        const validacion = validarEntrega(entrega);
        setErroresCampos(validacion);
        if (Object.keys(validacion).length > 0) {
            setError("Revisa los datos de entrega marcados antes de continuar.");
            return;
        }

        const datosEntrega = {
            direccion: entrega.direccion.trim(),
            ciudad: entrega.ciudad.trim(),
            departamento: entrega.departamento.trim(),
            pais: PAIS_ENTREGA,
            telefonoReceptor: entrega.telefonoReceptor.trim(),
        };

        setError("");
        setGuardando(true);
        try {
            const pedido = await crearPedido({ lineas, entrega: datosEntrega });
            // Se presenta el total calculado por el API, nunca el estimado del carrito.
            setPedidoRegistrado(pedido);
            vaciar();
        } catch (errorApi) {
            setError(errorApi.message || "No se pudo registrar el pedido. Intenta nuevamente.");
            if (/stock|disponible/i.test(errorApi.message ?? "")) {
                try {
                    await recargarProductos();
                } catch {
                    // Se conserva el error; el siguiente intento volverá a consultar el catálogo.
                }
            }
        } finally {
            setGuardando(false);
        }
    };

    if (!carritoAbierto) return null;

    const nombrePagador = usuario?.nombre?.trim() || "Nombre no disponible";
    const correoPagador = usuario?.correo || "Correo no disponible";

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
                        <h3 className="mt-4 text-lg font-semibold text-white">Pedido #{pedidoRegistrado.numero} registrado</h3>
                        <p className="mt-2 text-slate-300">Total confirmado por TecnoHouse: {formatearPesos(pedidoRegistrado.total)}</p>
                        <div className="mt-6 w-full">
                            <BotonPagarWompi idPedido={pedidoRegistrado.id} alCerrarWidget={cerrarPanel} />
                        </div>
                        <Link to={`/cliente/pedidos/${encodeURIComponent(pedidoRegistrado.id)}`} onClick={cerrarPanel} className="enlace mt-4 min-h-11 text-sm">
                            Ver detalle del pedido
                        </Link>
                        {whatsappConfigurado ? (
                            <a href={enlaceWhatsApp(`Hola, necesito ayuda con mi pedido #${pedidoRegistrado.numero} de TecnoHouse.`)} target="_blank" rel="noopener noreferrer" className="boton-secundario mt-3 w-full py-3 text-base">
                                <MessageCircle size={18} aria-hidden="true" /> Consultar por WhatsApp
                            </a>
                        ) : (
                            <p className="mt-6 rounded-lg border border-slate-700 p-3 text-sm text-slate-300">Tu pedido ya quedó registrado en TecnoHouse.</p>
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

                        <div className="max-h-[70vh] overflow-y-auto border-t border-white/10 bg-fondo px-5 py-5">
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="text-sm text-slate-300">Total estimado</p>
                                <p className="text-2xl font-bold text-white tabular-nums">{formatearPesos(total)}</p>
                            </div>
                            <p className="mt-1 mb-4 text-xs leading-relaxed text-slate-500">El total definitivo lo calcula TecnoHouse al confirmar el pedido. Después podrás pagarlo en el checkout seguro de Wompi.</p>

                            {cargandoSesion ? (
                                <p role="status" className="rounded-lg border border-white/10 p-4 text-sm text-slate-300">Verificando tu sesión…</p>
                            ) : !usuario ? (
                                <div className="space-y-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
                                    <p className="text-sm leading-relaxed text-slate-300">Inicia sesión para continuar. Tu carrito se conservará al volver.</p>
                                    <button type="button" onClick={iniciarSesionParaComprar} className="boton-primario flex w-full justify-center py-3">Iniciar sesión y continuar</button>
                                    <Link to="/registro" className="boton-secundario flex w-full justify-center py-3">Crear cuenta</Link>
                                </div>
                            ) : (
                                <form onSubmit={enviarPedido} noValidate className="space-y-3">
                                    <Aviso texto={error} tipo="error" />

                                    <div className="rounded-lg border border-white/10 bg-superficie p-3 text-sm">
                                        <p className="font-medium text-white">Datos del comprador</p>
                                        <p className="mt-1 text-slate-300">{nombrePagador}</p>
                                        <p className="text-slate-400">{correoPagador}</p>
                                        {!usuario.nombre?.trim() && (
                                            <Link to="/cliente/perfil" className="mt-2 inline-block text-marca hover:underline">Completar nombre en mi perfil</Link>
                                        )}
                                    </div>

                                    <label className="block text-sm text-slate-300" htmlFor="direccion-entrega">
                                        Dirección de entrega
                                        <input id="direccion-entrega" name="direccion" value={entrega.direccion} onChange={cambiarDatoEntrega} maxLength={250} autoComplete="street-address" aria-invalid={Boolean(erroresCampos.direccion)} aria-describedby={erroresCampos.direccion ? "error-direccion" : undefined} className="campo mt-1 w-full" />
                                        {erroresCampos.direccion && <span id="error-direccion" className="mt-1 block text-xs text-red-300">{erroresCampos.direccion}</span>}
                                    </label>

                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="block text-sm text-slate-300" htmlFor="departamento-entrega">
                                            Departamento
                                            <SelectorDepartamento value={entrega.departamento} onChange={cambiarDepartamento} invalid={Boolean(erroresCampos.departamento)} describedBy={erroresCampos.departamento ? "error-departamento" : undefined} />
                                            {erroresCampos.departamento && <span id="error-departamento" className="mt-1 block text-xs text-red-300">{erroresCampos.departamento}</span>}
                                        </label>
                                        <label className="block text-sm text-slate-300" htmlFor="ciudad-entrega">
                                            Ciudad
                                            <SelectorCiudad key={entrega.departamento} departamento={entrega.departamento} value={entrega.ciudad} onChange={(ciudad) => actualizarDatoEntrega("ciudad", ciudad)} invalid={Boolean(erroresCampos.ciudad)} describedBy={erroresCampos.ciudad ? "error-ciudad" : undefined} />
                                            {erroresCampos.ciudad && <span id="error-ciudad" className="mt-1 block text-xs text-red-300">{erroresCampos.ciudad}</span>}
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="block text-sm text-slate-300">
                                            País de entrega
                                            <p className="campo mt-1 flex w-full items-center" aria-label="País fijo: Colombia, código CO">Colombia (CO)</p>
                                        </div>
                                        <label className="block text-sm text-slate-300" htmlFor="telefono-receptor">
                                            Teléfono de quien recibe
                                            <input id="telefono-receptor" name="telefonoReceptor" type="tel" value={entrega.telefonoReceptor} onChange={cambiarDatoEntrega} minLength={7} maxLength={20} autoComplete="tel" aria-invalid={Boolean(erroresCampos.telefonoReceptor)} aria-describedby={erroresCampos.telefonoReceptor ? "error-telefono-receptor" : undefined} className="campo mt-1 w-full" />
                                            {erroresCampos.telefonoReceptor && <span id="error-telefono-receptor" className="mt-1 block text-xs text-red-300">{erroresCampos.telefonoReceptor}</span>}
                                        </label>
                                    </div>

                                    <button type="submit" disabled={guardando || cargandoSesion || !usuario.nombre?.trim()} className="boton-primario w-full py-3 text-base disabled:cursor-wait disabled:opacity-60">
                                        {guardando ? "Registrando pedido…" : "Confirmar pedido"}
                                    </button>
                                </form>
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
