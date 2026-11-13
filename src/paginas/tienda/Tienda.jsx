import { useMemo, useState } from "react";
import { MessageCircle, SearchX, ShieldCheck, Wrench } from "lucide-react";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import TarjetaProductoTienda from "../../componentes/tienda/TarjetaProductoTienda.jsx";
import useTienda from "../../hooks/useTienda.js";
import { coincideTexto } from "../../utilidades/filtros.js";

const BENEFICIOS = [
    { Icono: MessageCircle, titulo: "Pide por WhatsApp", texto: "Arma tu carrito y envíanos el pedido." },
    { Icono: ShieldCheck, titulo: "Stock real", texto: "Solo mostramos productos a la venta." },
    { Icono: Wrench, titulo: "¿Lo instalamos?", texto: "Nuestros técnicos pueden hacerlo." },
];

/* Cada opción del selector "Ordenar por" con su forma de comparar dos productos. */
const ORDENES = {
    // PENDIENTE BASE: con la columna "destacado", poner primero los productos destacados.
    destacados: { etiqueta: "Destacados", comparar: () => 0 },
    "precio-menor": { etiqueta: "Precio: menor a mayor", comparar: (productoA, productoB) => productoA.precio - productoB.precio },
    "precio-mayor": { etiqueta: "Precio: mayor a menor", comparar: (productoA, productoB) => productoB.precio - productoA.precio },
    nombre: { etiqueta: "Nombre (A-Z)", comparar: (productoA, productoB) => productoA.nombre.localeCompare(productoB.nombre) },
    recientes: { etiqueta: "Más recientes", comparar: (productoA, productoB) => new Date(productoB.creadoEn) - new Date(productoA.creadoEn) },
};

const FILTROS_VACIOS = { texto: "", categoria: "todas", orden: "destacados", soloDisponibles: false };

