import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Boxes, PackageSearch, PackageX, ShoppingCart, Store, Wallet } from "lucide-react";
import { obtenerPedidos } from "../../api/pedidos.js";
import { obtenerTodosLosProductos } from "../../api/productos.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import SelectorRangoFechas from "../../componentes/panel/admin/SelectorRangoFechas.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import TarjetaMetrica from "../../componentes/panel/TarjetaMetrica.jsx";
import EtiquetaEstadoPedido from "../../componentes/panel/tienda/EtiquetaEstadoPedido.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { ESTADOS_PEDIDO } from "../../datos/estadosPedido.js";
import { useRangoFechas } from "../../hooks/useRangoFechas.js";
import { codigoPedido, formatearFechaHora, formatearPesos, primerNombre } from "../../utilidades/formato.js";
import { resumenInventario } from "../../utilidades/inventario.js";
import { pedidosEntregadosEnRango, sumarTotales } from "../../utilidades/reportesTienda.js";
import { rutaTienda } from "../../utilidades/rutas.js";

const PEDIDOS_RECIENTES = 5;

const ACCESOS = [
    { seccion: "catalogo", titulo: "Productos", descripcion: "Crea, edita y activa productos con sus fotos.", icono: Store },
    { seccion: "inventario", titulo: "Inventario", descripcion: "Ajusta existencias y revisa qué reponer.", icono: PackageSearch },
    { seccion: "pedidos", titulo: "Pedidos", descripcion: "Confirma, entrega o cancela pedidos.", icono: ShoppingCart },
];

/* Página principal del gestor de tienda: estado actual de productos y pedidos, e ingresos del periodo. */
const ResumenGestor = () => {
    const { usuario } = useSesion();
    const rango = useRangoFechas("30d");
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState("");
    const [recargas, setRecargas] = useState(0);

    useEffect(() => {
        let vigente = true;

        Promise.all([obtenerTodosLosProductos(), obtenerPedidos()])
            .then(([productos, pedidos]) => {
                if (!vigente) return;
                setDatos({ productos, pedidos });
                setError("");
            })
            .catch((errorApi) => vigente && setError(errorApi.message || "No se pudo cargar el resumen de la tienda."));

        return () => {
            vigente = false;
        };
    }, [recargas]);

    const inventario = datos && resumenInventario(datos.productos);
    const contarPedidos = (estado) => datos.pedidos.filter((pedido) => pedido.estado === estado).length;
    const entregados = datos ? pedidosEntregadosEnRango(datos.pedidos, rango.desde, rango.hasta) : [];

    return (
        <>
            <EncabezadoPagina titulo={`Hola, ${primerNombre(usuario.nombre)}`} descripcion="Así está la tienda en este momento.">
                <button type="button" onClick={() => setRecargas((anterior) => anterior + 1)} className="boton-secundario">
                    ↻ Actualizar
                </button>
            </EncabezadoPagina>

            <Aviso texto={error} tipo="error" />
            {!datos && !error && <Skeleton tipo="metrica" cantidad={4} etiqueta="Cargando resumen de la tienda" />}

            {datos && (
                <>
                    <section aria-labelledby="titulo-productos" className="mb-8">
                        <h2 id="titulo-productos" className="mb-4 text-xl font-bold">Productos</h2>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                            <TarjetaMetrica icono={Boxes} titulo="Productos" valor={inventario.total} detalle={`${inventario.activos} activos · ${inventario.inactivos} inactivos`} />
                            <TarjetaMetrica icono={PackageX} titulo="Agotados" valor={inventario.agotados} detalle="Activos sin unidades" />
                            <TarjetaMetrica icono={AlertTriangle} titulo="Pocas unidades" valor={inventario.pocoStock} detalle="Activos por reponer" />
                            <TarjetaMetrica icono={Wallet} titulo="Valor del inventario" valor={formatearPesos(inventario.valor)} detalle="Precio × stock de los activos. No es un ingreso." />
                        </div>
                    </section>

                    <section aria-labelledby="titulo-ventas" className="mb-8">
                        <h2 id="titulo-ventas" className="mb-4 text-xl font-bold">Ventas</h2>
                        <SelectorRangoFechas id="resumen-gestor" rango={rango} />

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                            <article className="tarjeta border-marca/40 bg-gradient-to-br from-marca/10 to-tarjeta lg:col-span-1">
                                <h3 className="text-sm font-medium text-slate-400">Ingresos por pedidos entregados</h3>
                                <p className="mt-3 text-4xl font-semibold tracking-tight text-white tabular-nums">{formatearPesos(sumarTotales(entregados))}</p>
                                <p className="mt-2 text-sm text-slate-400">
                                    {entregados.length} {entregados.length === 1 ? "pedido entregado" : "pedidos entregados"} en el periodo. Pendientes y confirmados no cuentan hasta entregarse.
                                </p>
                            </article>
                            <TarjetaMetrica icono={ESTADOS_PEDIDO[0].icono} titulo="Pedidos pendientes" valor={contarPedidos("pendiente")} detalle="Esperan confirmación" />
                            <TarjetaMetrica icono={ESTADOS_PEDIDO[1].icono} titulo="Pedidos confirmados" valor={contarPedidos("confirmado")} detalle="Por entregar" />
                        </div>
                    </section>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <section aria-labelledby="titulo-recientes" className="tarjeta lg:col-span-3">
                            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                                <h2 id="titulo-recientes" className="text-lg font-semibold">Pedidos recientes</h2>
                                <Link to={rutaTienda(usuario.rol, "pedidos")} className="enlace inline-flex items-center gap-1 text-sm font-semibold">
                                    Ver todos <ArrowRight size={14} aria-hidden="true" />
                                </Link>
                            </div>
                            {datos.pedidos.length === 0 ? (
                                <p className="text-sm text-slate-400">Todavía no hay pedidos.</p>
                            ) : (
                                <ul className="divide-y divide-borde">
                                    {datos.pedidos.slice(0, PEDIDOS_RECIENTES).map((pedido) => (
                                        <li key={pedido.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 text-sm">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-white">{codigoPedido(pedido.numero)} · <span className="font-normal text-slate-300">{pedido.clienteNombre}</span></p>
                                                <p className="text-xs text-slate-500">{formatearFechaHora(pedido.creadoEn)}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold tabular-nums">{formatearPesos(pedido.total)}</span>
                                                <EtiquetaEstadoPedido estado={pedido.estado} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <nav aria-labelledby="titulo-accesos" className="lg:col-span-2">
                            <h2 id="titulo-accesos" className="sr-only">Accesos rápidos</h2>
                            <ul className="space-y-3">
                                {ACCESOS.map(({ seccion, titulo, descripcion, icono: Icono }) => (
                                    <li key={seccion}>
                                        <Link to={rutaTienda(usuario.rol, seccion)} className="tarjeta flex items-center gap-4 transition hover:border-marca/60">
                                            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-marca/15 text-marca">
                                                <Icono size={20} aria-hidden="true" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block font-semibold text-white">{titulo}</span>
                                                <span className="block text-sm text-slate-400">{descripcion}</span>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </>
            )}
        </>
    );
};

export default ResumenGestor;
