import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, PackageSearch, Pencil, Plus } from "lucide-react";
import { ajustarStock, fijarStock, obtenerTodosLosProductos } from "../../api/productos.js";
import Aviso from "../../componentes/Aviso.jsx";
import ImagenProducto from "../../componentes/ImagenProducto.jsx";
import BarraFiltros from "../../componentes/panel/BarraFiltros.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import GraficoBarras from "../../componentes/panel/GraficoBarras.jsx";
import ResultadosPaginados from "../../componentes/panel/ResultadosPaginados.jsx";
import ResumenInventario from "../../componentes/panel/ResumenInventario.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import EtiquetaStock from "../../componentes/tienda/EtiquetaStock.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { useFiltroPaginado } from "../../hooks/useFiltroPaginado.js";
import useToast from "../../hooks/useToast.js";
import { coincideTexto } from "../../utilidades/filtros.js";
import { estadoStock, POCAS_UNIDADES, stockPorCategoria } from "../../utilidades/inventario.js";
import { rutaTienda } from "../../utilidades/rutas.js";

const FILTROS_VACIOS = { texto: "", estado: "todos", categoria: "todas" };

const cumpleFiltrosInventario = (producto, { texto, estado, categoria }) =>
    (estado === "todos" || estadoStock(producto.stock) === estado) &&
    (categoria === "todas" || producto.categoria === categoria) &&
    coincideTexto(texto, [producto.nombre, producto.categoria]);

const opcionesStock = (productos) => {
    const contar = (estado) => productos.filter((producto) => estadoStock(producto.stock) === estado).length;
    return [
        { valor: "todos", etiqueta: `Todos (${productos.length})` },
        { valor: "agotado", etiqueta: `Agotados (${contar("agotado")})` },
        { valor: "pocas", etiqueta: `Pocas unidades (${contar("pocas")})` },
        { valor: "disponible", etiqueta: `Disponibles (${contar("disponible")})` },
    ];
};

const opcionesCategoria = (productos) => [
    { valor: "todas", etiqueta: "Todas las categorías" },
    ...[...new Set(productos.map((producto) => producto.categoria))]
        .sort((categoriaA, categoriaB) => categoriaA.localeCompare(categoriaB))
        .map((categoria) => ({ valor: categoria, etiqueta: categoria })),
];

const CLASE_AJUSTE = "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-borde text-slate-300 transition hover:border-marca hover:text-marca disabled:cursor-not-allowed disabled:opacity-40";

/*
    Controles de stock de un producto: − y + suman o restan sobre el valor real de la base, y el
    campo pone una cantidad exacta solo si nadie la cambió desde que se cargó la lista.
    La "key" del padre incluye el stock: al recargar, el campo vuelve al valor nuevo.
*/
const ControlStock = ({ producto, ocupado, alAjustar, alFijar }) => {
    const [cantidad, setCantidad] = useState(String(producto.stock));
    const cambiado = cantidad !== String(producto.stock);
    const idCampo = `stock-${producto.id}`;

    const guardar = (evento) => {
        evento.preventDefault();
        alFijar(producto, cantidad.trim());
    };

    return (
        <form onSubmit={guardar} noValidate className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={ocupado || producto.stock === 0} onClick={() => alAjustar(producto, -1)} aria-label={`Restar una unidad a ${producto.nombre}`} className={CLASE_AJUSTE}>
                <Minus size={16} aria-hidden="true" />
            </button>
            <label htmlFor={idCampo} className="sr-only">Existencias de {producto.nombre}</label>
            <input
                id={idCampo}
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={cantidad}
                disabled={ocupado}
                onChange={(evento) => setCantidad(evento.target.value)}
                className="campo w-20 text-center tabular-nums"
            />
            <button type="button" disabled={ocupado} onClick={() => alAjustar(producto, 1)} aria-label={`Sumar una unidad a ${producto.nombre}`} className={CLASE_AJUSTE}>
                <Plus size={16} aria-hidden="true" />
            </button>
            {cambiado && (
                <button type="submit" disabled={ocupado} className="boton-primario px-3 disabled:cursor-wait disabled:opacity-60">
                    Guardar
                </button>
            )}
        </form>
    );
};

