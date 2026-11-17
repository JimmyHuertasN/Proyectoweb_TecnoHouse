import { Fragment, useEffect, useState } from "react";
import { ChevronDown, MessageCircle, ShoppingCart } from "lucide-react";
import { cambiarEstadoPedido, obtenerPedidos } from "../../api/pedidos.js";
import Aviso from "../../componentes/Aviso.jsx";
import BarraFiltros from "../../componentes/panel/BarraFiltros.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import ResultadosPaginados from "../../componentes/panel/ResultadosPaginados.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import TarjetaMetrica from "../../componentes/panel/TarjetaMetrica.jsx";
import EtiquetaEstadoPedido from "../../componentes/panel/tienda/EtiquetaEstadoPedido.jsx";
import useConfirmar from "../../hooks/useConfirmar.js";
import { useFiltroPaginado } from "../../hooks/useFiltroPaginado.js";
import useToast from "../../hooks/useToast.js";
import { ESTADOS_PEDIDO } from "../../datos/estadosPedido.js";
import { codigoPedido, formatearFechaHora, formatearPesos } from "../../utilidades/formato.js";
import { enlaceRespuestaPedido } from "../../utilidades/whatsapp.js";
import { estaEnRango, normalizarTexto } from "../../utilidades/filtros.js";

const FILTROS_VACIOS = { texto: "", estado: "todas", desde: "", hasta: "" };
const OPCIONES_ESTADO = [{ valor: "todas", etiqueta: "Todos los estados" }, ...ESTADOS_PEDIDO.map(({ valor, etiquetaSingular }) => ({ valor, etiqueta: etiquetaSingular }))];
const ETIQUETAS_ACCION = { confirmado: "Confirmar", entregado: "Marcar entregado", cancelado: "Cancelar" };

