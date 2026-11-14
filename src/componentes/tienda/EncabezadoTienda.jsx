import { ShoppingCart } from "lucide-react";
import useTienda from "../../hooks/useTienda.js";
import EncabezadoSitio from "../EncabezadoSitio.jsx";

/* El encabezado del sitio con el botón del carrito, que solo existe dentro de la tienda. */
const EncabezadoTienda = () => {
    const { cantidadEnCarrito, abrirCarrito } = useTienda();
    const etiqueta = cantidadEnCarrito === 1 ? "Abrir carrito, 1 producto" : `Abrir carrito, ${cantidadEnCarrito} productos`;

    return (
        <EncabezadoSitio>
            <button type="button" onClick={abrirCarrito} aria-label={etiqueta} className="relative inline-flex size-11 cursor-pointer items-center justify-center rounded-lg border border-slate-700 text-slate-200 transition hover:border-slate-400">
                <ShoppingCart size={20} aria-hidden="true" />
                {cantidadEnCarrito > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-marca px-1 text-xs font-bold text-slate-950">
                        {cantidadEnCarrito}
                    </span>
                )}
            </button>
        </EncabezadoSitio>
    );
};

export default EncabezadoTienda;
