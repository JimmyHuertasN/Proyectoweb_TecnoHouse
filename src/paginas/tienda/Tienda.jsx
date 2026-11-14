import { useMemo, useState } from "react";
import { MessageCircle, PackageOpen, Search, SearchX, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import CuadriculaProductos from "../../componentes/tienda/CuadriculaProductos.jsx";
import useTienda from "../../hooks/useTienda.js";
import { coincideTexto } from "../../utilidades/filtros.js";

const VENTAJAS = [
    { icono: MessageCircle, titulo: "Pide por WhatsApp", texto: "Arma tu carrito y envíanos el pedido." },
    { icono: ShieldCheck, titulo: "Solo lo que está a la venta", texto: "Cada producto muestra su disponibilidad." },
    { icono: Wrench, titulo: "¿Lo instalamos?", texto: "Nuestros técnicos pueden hacerlo." },
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

/* En celulares es una píldora dentro de una fila deslizable; en escritorio, una fila de la lista lateral. */
const BotonCategoria = ({ activa, alElegir, nombre, cantidad }) => (
    <button
        type="button"
        onClick={alElegir}
        aria-pressed={activa}
        className={`flex min-h-11 shrink-0 cursor-pointer items-center justify-between gap-2 rounded-full border px-4 text-sm transition lg:w-full lg:rounded-lg lg:border-transparent lg:px-3 ${
            activa ? "border-white bg-white font-semibold text-slate-950" : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white lg:hover:bg-white/5"
        }`}
    >
        {nombre}
        <span className={`text-xs tabular-nums ${activa ? "text-slate-600" : "text-slate-500"}`}>{cantidad}</span>
    </button>
);

/* Mensaje central para los estados sin productos: error, catálogo vacío o búsqueda sin resultados. */
const MensajeTienda = ({ icono: Icono, titulo, texto, children }) => (
    <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center" role="status">
        <Icono className="mx-auto size-10 text-slate-500" strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold text-white">{titulo}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{texto}</p>
        {children && <div className="mt-6">{children}</div>}
    </div>
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
    const hayProductos = !cargando && !error && productos.length > 0;

    return (
        <>
            <section aria-labelledby="titulo-tienda" className="border-b border-white/10 bg-gradient-to-b from-superficie to-fondo">
                <div className="contenedor py-10 sm:py-14">
                    <p className="antetitulo">Tienda</p>
                    <h1 id="titulo-tienda" className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Repuestos y accesorios</h1>
                    <p className="mt-3 max-w-2xl leading-relaxed text-slate-400">Pantallas, baterías, cargadores y más para tus equipos, con el respaldo de nuestro servicio técnico.</p>

                    <div role="search" className="relative mt-7 max-w-xl">
                        <label htmlFor="tienda-texto" className="sr-only">Buscar productos</label>
                        <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                        <input
                            id="tienda-texto"
                            type="search"
                            className="campo min-h-12 bg-tarjeta pl-11"
                            placeholder="Buscar por nombre o categoría"
                            autoComplete="off"
                            value={filtros.texto}
                            onChange={(evento) => cambiarFiltro("texto", evento.target.value)}
                        />
                    </div>
                </div>
            </section>

            <div className="contenedor grid gap-8 py-8 sm:py-10 lg:grid-cols-[13rem_1fr] lg:gap-10">
                {hayProductos && (
                    <aside aria-label="Filtros" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
                        <h2 className="mb-3 hidden text-sm font-semibold text-white lg:block">Categorías</h2>
                        {/* La fila se desliza dentro de su propio contenedor; los márgenes negativos la llevan hasta el borde de la pantalla. */}
                        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
                            <BotonCategoria activa={filtros.categoria === "todas"} alElegir={() => cambiarFiltro("categoria", "todas")} nombre="Todas" cantidad={productos.length} />
                            {categorias.map(({ nombre, cantidad }) => (
                                <BotonCategoria key={nombre} activa={filtros.categoria === nombre} alElegir={() => cambiarFiltro("categoria", nombre)} nombre={nombre} cantidad={cantidad} />
                            ))}
                        </div>

                        <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-slate-300 lg:mt-5 lg:border-t lg:border-white/10 lg:pt-4">
                            <input type="checkbox" checked={filtros.soloDisponibles} onChange={(evento) => cambiarFiltro("soloDisponibles", evento.target.checked)} className="size-4 cursor-pointer accent-marca" />
                            Solo disponibles
                        </label>
                    </aside>
                )}

                <section aria-label="Productos" className={`min-w-0 ${hayProductos ? "" : "lg:col-span-2"}`}>
                    {cargando && <CuadriculaProductos cargando />}

                    {!cargando && error && (
                        <MensajeTienda icono={TriangleAlert} titulo="No pudimos cargar la tienda" texto="Revisa tu conexión e inténtalo de nuevo.">
                            <button type="button" onClick={() => window.location.reload()} className="boton-secundario">Volver a intentar</button>
                        </MensajeTienda>
                    )}

                    {!cargando && !error && productos.length === 0 && (
                        <MensajeTienda icono={PackageOpen} titulo="Pronto publicaremos nuestros productos" texto="Estamos preparando el catálogo. Mientras tanto, puedes escribirnos para consultar por un repuesto." />
                    )}

                    {hayProductos && (
                        <>
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <p aria-live="polite" className="text-sm text-slate-400">
                                    {visibles.length} {visibles.length === 1 ? "producto" : "productos"}
                                    {filtros.categoria !== "todas" && ` en ${filtros.categoria}`}
                                </p>
                                <div className="flex items-center gap-2.5">
                                    <label htmlFor="tienda-orden" className="text-sm whitespace-nowrap text-slate-400">Ordenar por</label>
                                    <select id="tienda-orden" className="campo w-auto py-2" value={filtros.orden} onChange={(evento) => cambiarFiltro("orden", evento.target.value)}>
                                        {Object.entries(ORDENES).map(([valor, { etiqueta }]) => (
                                            <option key={valor} value={valor}>{etiqueta}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {visibles.length === 0 ? (
                                <MensajeTienda icono={SearchX} titulo="No hay productos con ese criterio" texto="Prueba con otra palabra o quita los filtros.">
                                    <button type="button" onClick={() => setFiltros(FILTROS_VACIOS)} className="boton-secundario">Limpiar filtros</button>
                                </MensajeTienda>
                            ) : (
                                <CuadriculaProductos productos={visibles} />
                            )}
                        </>
                    )}
                </section>
            </div>

            <section aria-label="Cómo comprar" className="border-t border-white/10 bg-superficie">
                <ul className="contenedor grid gap-8 py-10 sm:grid-cols-3">
                    {VENTAJAS.map(({ icono: Icono, titulo, texto }) => (
                        <li key={titulo} className="flex gap-3.5">
                            <Icono size={20} strokeWidth={1.8} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />
                            <div>
                                <p className="text-sm font-semibold text-white">{titulo}</p>
                                <p className="mt-0.5 text-sm text-slate-400">{texto}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </>
    );
};

export default Tienda;
