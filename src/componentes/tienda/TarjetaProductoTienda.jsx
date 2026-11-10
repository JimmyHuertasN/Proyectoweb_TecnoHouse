import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import useTienda from "../../hooks/useTienda.js";
import useToast from "../../hooks/useToast.js";
import { formatearPesos } from "../../utilidades/formato.js";
import ImagenProducto from "../ImagenProducto.jsx";
import EtiquetaStock from "./EtiquetaStock.jsx";

/* Producto en la cuadrícula de la tienda: la foto y el nombre llevan al detalle. */
const TarjetaProductoTienda = ({ producto }) => {
    const { agregar, cantidadDe } = useTienda();
    const toast = useToast();

    const enCarrito = cantidadDe(producto.id);
    const sinUnidades = enCarrito >= producto.stock;
    const rutaDetalle = `/tienda/${producto.id}`;

    const agregarAlCarrito = () => {
        agregar(producto.id);
        toast.exito(`${producto.nombre} se agregó al carrito.`);
    };

    return (
        <li className="group flex h-full flex-col overflow-hidden rounded-xl border border-borde bg-tarjeta transition hover:border-marca hover:shadow-[0_10px_30px_rgba(0,170,255,0.12)]">
            <Link to={rutaDetalle} className="block overflow-hidden" tabIndex={-1} aria-hidden="true">
                <ImagenProducto url={producto.imagenUrl} className="aspect-square w-full transition duration-300 group-hover:scale-105" />
            </Link>

            <div className="flex flex-1 flex-col border-t border-borde p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold tracking-wide text-marca uppercase">{producto.categoria}</p>
                    <EtiquetaStock stock={producto.stock} />
                </div>

                <h3 className="font-semibold">
                    <Link to={rutaDetalle} className="hover:text-marca">{producto.nombre}</Link>
                </h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-400">{producto.descripcion}</p>

                <p className="mt-3 text-xl font-bold">{formatearPesos(producto.precio)}</p>

                <button type="button" onClick={agregarAlCarrito} disabled={sinUnidades} className="boton-primario mt-3 w-full">
                    <ShoppingCart size={18} aria-hidden="true" />
                    {producto.stock <= 0 ? "Agotado" : sinUnidades ? "Máximo en el carrito" : "Agregar al carrito"}
                </button>
            </div>
        </li>
    );
};

export default TarjetaProductoTienda;
