import { useEffect, useMemo, useState } from "react";
import { MessageCircle, SearchX } from "lucide-react";
import { obtenerProductos } from "../../api/productos.js";
import { CONTACTO } from "../../datos/contacto.js";
import { coincideTexto } from "../../utilidades/filtros.js";
import { formatearPesos } from "../../utilidades/formato.js";
import ImagenProducto from "../ImagenProducto.jsx";
import Skeleton from "../panel/Skeleton.jsx";

const telefonoWhatsApp = CONTACTO.whatsapp.replace(/\D/g, "");
const whatsappConfigurado = CONTACTO.whatsappConfigurado && telefonoWhatsApp.length >= 8 && telefonoWhatsApp.length <= 15;

const enlaceWhatsApp = (nombreProducto) =>
    `https://wa.me/${telefonoWhatsApp}?text=${encodeURIComponent(`Hola, consulto por ${nombreProducto}`)}`;

const FILTROS_VACIOS = { texto: "", categoria: "todas" };

const TarjetaProducto = ({ producto }) => {
    const disponible = producto.stock > 0;

    return (
        <li className="tarjeta flex h-full flex-col overflow-hidden p-0 sm:p-0">
            <ImagenProducto url={producto.imagenUrl} alt={producto.nombre} className="aspect-[4/3] w-full border-b border-borde" />

            <div className="flex flex-1 flex-col p-5">
                <p className="mb-2 w-fit rounded-full bg-marca/15 px-2.5 py-0.5 text-xs font-semibold text-marca">{producto.categoria}</p>
                <h3 className="font-semibold">{producto.nombre}</h3>
                <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-slate-400">{producto.descripcion}</p>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-lg font-bold">{formatearPesos(producto.precio)}</p>
                    <p className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${disponible ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"}`}>
                        {disponible ? "Disponible" : "Agotado"}
                    </p>
                </div>

                {whatsappConfigurado && (
                    <a
                        href={enlaceWhatsApp(producto.nombre)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Consultar por WhatsApp: ${producto.nombre}`}
                        className="boton-primario mt-4 w-full"
                    >
                        <MessageCircle size={18} aria-hidden="true" /> Consultar por WhatsApp
                    </a>
                )}
            </div>
        </li>
    );
};

/* Catálogo público: carga todos los productos activos y los filtra en el navegador (sin paginación). */
const SeccionCatalogo = ({ id = "catalogo" }) => {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [filtros, setFiltros] = useState(FILTROS_VACIOS);

    useEffect(() => {
        let vigente = true;

        obtenerProductos()
            .then((lista) => vigente && setProductos(lista))
            .catch(() => vigente && setError("No pudimos cargar el catálogo en este momento."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, []);

    const categorias = useMemo(() => [...new Set(productos.map((producto) => producto.categoria))].sort((a, b) => a.localeCompare(b)), [productos]);
    const visibles = useMemo(
        () => productos.filter((producto) => (filtros.categoria === "todas" || producto.categoria === filtros.categoria) && coincideTexto(filtros.texto, [producto.nombre])),
        [productos, filtros]
    );

    const cambiarFiltro = (evento) => setFiltros((anteriores) => ({ ...anteriores, [evento.target.name]: evento.target.value }));
    const hayFiltros = filtros.texto !== "" || filtros.categoria !== "todas";

    return (
        <section id={id} data-animacion-entrada aria-labelledby={`titulo-${id}`} className="scroll-mt-20 bg-fondo px-6 py-20 sm:px-[8%] sm:py-24">
            <div className="mx-auto max-w-6xl">
                <p className="antetitulo text-center">Productos y repuestos</p>
                <h2 id={`titulo-${id}`} className="mb-4 text-center text-3xl font-bold sm:text-4xl">CATÁLOGO</h2>
                <p className="mx-auto mb-12 max-w-2xl text-center text-slate-400">Pantallas, baterías, cargadores y más. Consúltanos por WhatsApp y te confirmamos precio y disponibilidad.</p>

                {cargando && <Skeleton tipo="tarjeta" cantidad={3} etiqueta="Cargando catálogo" />}
                {!cargando && error && <p className="text-center text-slate-400" role="status">{error}</p>}
                {!cargando && !error && productos.length === 0 && (
                    <p className="text-center text-slate-400" role="status">Pronto publicaremos nuestros productos.</p>
                )}

                {productos.length > 0 && (
                    <>
                        <div role="search" aria-label="Buscar en el catálogo" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="sm:flex-[2_1_16rem]">
                                <label htmlFor={`${id}-texto`} className="etiqueta">Buscar por nombre</label>
                                <input id={`${id}-texto`} name="texto" type="search" className="campo" placeholder="Ej. pantalla Samsung" autoComplete="off" value={filtros.texto} onChange={cambiarFiltro} />
                            </div>
                            <div className="sm:min-w-52 sm:flex-[1_1_12rem]">
                                <label htmlFor={`${id}-categoria`} className="etiqueta">Categoría</label>
                                <select id={`${id}-categoria`} name="categoria" className="campo" value={filtros.categoria} onChange={cambiarFiltro}>
                                    <option value="todas">Todas las categorías</option>
                                    {categorias.map((categoria) => (
                                        <option key={categoria} value={categoria}>{categoria}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <p aria-live="polite" className="mb-4 text-sm text-slate-400">
                            {visibles.length === 0 ? "No hay productos con ese criterio." : `${visibles.length} ${visibles.length === 1 ? "producto" : "productos"}`}
                        </p>

                        {visibles.length === 0 ? (
                            <div className="tarjeta mx-auto max-w-xl text-center">
                                <SearchX className="mx-auto mb-3 size-8 text-marca" aria-hidden="true" />
                                <p className="font-medium">No hay productos con ese criterio.</p>
                                {hayFiltros && (
                                    <button type="button" onClick={() => setFiltros(FILTROS_VACIOS)} className="boton-secundario mt-4">
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                        ) : (
                            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {visibles.map((producto) => (
                                    <TarjetaProducto key={producto.id} producto={producto} />
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </section>
    );
};

export default SeccionCatalogo;
