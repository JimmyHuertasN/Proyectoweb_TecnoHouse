import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { obtenerMisPedidos } from "../../api/pedidos.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import { formatearFechaHora, formatearPesos } from "../../utilidades/formato.js";

const ETIQUETAS_PEDIDO = {
    pendiente: "Pendiente de pago",
    confirmado: "Confirmado",
    entregado: "Entregado",
    cancelado: "Cancelado",
};

const MisPedidos = () => {
    const [pagina, setPagina] = useState(1);
    const [resultado, setResultado] = useState({ pagina: 0, datos: null, error: "" });
    const cargando = resultado.pagina !== pagina;
    const datos = cargando ? null : resultado.datos;
    const error = cargando ? "" : resultado.error;

    useEffect(() => {
        let vigente = true;
        obtenerMisPedidos(pagina, 10)
            .then((respuesta) => vigente && setResultado({ pagina, datos: respuesta, error: "" }))
            .catch((errorApi) => vigente && setResultado({ pagina, datos: null, error: errorApi.message || "No se pudieron cargar tus pedidos." }));
        return () => { vigente = false; };
    }, [pagina]);

    return (
        <>
            <EncabezadoPagina titulo="Mis pedidos" descripcion="Consulta tus compras, su estado y los pagos asociados." />
            <Aviso texto={error} tipo="error" />
            {cargando && <Skeleton tipo="fila" cantidad={4} etiqueta="Cargando tus pedidos" />}
            {!cargando && !error && datos?.items?.length === 0 && (
                <EstadoVacio
                    icono={PackageSearch}
                    titulo="Todavía no tienes pedidos"
                    descripcion="Cuando realices una compra, aquí podrás consultar su estado y continuar al pago."
                >
                    <Link to="/tienda" className="boton-primario">Ir a la tienda</Link>
                </EstadoVacio>
            )}
            {!cargando && !error && datos?.items?.length > 0 && (
                <>
                    <ul className="space-y-3">
                        {datos.items.map((pedido) => (
                            <li key={pedido.pedidoId} className="rounded-xl border border-borde bg-tarjeta p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
                                <div>
                                    <p className="font-semibold text-white">Pedido #{pedido.numero}</p>
                                    <p className="mt-1 text-sm text-slate-400">{formatearFechaHora(pedido.creadoEn)}</p>
                                    <p className="mt-2 text-sm text-slate-300">
                                        {ETIQUETAS_PEDIDO[pedido.estadoPedido] ?? pedido.estadoPedido}
                                        {pedido.estadoPago ? ` · Pago ${pedido.estadoPago}` : " · Sin intento de pago"}
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-4 sm:mt-0 sm:justify-end">
                                    <span className="font-semibold text-white tabular-nums">{formatearPesos(pedido.total)}</span>
                                    <Link to={`/cliente/pedidos/${encodeURIComponent(pedido.pedidoId)}`} className="boton-secundario">Ver detalle</Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <nav className="mt-5 flex items-center justify-between" aria-label="Paginación de pedidos">
                        <button type="button" disabled={pagina <= 1 || cargando} onClick={() => setPagina((actual) => actual - 1)} className="boton-secundario disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
                        <span className="text-sm text-slate-400">Página {datos.page} de {Math.max(datos.totalPages, 1)} · {datos.total} pedidos</span>
                        <button type="button" disabled={pagina >= datos.totalPages || cargando} onClick={() => setPagina((actual) => actual + 1)} className="boton-secundario disabled:cursor-not-allowed disabled:opacity-50">Siguiente</button>
                    </nav>
                </>
            )}
        </>
    );
};

export default MisPedidos;
