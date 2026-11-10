import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, MessageCircle, ShoppingCart, Wrench } from "lucide-react";
import ImagenProducto from "../../componentes/ImagenProducto.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import EtiquetaStock from "../../componentes/tienda/EtiquetaStock.jsx";
import SelectorCantidad from "../../componentes/tienda/SelectorCantidad.jsx";
import TarjetaProductoTienda from "../../componentes/tienda/TarjetaProductoTienda.jsx";
import useTienda from "../../hooks/useTienda.js";
import useToast from "../../hooks/useToast.js";
import { formatearPesos } from "../../utilidades/formato.js";
import { enlaceConsultaProducto, whatsappConfigurado } from "../../utilidades/whatsapp.js";

const MAXIMO_RELACIONADOS = 3;

const ProductoNoEncontrado = () => (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">No encontramos ese producto</h1>
        <p className="mt-2 text-slate-400">Puede que ya no esté a la venta.</p>
        <Link to="/tienda" className="boton-primario mt-6">Volver a la tienda</Link>
    </div>
);

const FichaProducto = ({ producto }) => {
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
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-[4%] xl:px-0">
            <nav aria-label="Ruta de navegación" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-slate-400">
                <Link to="/tienda" className="hover:text-marca">Tienda</Link>
                <ChevronRight size={14} aria-hidden="true" />
                <span>{producto.categoria}</span>
                <ChevronRight size={14} aria-hidden="true" />
                <span aria-current="page" className="text-slate-200">{producto.nombre}</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                <ImagenProducto url={producto.imagenUrl} alt={producto.nombre} className="aspect-square w-full rounded-2xl border border-borde bg-tarjeta" />

                <div className="flex flex-col">
                    <p className="text-sm font-semibold tracking-wide text-marca uppercase">{producto.categoria}</p>
                    <h1 className="mt-2 text-3xl font-bold">{producto.nombre}</h1>
                    <p className="mt-4 text-3xl font-bold">{formatearPesos(producto.precio)}</p>
                    <div className="mt-3"><EtiquetaStock stock={producto.stock} /></div>

                    {producto.descripcion && <p className="mt-6 leading-relaxed whitespace-pre-line text-slate-300">{producto.descripcion}</p>}

                    <div className="mt-8 rounded-xl border border-borde bg-tarjeta p-5">
                        {disponibles > 0 ? (
                            <>
                                <p className="etiqueta">Cantidad</p>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <SelectorCantidad cantidad={cantidad} maximo={disponibles} alCambiar={setCantidad} />
                                    <button type="button" onClick={agregarAlCarrito} className="boton-primario flex-1 py-3">
                                        <ShoppingCart size={18} aria-hidden="true" /> Agregar al carrito
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">{disponibles} {disponibles === 1 ? "unidad disponible" : "unidades disponibles"}</p>
                            </>
                        ) : (
                            <p className="text-sm text-slate-400">
                                {producto.stock > 0 ? "Ya tienes en el carrito todas las unidades disponibles." : "Este producto está agotado por ahora."}
                            </p>
                        )}

                        {whatsappConfigurado && (
                            <a href={enlaceConsultaProducto(producto.nombre)} target="_blank" rel="noopener noreferrer" className="boton-secundario mt-3 w-full">
                                <MessageCircle size={18} aria-hidden="true" /> Preguntar por WhatsApp
                            </a>
                        )}
                    </div>

                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-borde p-4 text-sm text-slate-400">
                        <Wrench className="mt-0.5 size-5 shrink-0 text-marca" aria-hidden="true" />
                        <p>
                            ¿Necesitas que lo instalemos?{" "}
                            <Link to="/cliente/solicitudes/nueva" className="font-semibold text-marca hover:underline">Solicita un servicio técnico</Link>.
                        </p>
                    </div>

                    <Link to="/tienda" className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-marca">
                        <ArrowLeft size={16} aria-hidden="true" /> Seguir comprando
                    </Link>
                </div>
            </div>

            {relacionados.length > 0 && (
                <section aria-labelledby="titulo-relacionados" className="mt-16">
                    <h2 id="titulo-relacionados" className="mb-5 text-2xl font-bold">También te puede interesar</h2>
                    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {relacionados.map((otro) => <TarjetaProductoTienda key={otro.id} producto={otro} />)}
                    </ul>
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

    if (cargando) {
        return <Skeleton tipo="tarjeta" cantidad={2} etiqueta="Cargando producto" className="mx-auto max-w-6xl px-6 py-10" />;
    }

    const producto = buscarProducto(id);
    if (!producto) return <ProductoNoEncontrado />;

    // La key hace que cada producto tenga su propia ficha: la cantidad empieza en 1.
    return <FichaProducto key={producto.id} producto={producto} />;
};

export default DetalleProducto;
