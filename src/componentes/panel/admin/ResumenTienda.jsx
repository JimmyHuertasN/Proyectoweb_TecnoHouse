import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { obtenerPedidos } from "../../../api/pedidos.js";
import { obtenerProductosAdmin } from "../../../api/productos.js";
import { ESTADOS_PEDIDO } from "../../../datos/estadosPedido.js";
import { stockPorCategoria } from "../../../utilidades/inventario.js";
import Aviso from "../../Aviso.jsx";
import GraficoBarras from "../GraficoBarras.jsx";
import ResumenInventario from "../ResumenInventario.jsx";
import Skeleton from "../Skeleton.jsx";

const EnlaceSeccion = ({ ruta, texto }) => (
    <Link to={ruta} className="inline-flex items-center gap-1 text-sm font-semibold text-marca hover:underline">
        {texto} <ArrowRight size={14} aria-hidden="true" />
    </Link>
);

/*
    Sección "Tienda" del dashboard. Muestra el estado actual del inventario, así que
    no depende del periodo elegido arriba. "recargas" la vuelve a cargar con ↻ Actualizar.
*/
const ResumenTienda = ({ recargas }) => {
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let vigente = true;

        Promise.all([obtenerProductosAdmin(), obtenerPedidos()])
            .then(([productos, pedidos]) => vigente && setDatos({ productos, pedidos }))
            .catch((errorApi) => vigente && setError(errorApi.message || "No se pudieron cargar los datos de la tienda."));

        return () => {
            vigente = false;
        };
    }, [recargas]);

    const contarPedidos = (estado) => datos.pedidos.filter((pedido) => pedido.estado === estado).length;

    return (
        <section aria-labelledby="titulo-resumen-tienda" className="mt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 id="titulo-resumen-tienda" className="text-xl font-bold">Tienda</h2>
                    <p className="text-sm text-slate-400">Estado actual del inventario y de los pedidos.</p>
                </div>
                <EnlaceSeccion ruta="/admin/catalogo" texto="Gestionar productos" />
            </div>

            <Aviso texto={error} tipo="error" />
            {!datos && !error && <Skeleton tipo="metrica" cantidad={3} etiqueta="Cargando datos de la tienda" />}

            {datos && (
                <>
                    <ResumenInventario productos={datos.productos} />

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <section className="tarjeta lg:col-span-3">
                            <h3 className="mb-1 text-lg font-semibold">Stock por categoría</h3>
                            <p className="mb-5 text-sm text-slate-400">Unidades disponibles de los productos activos</p>
                            {datos.productos.length > 0 ? (
                                <GraficoBarras
                                    etiquetaAria="Stock por categoría"
                                    datos={stockPorCategoria(datos.productos).map(({ categoria, unidades }) => ({
                                        clave: categoria,
                                        etiqueta: categoria,
                                        valor: unidades,
                                        descripcion: `${categoria}: ${unidades} unidades`,
                                    }))}
                                />
                            ) : (
                                <p className="text-sm text-slate-400">Todavía no hay productos en la tienda.</p>
                            )}
                        </section>

                        <section className="tarjeta lg:col-span-2">
                            <h3 className="mb-1 text-lg font-semibold">Pedidos</h3>
                            <p className="mb-5 text-sm text-slate-400">Pedidos del carrito por estado</p>
                            <ul className="space-y-3">
                                {ESTADOS_PEDIDO.map(({ valor, etiqueta, icono: Icono }) => (
                                    <li key={valor} className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-slate-300">
                                            <Icono size={16} className="text-marca" aria-hidden="true" /> {etiqueta}
                                        </span>
                                        <span className="font-semibold tabular-nums">{contarPedidos(valor)}</span>
                                    </li>
                                ))}
                            </ul>
                            {/* PENDIENTE BASE: los conteos se llenan cuando exista la tabla "pedidos". */}
                            <p className="mt-5 text-xs text-slate-500">Pendiente: los pedidos se registrarán cuando la base tenga la tabla de pedidos.</p>
                            <div className="mt-3"><EnlaceSeccion ruta="/admin/pedidos" texto="Ver pedidos" /></div>
                        </section>
                    </div>
                </>
            )}
        </section>
    );
};

export default ResumenTienda;
