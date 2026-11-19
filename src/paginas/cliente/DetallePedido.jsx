import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { obtenerDetalleMiPedido } from "../../api/pedidos.js";
import Aviso from "../../componentes/Aviso.jsx";
import BotonPagarWompi from "../../componentes/tienda/BotonPagarWompi.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import { visualPago } from "../../datos/estadosPago.js";
import { formatearFechaHora, formatearPesos } from "../../utilidades/formato.js";

const DetallePedidoCliente = () => {
    const { id } = useParams();
    const [resultado, setResultado] = useState({ id: "", pedido: null, error: "" });
    const cargando = resultado.id !== id;
    const pedido = cargando ? null : resultado.pedido;
    const error = cargando ? "" : resultado.error;

    useEffect(() => {
        let vigente = true;
        obtenerDetalleMiPedido(id)
            .then((respuesta) => vigente && setResultado({ id, pedido: respuesta, error: "" }))
            .catch((errorApi) => vigente && setResultado({ id, pedido: null, error: errorApi.message || "No se pudo cargar este pedido." }));
        return () => { vigente = false; };
    }, [id]);

    const puedePagar = pedido?.estadoPedido === "pendiente" && pedido?.estadoPago !== "APPROVED";

    return (
        <>
            <EncabezadoPagina
                titulo={pedido ? `Pedido #${pedido.numero}` : "Detalle del pedido"}
                descripcion={pedido ? `Registrado el ${formatearFechaHora(pedido.creadoEn)} · Estado: ${pedido.estadoPedido}` : "Consulta los productos y datos de entrega de tu compra."}
            >
                <Link to="/cliente/pedidos" className="boton-secundario"><ArrowLeft size={16} aria-hidden="true" /> Mis pedidos</Link>
            </EncabezadoPagina>
            <Aviso texto={error} tipo="error" />
            {cargando && <Skeleton tipo="fila" cantidad={3} etiqueta="Cargando el pedido" />}
            {!cargando && pedido && (
                <div className="space-y-6">
                    {puedePagar && (
                        <section className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
                            <h2 className="mb-3 font-semibold text-white">Pedido pendiente de pago</h2>
                            <BotonPagarWompi idPedido={pedido.pedidoId} />
                        </section>
                    )}

                    <section className="rounded-xl border border-borde bg-tarjeta p-5">
                        <h2 className="mb-3 font-semibold text-white">Productos</h2>
                        <ul className="divide-y divide-borde">
                            {pedido.productos.map((producto, indice) => (
                                <li key={`${producto.nombre}-${indice}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                                    <span className="text-white">{producto.nombre} <span className="text-slate-400">× {producto.cantidad}</span></span>
                                    <span className="tabular-nums text-slate-300">{formatearPesos(producto.precioUnitario)} c/u</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 flex justify-between border-t border-borde pt-4 font-semibold text-white">
                            <span>Total</span><span className="tabular-nums">{formatearPesos(pedido.total)}</span>
                        </div>
                    </section>

                    <section className="rounded-xl border border-borde bg-tarjeta p-5">
                        <h2 className="mb-3 font-semibold text-white">Datos de entrega</h2>
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            <div><dt className="text-slate-400">Dirección</dt><dd className="mt-1 text-white">{pedido.entrega.direccion || "No registrada"}</dd></div>
                            <div><dt className="text-slate-400">Ciudad</dt><dd className="mt-1 text-white">{pedido.entrega.ciudad || "No registrada"}</dd></div>
                            <div><dt className="text-slate-400">Departamento</dt><dd className="mt-1 text-white">{pedido.entrega.departamento || "No registrado"}</dd></div>
                            <div><dt className="text-slate-400">País</dt><dd className="mt-1 text-white">{pedido.entrega.pais || "CO"}</dd></div>
                            <div><dt className="text-slate-400">Teléfono de quien recibe</dt><dd className="mt-1 text-white">{pedido.entrega.telefonoReceptor || "No registrado"}</dd></div>
                        </dl>
                    </section>

                    <p className="flex items-center gap-2 text-sm text-slate-400"><PackageCheck size={17} aria-hidden="true" />Estado del pago: {visualPago(pedido.estadoPago).etiqueta}</p>
                </div>
            )}
        </>
    );
};

export default DetallePedidoCliente;