const Inventario = () => {
    const { usuario } = useSesion();
    const toast = useToast();
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    // Id del producto con un cambio en curso: evita enviar dos cambios seguidos del mismo producto.
    const [ocupadoId, setOcupadoId] = useState("");
    const [recargas, setRecargas] = useState(0);
    const paginado = useFiltroPaginado(productos, cumpleFiltrosInventario, FILTROS_VACIOS, 12);

    useEffect(() => {
        let vigente = true;

        obtenerTodosLosProductos()
            .then((lista) => vigente && setProductos(lista))
            .catch((errorApi) => vigente && setError(errorApi.message || "No se pudo cargar el inventario."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [recargas]);

    // Después de cada intento se recarga la lista: así se ve el stock real aunque otra persona lo haya cambiado.
    const ejecutar = async (producto, accion) => {
        setOcupadoId(producto.id);
        try {
            const stock = await accion();
            toast.exito(`Stock de ${producto.nombre}: ${stock}.`);
        } catch (errorApi) {
            toast.error(errorApi.message);
        } finally {
            setRecargas((anterior) => anterior + 1);
            setOcupadoId("");
        }
    };

    const ajustar = (producto, cambio) => ejecutar(producto, () => ajustarStock(producto.id, cambio));

    // "texto" es lo escrito en el campo; la base vuelve a validar que sea un entero de 0 o más.
    const fijar = (producto, texto) => {
        if (!/^\d+$/.test(texto)) {
            toast.error("Escribe un número entero, 0 o mayor.");
            return;
        }
        ejecutar(producto, () => fijarStock(producto.id, Number(texto), producto.stock));
    };

    const categorias = stockPorCategoria(productos);

    return (
        <>
            <EncabezadoPagina
                titulo="Inventario"
                descripcion={`Existencias de todos los productos. Con ${POCAS_UNIDADES} unidades o menos un producto activo queda por reponer.`}
            >
                <button type="button" onClick={() => setRecargas((anterior) => anterior + 1)} className="boton-secundario">
                    ↻ Actualizar
                </button>
            </EncabezadoPagina>

            <Aviso texto={error} tipo="error" />

            {cargando && productos.length === 0 && <Skeleton tipo="fila" cantidad={5} etiqueta="Cargando inventario" />}

            {!cargando && !error && productos.length === 0 && (
                <EstadoVacio icono={PackageSearch} titulo="Todavía no hay productos" descripcion="Crea productos en la sección Productos para controlar su inventario aquí.">
                    <Link to={rutaTienda(usuario.rol, "catalogo")} className="boton-primario">Ir a productos</Link>
                </EstadoVacio>
            )}

            {productos.length > 0 && (
                <>
                    <ResumenInventario productos={productos} />

                    <section aria-labelledby="titulo-existencias" className="mb-10">
                        <h2 id="titulo-existencias" className="mb-4 text-xl font-bold">Existencias</h2>

                        <BarraFiltros
                            id="inventario"
                            etiqueta="Filtrar inventario"
                            placeholder="Nombre o categoría"
                            paginado={paginado}
                            opcionesEstado={opcionesStock(productos)}
                            opcionesCategoria={opcionesCategoria(productos)}
                        />

                        <ResultadosPaginados id="inventario" paginado={paginado}>
                            <ul className="divide-y divide-borde rounded-xl border border-borde">
                                {paginado.elementos.map((producto) => (
                                    <li key={producto.id} className={`grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center ${producto.activo ? "" : "opacity-70"}`}>
                                        <div className="flex min-w-0 items-center gap-3">
                                            <ImagenProducto url={producto.imagenUrl} className="size-12 shrink-0 rounded-lg border border-borde" />
                                            <div className="min-w-0">
                                                <p className="font-medium break-words text-white">{producto.nombre}</p>
                                                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                                                    <span>{producto.categoria}</span>
                                                    <span>{producto.activo ? "Activo" : "Inactivo (oculto en la tienda)"}</span>
                                                    <EtiquetaStock stock={producto.stock} />
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <ControlStock
                                                key={`${producto.id}-${producto.stock}`}
                                                producto={producto}
                                                ocupado={ocupadoId === producto.id}
                                                alAjustar={ajustar}
                                                alFijar={fijar}
                                            />
                                            <Link
                                                to={`${rutaTienda(usuario.rol, "catalogo")}?editar=${producto.id}`}
                                                aria-label={`Editar ${producto.nombre}`}
                                                className="boton-secundario px-3"
                                            >
                                                <Pencil size={15} aria-hidden="true" /> Editar
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </ResultadosPaginados>
                    </section>

                    <section aria-labelledby="titulo-por-categoria" className="tarjeta">
                        <h2 id="titulo-por-categoria" className="mb-1 text-lg font-semibold">Stock por categoría</h2>
                        <p className="mb-5 text-sm text-slate-400">Unidades disponibles de los productos activos</p>
                        {categorias.length > 0 ? (
                            <GraficoBarras
                                etiquetaAria="Stock por categoría"
                                datos={categorias.map(({ categoria, unidades }) => ({
                                    clave: categoria,
                                    etiqueta: categoria,
                                    valor: unidades,
                                    descripcion: `${categoria}: ${unidades} unidades`,
                                }))}
                            />
                        ) : (
                            <p className="text-sm text-slate-400">No hay productos activos.</p>
                        )}
                    </section>
                </>
            )}
        </>
    );
};

export default Inventario;
