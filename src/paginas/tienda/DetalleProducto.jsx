import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, MessageCircle, PackageX, ShoppingCart, Wrench } from "lucide-react";
import ImagenProducto from "../../componentes/ImagenProducto.jsx";
import CuadriculaProductos from "../../componentes/tienda/CuadriculaProductos.jsx";
import EtiquetaStock from "../../componentes/tienda/EtiquetaStock.jsx";
import SelectorCantidad from "../../componentes/tienda/SelectorCantidad.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import useTienda from "../../hooks/useTienda.js";
import useToast from "../../hooks/useToast.js";
import { formatearPesos } from "../../utilidades/formato.js";
import { rutaSolicitarReparacion } from "../../utilidades/rutas.js";
import { enlaceConsultaProducto, whatsappConfigurado } from "../../utilidades/whatsapp.js";

const MAXIMO_RELACIONADOS = 4;

const ProductoNoEncontrado = () => (
    <div className="contenedor py-24 text-center">
        <PackageX className="mx-auto size-12 text-slate-500" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-bold text-white">No encontramos ese producto</h1>
        <p className="mt-2 text-slate-400">Puede que ya no esté a la venta.</p>
        <Link to="/tienda" className="boton-primario mt-7">Volver a la tienda</Link>
    </div>
);

/* Silueta de la ficha mientras cargan los productos: foto a la izquierda y texto a la derecha. */
const FichaCargando = () => (
    <div role="status" aria-label="Cargando producto" className="contenedor grid gap-8 py-10 lg:grid-cols-2 lg:gap-14">
        <div className="aspect-square animate-pulse rounded-2xl bg-tarjeta" />
        <div className="space-y-4 py-4">
            <div className="h-4 w-24 animate-pulse rounded bg-tarjeta" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-tarjeta" />
            <div className="h-9 w-40 animate-pulse rounded bg-tarjeta" />
            <div className="h-28 animate-pulse rounded-xl bg-tarjeta" />
        </div>
    </div>
);

/* Bloque de compra: cantidad y botón, o el motivo por el que no se puede agregar. */
const CompraProducto = ({ producto, disponibles, cantidad, alCambiarCantidad, alAgregar }) => {
    if (disponibles <= 0) {
        return (
            <p className="rounded-xl border border-slate-700 px-4 py-3.5 text-sm text-slate-300">
                {producto.stock > 0 ? "Ya tienes en el carrito todas las unidades disponibles." : "Este producto está agotado por ahora. Escríbenos para saber cuándo vuelve."}
            </p>
        );
    }

    return (
        <div>
            <p className="etiqueta">Cantidad</p>
            <div className="flex flex-wrap items-center gap-3">
                <SelectorCantidad cantidad={cantidad} maximo={disponibles} alCambiar={alCambiarCantidad} />
                <button type="button" onClick={alAgregar} className="boton-primario min-w-48 flex-1 py-3 text-base">
                    <ShoppingCart size={18} aria-hidden="true" /> Agregar al carrito
                </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">{disponibles} {disponibles === 1 ? "unidad disponible" : "unidades disponibles"}</p>
        </div>
    );
};

const FichaProducto = ({ producto }) => {
    const { usuario } = useSesion();
    const { productos, agregar, cantidadDe, abrirCarrito } = useTienda();
    const toast = useToast();
    const [cantidad, setCantidad] = useState(1);

    const disponibles = producto.stock - cantidadDe(producto.id);
    const relacionados = productos
        .filter((otro) => otro.categoria === producto.categoria && otro.id !== producto.id)
        .slice(0, MAXIMO_RELACIONADOS);

    const agregarAlCarrito = () => {
        agregar(producto.id, cantidad);
        toast.exito(`${cantidad} ${cantidad === 1 ? "unidad" : "unidades"} de ${producto.nombre} en el carrito.`);
        setCantidad(1);
        abrirCarrito();
    };

    return (
        <div className="contenedor py-8 sm:py-10">
            <nav aria-label="Ruta de navegación" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
                <Link to="/tienda" className="hover:text-white">Tienda</Link>
                <ChevronRight size={14} aria-hidden="true" />
                <span>{producto.categoria}</span>
                <ChevronRight size={14} aria-hidden="true" />
                <span aria-current="page" className="text-slate-200">{producto.nombre}</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
                {/* La foto se muestra completa sobre un fondo neutro, sin recortar el producto. */}
                <div className="overflow-hidden rounded-2xl border border-borde bg-slate-900 lg:sticky lg:top-24 lg:self-start">
                    <ImagenProducto url={producto.imagenUrl} alt={producto.nombre} contener className="aspect-square w-full p-6 sm:p-10" />
                </div>

                <div>
                    <p className="text-sm text-slate-400">{producto.categoria}</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">{producto.nombre}</h1>

                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <p className="text-3xl font-bold text-white">{formatearPesos(producto.precio)}</p>
                        <EtiquetaStock stock={producto.stock} />
                    </div>

                    {producto.descripcion && <p className="mt-6 leading-relaxed whitespace-pre-line text-slate-300">{producto.descripcion}</p>}

                    <div className="mt-8 border-t border-white/10 pt-6">
                        <CompraProducto producto={producto} disponibles={disponibles} cantidad={cantidad} alCambiarCantidad={setCantidad} alAgregar={agregarAlCarrito} />

                        {whatsappConfigurado && (
                            <a href={enlaceConsultaProducto(producto.nombre)} target="_blank" rel="noopener noreferrer" className="boton-secundario mt-3 w-full">
                                <MessageCircle size={18} aria-hidden="true" /> Preguntar por WhatsApp
                            </a>
                        )}
                    </div>

                    <p className="mt-6 flex items-start gap-3 rounded-xl bg-superficie p-4 text-sm leading-relaxed text-slate-400">
                        <Wrench className="mt-0.5 size-5 shrink-0 text-marca" aria-hidden="true" />
                        <span>
                            ¿Necesitas que lo instalemos?{" "}
                            <Link to={rutaSolicitarReparacion(usuario)} className="enlace">Solicita un servicio técnico</Link>.
                        </span>
                    </p>

                    <Link to="/tienda" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm text-slate-400 hover:text-white">
                        <ArrowLeft size={16} aria-hidden="true" /> Seguir comprando
                    </Link>
                </div>
            </div>

            {relacionados.length > 0 && (
                <section aria-labelledby="titulo-relacionados" className="mt-16 border-t border-white/10 pt-12">
                    <h2 id="titulo-relacionados" className="titulo-seccion mb-6">También te puede interesar</h2>
                    <CuadriculaProductos productos={relacionados} />
                </section>
            )}
        </div>
    );
};

const DetalleProducto = () => {
    const { id } = useParams();
    const { cargando, buscarProducto } = useTienda();

    // Al pasar a otro producto (por ejemplo, desde "relacionados") se vuelve arriba.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (cargando) return <FichaCargando />;

    const producto = buscarProducto(id);
    if (!producto) return <ProductoNoEncontrado />;

    // La key hace que cada producto tenga su propia ficha: la cantidad empieza en 1.
    return <FichaProducto key={producto.id} producto={producto} />;
};

export default DetalleProducto;