/* Busca por número (con o sin "PED-" y ceros) o por nombre del comprador; las fechas son las de creación. */
const cumpleFiltrosPedido = (pedido, filtros) => {
    const texto = normalizarTexto(filtros.texto).replace(/^#|^ped-0*/g, "");
    const coincideTexto = !texto || String(pedido.numero).includes(texto) || normalizarTexto(pedido.clienteNombre).includes(texto);
    return (
        coincideTexto &&
        (filtros.estado === "todas" || pedido.estado === filtros.estado) &&
        estaEnRango(pedido.creadoEn, filtros.desde, filtros.hasta)
    );
};

const DetallePedido = ({ pedido }) => {
    const enlaceRespuesta = enlaceRespuestaPedido(pedido);
    const { direccion, ciudad, departamento } = pedido.entrega;
    const direccionEntrega = [direccion, ciudad, departamento].filter(Boolean).join(", ");

    return (
        <div id={`detalle-pedido-${pedido.id}`} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div>
                <h3 className="mb-3 font-semibold text-white">Productos del pedido</h3>
                <div role="region" aria-label={`Productos del pedido ${pedido.numero}`} tabIndex={0} className="overflow-x-auto rounded-lg border border-borde focus-visible:outline-2 focus-visible:outline-marca">
                    <table className="w-full min-w-[34rem] text-left text-sm">
                        <caption className="sr-only">Productos, cantidades y precios del pedido {pedido.numero}</caption>
                        <thead className="bg-tarjeta text-xs text-slate-400">
                            <tr>
                                <th scope="col" className="px-3 py-2">Producto</th>
                                <th scope="col" className="px-3 py-2">Cantidad</th>
                                <th scope="col" className="px-3 py-2">Precio unitario</th>
                                <th scope="col" className="px-3 py-2">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-borde">
                            {pedido.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-3 py-2 text-white">{item.nombre}</td>
                                    <td className="px-3 py-2 tabular-nums">{item.cantidad}</td>
                                    <td className="px-3 py-2 tabular-nums">{formatearPesos(item.precioUnitario)}</td>
                                    <td className="px-3 py-2 tabular-nums">{formatearPesos(item.precioUnitario * item.cantidad)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-4 text-sm">
                <div>
                    <h3 className="font-semibold text-white">Comprador</h3>
                    <p className="mt-1 text-slate-300">{pedido.clienteNombre}</p>
                    <p className="text-slate-400 tabular-nums">{pedido.clienteTelefono}</p>
                </div>
                {direccionEntrega && (
                    <div>
                        <h3 className="font-semibold text-white">Entrega</h3>
                        <p className="mt-1 text-slate-400">{direccionEntrega}</p>
                        {pedido.entrega.telefonoReceptor && <p className="text-slate-400 tabular-nums">Recibe: {pedido.entrega.telefonoReceptor}</p>}
                    </div>
                )}
                <div>
                    <h3 className="font-semibold text-white">Notas</h3>
                    <p className="mt-1 whitespace-pre-wrap text-slate-400">{pedido.notas || "Sin notas."}</p>
                </div>
                <p className="text-xs text-slate-500">Último cambio: {formatearFechaHora(pedido.actualizadoEn)}</p>
                {enlaceRespuesta ? (
                    <a href={enlaceRespuesta} target="_blank" rel="noopener noreferrer" aria-label={`Escribir al comprador del pedido ${codigoPedido(pedido.numero)} por WhatsApp`} className="boton-secundario w-full">
                        <MessageCircle size={16} aria-hidden="true" /> Escribir por WhatsApp
                    </a>
                ) : (
                    <p className="rounded-lg border border-borde px-3 py-2 text-xs text-slate-400">
                        El teléfono del comprador no es válido para WhatsApp.
                    </p>
                )}
            </div>
        </div>
    );
};

const PedidosTienda = () => {
    const confirmar = useConfirmar();
    const toast = useToast();
    const [pedidos, setPedidos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [ocupadoId, setOcupadoId] = useState("");
    const [pedidoAbierto, setPedidoAbierto] = useState("");
    const paginado = useFiltroPaginado(pedidos, cumpleFiltrosPedido, FILTROS_VACIOS, 10);

    useEffect(() => {
        let vigente = true;
        obtenerPedidos()
            .then((lista) => vigente && setPedidos(lista))
            .catch((errorApi) => vigente && setError(errorApi.message || "No se pudieron cargar los pedidos."))
            .finally(() => vigente && setCargando(false));
        return () => {
            vigente = false;
        };
    }, []);

    const recargarPedidos = async () => {
        setCargando(true);
        setError("");
        try {
            setPedidos(await obtenerPedidos());
        } catch (errorApi) {
            setError(errorApi.message || "No se pudieron actualizar los pedidos.");
        } finally {
            setCargando(false);
        }
    };

    const cambiarEstado = async (pedido, siguienteEstado) => {
        const estadoNuevo = ESTADOS_PEDIDO.find((estado) => estado.valor === siguienteEstado)?.etiquetaSingular ?? siguienteEstado;
        const notaStock = siguienteEstado === "confirmado" ? " Se descontará el stock disponible." : "";
        const notaDevolucion = siguienteEstado === "cancelado" && pedido.estado === "confirmado" ? " Las unidades vuelven al inventario." : "";
        const aceptado = await confirmar({
            titulo: `${ETIQUETAS_ACCION[siguienteEstado]} pedido`,
            mensaje: `¿Cambiar el pedido ${codigoPedido(pedido.numero)} a ${estadoNuevo.toLowerCase()}?${notaStock}${notaDevolucion}`,
        });
        if (!aceptado) return;

        setError("");
        setOcupadoId(pedido.id);
        try {
            await cambiarEstadoPedido(pedido.id, siguienteEstado);
            toast.exito(`El pedido ${codigoPedido(pedido.numero)} quedó ${estadoNuevo.toLowerCase()}.`);
            await recargarPedidos();
        } catch (errorApi) {
            // El mensaje viene de la base (por ejemplo, falta de stock). Se recarga por si otra persona cambió el pedido.
            toast.error(errorApi.message || "No se pudo cambiar el estado del pedido.");
            await recargarPedidos();
        } finally {
            setOcupadoId("");
        }
    };

    const contarPorEstado = (estado) => pedidos.filter((pedido) => pedido.estado === estado).length;

    return (
        <>
            <EncabezadoPagina titulo="Pedidos" descripcion="Pedidos que los clientes registran desde el carrito de la tienda. Confirmar descuenta el stock y cancelar un pedido confirmado lo devuelve.">
                <button type="button" onClick={recargarPedidos} disabled={cargando} className="boton-secundario disabled:cursor-wait disabled:opacity-60">
                    ↻ Actualizar
                </button>
            </EncabezadoPagina>

            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {ESTADOS_PEDIDO.map((estado) => (
                    <TarjetaMetrica key={estado.valor} icono={estado.icono} titulo={estado.etiqueta} valor={contarPorEstado(estado.valor)} detalle={estado.detalle} />
                ))}
            </div>

            <Aviso texto={error} tipo="error" />
            {cargando && <Skeleton tipo="fila" cantidad={4} etiqueta="Cargando pedidos" />}

            {!cargando && !error && pedidos.length === 0 && (
                <EstadoVacio icono={ShoppingCart} titulo="Todavía no hay pedidos registrados" descripcion="Los pedidos de la tienda aparecerán aquí cuando un cliente los registre." />
            )}

            {!cargando && !error && pedidos.length > 0 && (
                <>
                    <BarraFiltros
                        id="pedidos"
                        etiqueta="Filtrar pedidos"
                        placeholder="Número de pedido o nombre del comprador"
                        paginado={paginado}
                        opcionesEstado={OPCIONES_ESTADO}
                        conFechas
                    />

                    <ResultadosPaginados id="pedidos" paginado={paginado}>
                        <div role="region" aria-label="Lista de pedidos" tabIndex={0} className="overflow-x-auto rounded-xl border border-borde focus-visible:outline-2 focus-visible:outline-marca">
                            <table className="w-full min-w-[62rem] text-left text-sm">
                                <caption className="sr-only">Pedidos registrados en la tienda</caption>
                                <thead className="bg-tarjeta text-xs tracking-wide text-slate-400 uppercase">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Pedido</th>
                                        <th scope="col" className="px-4 py-3">Cliente</th>
                                        <th scope="col" className="px-4 py-3">Teléfono</th>
                                        <th scope="col" className="px-4 py-3">Total</th>
                                        <th scope="col" className="px-4 py-3">Estado</th>
                                        <th scope="col" className="px-4 py-3">Fecha</th>
                                        <th scope="col" className="px-4 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-borde">
                                    {paginado.elementos.map((pedido) => {
                                        const estado = ESTADOS_PEDIDO.find((opcion) => opcion.valor === pedido.estado);
                                        const expandido = pedidoAbierto === pedido.id;
                                        return (
                                            <Fragment key={pedido.id}>
                                                <tr className="bg-fondo/60">
                                                    <td className="px-4 py-3">
                                                        <button type="button" aria-expanded={expandido} aria-controls={`detalle-pedido-${pedido.id}`} onClick={() => setPedidoAbierto(expandido ? "" : pedido.id)} className="inline-flex min-h-10 items-center gap-2 font-semibold text-marca hover:underline">
                                                            {codigoPedido(pedido.numero)}<ChevronDown size={16} className={expandido ? "rotate-180 transition-transform" : "transition-transform"} aria-hidden="true" />
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-white">{pedido.clienteNombre}</td>
                                                    <td className="px-4 py-3 tabular-nums">{pedido.clienteTelefono}</td>
                                                    <td className="px-4 py-3 font-semibold tabular-nums">{formatearPesos(pedido.total)}</td>
                                                    <td className="px-4 py-3"><EtiquetaEstadoPedido estado={pedido.estado} /></td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">{formatearFechaHora(pedido.creadoEn)}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {(estado?.siguientes ?? []).map((siguiente) => (
                                                                <button key={siguiente} type="button" disabled={Boolean(ocupadoId)} onClick={() => cambiarEstado(pedido, siguiente)} className={`min-h-10 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-50 ${siguiente === "cancelado" ? "border border-red-500/30 text-red-300 hover:bg-red-500/10" : "boton-secundario"}`}>
                                                                    {ETIQUETAS_ACCION[siguiente]}
                                                                </button>
                                                            ))}
                                                            {(estado?.siguientes ?? []).length === 0 && <span className="text-xs text-slate-500">Sin acciones</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr hidden={!expandido}>
                                                    <td colSpan={7} className="bg-tarjeta/50 px-4 py-5">
                                                        <DetallePedido pedido={pedido} />
                                                    </td>
                                                </tr>
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </ResultadosPaginados>
                </>
            )}
        </>
    );
};

export default PedidosTienda;
