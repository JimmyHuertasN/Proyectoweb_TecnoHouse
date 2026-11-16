import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ShoppingBag } from "lucide-react";
import Aviso from "../../componentes/Aviso.jsx";
import BotonPagarWompi from "../../componentes/tienda/BotonPagarWompi.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import { obtenerMisPedidos } from "../../api/pedidos.js";
import { enlaceWhatsApp, whatsappConfigurado } from "../../utilidades/whatsapp.js";
import { formatearFechaHora, formatearPesos } from "../../utilidades/formato.js";

const TAMANO_PAGINA = 20;

const ESTADOS_PEDIDO = {
    pendiente: { etiqueta: "Pendiente", clases: "bg-amber-500/15 text-amber-300" },
    confirmado: { etiqueta: "Confirmado", clases: "bg-sky-500/15 text-sky-300" },
    entregado: { etiqueta: "Entregado", clases: "bg-emerald-500/15 text-emerald-300" },
    cancelado: { etiqueta: "Cancelado", clases: "bg-slate-500/20 text-slate-300" },
};

const ESTADOS_PAGO = {
    PENDING: { etiqueta: "Pendiente", clases: "bg-amber-500/15 text-amber-300" },
    APPROVED: { etiqueta: "Aprobado", clases: "bg-emerald-500/15 text-emerald-300" },
    DECLINED: { etiqueta: "Rechazado", clases: "bg-red-500/15 text-red-300" },
    VOIDED: { etiqueta: "Anulado", clases: "bg-slate-500/20 text-slate-300" },
    ERROR: { etiqueta: "Error", clases: "bg-red-500/15 text-red-300" },
};

const EtiquetaEstado = ({ etiqueta, clases }) => (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${clases}`}>{etiqueta}</span>
);

const FilaPedido = ({ pedido }) => {
    const estadoPedido = String(pedido.estadoPedido ?? "").toLowerCase();
    const estadoPago = pedido.estadoPago ? String(pedido.estadoPago).toUpperCase() : null;
    const visualPedido = ESTADOS_PEDIDO[estadoPedido]
        ?? { etiqueta: pedido.estadoPedido || "Desconocido", clases: "bg-slate-500/20 text-slate-300" };
    const visualPago = estadoPago
        ? ESTADOS_PAGO[estadoPago] ?? { etiqueta: estadoPago, clases: "bg-slate-500/20 text-slate-300" }
        : { etiqueta: "Sin iniciar", clases: "bg-slate-500/20 text-slate-300" };
    const puedePagar = estadoPedido === "pendiente"
        && (estadoPago === null || ["PENDING", "DECLINED", "ERROR"].includes(estadoPago));

    return (
        <li className="rounded-2xl border border-borde bg-tarjeta p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-white">Pedido #{pedido.numero}</h2>
                    <p className="mt-1 text-sm text-slate-400">{formatearFechaHora(pedido.creadoEn)}</p>
                </div>
                <p className="text-lg font-bold tabular-nums text-white">{formatearPesos(pedido.total)}</p>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/5 bg-fondo p-3">
                    <dt className="mb-2 text-xs text-slate-400">Estado del pedido</dt>
                    <dd><EtiquetaEstado {...visualPedido} /></dd>
                </div>
                <div className="rounded-lg border border-white/5 bg-fondo p-3">
                    <dt className="mb-2 text-xs text-slate-400">Estado del pago</dt>
                    <dd><EtiquetaEstado {...visualPago} /></dd>
                </div>
            </dl>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                {puedePagar && (
                    <div className="min-w-48">
                        {/* Abre el widget sobre TecnoHouse; la respuesta del widget no confirma el pago. */}
                        <BotonPagarWompi idPedido={pedido.pedidoId} />
                    </div>
                )}
                {whatsappConfigurado && (
                    <a
                        href={enlaceWhatsApp(`Hola, necesito ayuda con mi pedido #${pedido.numero} de TecnoHouse.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="boton-secundario"
                    >
                        <MessageCircle size={17} aria-hidden="true" /> Ayuda por WhatsApp
                    </a>
                )}
            </div>
        </li>
    );
};

const MisPedidos = () => {
    const [pagina, setPagina] = useState(1);
    const [resultado, setResultado] = useState(null);
    const [errorCarga, setErrorCarga] = useState(null);
    const error = errorCarga?.pagina === pagina ? errorCarga.mensaje : "";
    const datos = resultado?.page === pagina ? resultado : null;
    const cargando = !datos && !error;

    useEffect(() => {
        let vigente = true;
        obtenerMisPedidos({ page: pagina, pageSize: TAMANO_PAGINA })
            .then((respuesta) => {
                if (vigente) {
                    setResultado(respuesta);
                    setErrorCarga(null);
                }
            })
            .catch((errorApi) => {
                if (vigente) {
                    setErrorCarga({ pagina, mensaje: errorApi.message || "No se pudieron cargar tus pedidos." });
                }
            });

        return () => { vigente = false; };
    }, [pagina]);

    const pedidos = datos?.items ?? [];

    return (
        <>
            <EncabezadoPagina titulo="Mis pedidos" descripcion="Consulta tus compras y el estado del pedido y del pago." />
            <Aviso texto={error} tipo="error" />
            {cargando && <Skeleton tipo="fila" cantidad={4} etiqueta="Cargando tus pedidos" />}

            {!cargando && !error && pedidos.length === 0 && (
                <EstadoVacio
                    icono={ShoppingBag}
                    titulo="Aún no tienes pedidos"
                    descripcion="Cuando confirmes una compra, aparecerá aquí con el estado del pedido y del pago."
                >
                    <Link to="/tienda" className="boton-primario">Explorar la tienda</Link>
                </EstadoVacio>
            )}

            {!cargando && !error && pedidos.length > 0 && (
                <>
                    <ul className="space-y-3" aria-label="Historial de pedidos">
                        {pedidos.map((pedido) => <FilaPedido key={pedido.pedidoId} pedido={pedido} />)}
                    </ul>
                    {datos.totalPages > 1 && (
                        <nav aria-label="Paginación de pedidos" className="mt-6 flex items-center justify-between gap-4">
                            <button type="button" disabled={pagina <= 1 || cargando} onClick={() => setPagina((actual) => actual - 1)} className="boton-secundario disabled:cursor-not-allowed disabled:opacity-50">
                                Anterior
                            </button>
                            <p className="text-sm text-slate-400">Página {datos.page} de {datos.totalPages}</p>
                            <button type="button" disabled={pagina >= datos.totalPages || cargando} onClick={() => setPagina((actual) => actual + 1)} className="boton-secundario disabled:cursor-not-allowed disabled:opacity-50">
                                Siguiente
                            </button>
                        </nav>
                    )}
                </>
            )}
        </>
    );
};

export default MisPedidos;
