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

    const agotado = producto.stock <= 0;
    const sinUnidades = cantidadDe(producto.id) >= producto.stock;
    const rutaDetalle = `/tienda/${producto.id}`;

    const agregarAlCarrito = () => {
        agregar(producto.id);
        toast.exito(`${producto.nombre} se agregó al carrito.`);
    };

    return (
        <li className="tarjeta-elevable flex flex-col overflow-hidden">
            {/* La foto repite el enlace del nombre: se oculta al teclado y a los lectores de pantalla. */}
            <Link to={rutaDetalle} className="block bg-slate-900" tabIndex={-1} aria-hidden="true">
                <ImagenProducto url={producto.imagenUrl} contener className={`aspect-square w-full p-4 ${agotado ? "opacity-50" : ""}`} />
            </Link>

            <div className="flex flex-1 flex-col p-4">
                <p className="text-xs text-slate-500">{producto.categoria}</p>
                <h3 className="mt-1 line-clamp-2 font-medium text-white">
                    <Link to={rutaDetalle} className="hover:underline">{producto.nombre}</Link>
                </h3>

                <p className="mt-auto pt-4 text-xl font-bold text-white">{formatearPesos(producto.precio)}</p>
                <div className="mt-1"><EtiquetaStock stock={producto.stock} /></div>

                <button type="button" onClick={agregarAlCarrito} disabled={sinUnidades} className="boton-primario mt-4 w-full px-3">
                    {agotado && "Agotado"}
                    {!agotado && sinUnidades && "Ya en el carrito"}
                    {!sinUnidades && (
                        <>
                            <ShoppingCart size={17} aria-hidden="true" />
                            <span>Agregar<span className="hidden sm:inline"> al carrito</span></span>
                        </>
                    )}
                </button>
            </div>
        </li>
    );
};

export default TarjetaProductoTienda;