const BotonCategoria = ({ activa, alElegir, children }) => (
    <button
        type="button"
        onClick={alElegir}
        aria-pressed={activa}
        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${activa ? "bg-marca/15 font-semibold text-marca" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
    >
        {children}
    </button>
);

const Tienda = () => {
    const { productos, cargando, error } = useTienda();
    const [filtros, setFiltros] = useState(FILTROS_VACIOS);

    // Cuántos productos hay en cada categoría, para mostrarlo junto al nombre.
    const categorias = useMemo(() => {
        const conteo = {};
        productos.forEach((producto) => {
            conteo[producto.categoria] = (conteo[producto.categoria] ?? 0) + 1;
        });
        return Object.keys(conteo)
            .sort((categoriaA, categoriaB) => categoriaA.localeCompare(categoriaB))
            .map((nombre) => ({ nombre, cantidad: conteo[nombre] }));
    }, [productos]);

    const visibles = useMemo(
        () =>
            productos
                .filter((producto) => filtros.categoria === "todas" || producto.categoria === filtros.categoria)
                .filter((producto) => !filtros.soloDisponibles || producto.stock > 0)
                .filter((producto) => coincideTexto(filtros.texto, [producto.nombre, producto.descripcion, producto.categoria]))
                .sort(ORDENES[filtros.orden].comparar),
        [productos, filtros]
    );

    const cambiarFiltro = (nombre, valor) => setFiltros((anteriores) => ({ ...anteriores, [nombre]: valor }));
    const hayFiltros = filtros.texto !== "" || filtros.categoria !== "todas" || filtros.soloDisponibles;

    return (
        <>
            <section aria-labelledby="titulo-tienda" className="border-b border-borde bg-gradient-to-br from-[#00aaff]/10 via-[#05060a] to-[#05060a] px-6 py-12 sm:px-[8%]">
                <div className="mx-auto max-w-6xl">
                    <p className="antetitulo">Tienda TecnoHouse</p>
                    <h1 id="titulo-tienda" className="text-3xl font-bold sm:text-4xl">Repuestos y accesorios para tus equipos</h1>
                    <p className="mt-3 max-w-2xl text-slate-400">Pantallas, baterías, cargadores y más, con el respaldo de nuestro servicio técnico.</p>

                    <ul className="mt-8 grid gap-4 sm:grid-cols-3">
                        {BENEFICIOS.map(({ Icono, titulo, texto }) => (
                            <li key={titulo} className="flex items-start gap-3 rounded-xl border border-borde bg-tarjeta/60 p-4">
                                <Icono className="mt-0.5 size-5 shrink-0 text-marca" aria-hidden="true" />
                                <div>
                                    <p className="text-sm font-semibold">{titulo}</p>
                                    <p className="text-xs text-slate-400">{texto}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:px-[4%] lg:grid-cols-[15rem_1fr] xl:px-0">
                <aside aria-label="Categorías" className="lg:sticky lg:top-24 lg:self-start">
                    <h2 className="mb-3 text-sm font-semibold tracking-wider text-white uppercase">Categorías</h2>
                    <div className="flex flex-wrap gap-1 lg:flex-col">
                        <BotonCategoria activa={filtros.categoria === "todas"} alElegir={() => cambiarFiltro("categoria", "todas")}>
                            Todas <span className="text-xs text-slate-500">{productos.length}</span>
                        </BotonCategoria>
                        {categorias.map(({ nombre, cantidad }) => (
                            <BotonCategoria key={nombre} activa={filtros.categoria === nombre} alElegir={() => cambiarFiltro("categoria", nombre)}>
                                {nombre} <span className="text-xs text-slate-500">{cantidad}</span>
                            </BotonCategoria>
                        ))}
                    </div>

                    <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                        <input type="checkbox" checked={filtros.soloDisponibles} onChange={(evento) => cambiarFiltro("soloDisponibles", evento.target.checked)} className="size-4 accent-marca" />
                        Solo disponibles
                    </label>
                </aside>

                <section aria-label="Productos">
                    <div role="search" className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <label htmlFor="tienda-texto" className="etiqueta">Buscar</label>
                            <input id="tienda-texto" type="search" className="campo" placeholder="Ej. batería, pantalla Samsung" autoComplete="off" value={filtros.texto} onChange={(evento) => cambiarFiltro("texto", evento.target.value)} />
                        </div>
                        <div className="sm:w-56">
                            <label htmlFor="tienda-orden" className="etiqueta">Ordenar por</label>
                            <select id="tienda-orden" className="campo" value={filtros.orden} onChange={(evento) => cambiarFiltro("orden", evento.target.value)}>
                                {Object.entries(ORDENES).map(([valor, { etiqueta }]) => (
                                    <option key={valor} value={valor}>{etiqueta}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {cargando && <Skeleton tipo="tarjeta" cantidad={6} etiqueta="Cargando productos" />}
                    {!cargando && error && <p className="tarjeta text-center text-slate-400" role="status">{error}</p>}
                    {!cargando && !error && productos.length === 0 && (
                        <p className="tarjeta text-center text-slate-400" role="status">Pronto publicaremos nuestros productos.</p>
                    )}

                    {!cargando && productos.length > 0 && (
                        <>
                            <p aria-live="polite" className="mb-4 text-sm text-slate-400">
                                {visibles.length} {visibles.length === 1 ? "producto" : "productos"}
                                {filtros.categoria !== "todas" && ` en ${filtros.categoria}`}
                            </p>

                            {visibles.length === 0 ? (
                                <div className="tarjeta text-center">
                                    <SearchX className="mx-auto mb-3 size-8 text-marca" aria-hidden="true" />
                                    <p className="font-medium">No hay productos con ese criterio.</p>
                                    {hayFiltros && (
                                        <button type="button" onClick={() => setFiltros(FILTROS_VACIOS)} className="boton-secundario mt-4">Limpiar filtros</button>
                                    )}
                                </div>
                            ) : (
                                <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                    {visibles.map((producto) => <TarjetaProductoTienda key={producto.id} producto={producto} />)}
                                </ul>
                            )}
                        </>
                    )}
                </section>
            </div>
        </>
    );
};

export default Tienda;
