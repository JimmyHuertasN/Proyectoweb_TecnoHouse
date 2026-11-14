import { useState } from "react";
import { Package } from "lucide-react";

/*
    Foto del producto. Si no tiene o no carga (por ejemplo, una ruta de ejemplo), muestra un ícono.
    Con "contener" la foto se ve completa, sin recortes; sin él, llena el espacio (miniaturas).
*/
const ImagenProducto = ({ url, alt = "", className = "", contener = false }) => {
    const [fallida, setFallida] = useState("");

    if (!url || fallida === url) {
        return (
            <div className={`flex items-center justify-center bg-slate-900 text-slate-600 ${className}`} role={alt ? "img" : undefined} aria-label={alt ? `${alt} (sin foto)` : undefined} aria-hidden={alt ? undefined : "true"}>
                <Package className="size-1/3 max-h-16 min-h-5 max-w-16 min-w-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
        );
    }

    return <img src={url} alt={alt} loading="lazy" onError={() => setFallida(url)} className={`${contener ? "object-contain" : "object-cover"} ${className}`} />;
};

export default ImagenProducto;
