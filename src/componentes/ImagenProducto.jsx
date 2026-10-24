import { useState } from "react";
import { Package } from "lucide-react";

/* Foto del producto. Si no tiene o no carga (por ejemplo, una ruta de ejemplo), muestra un ícono. */
const ImagenProducto = ({ url, alt = "", className = "" }) => {
    const [fallida, setFallida] = useState("");

    if (!url || fallida === url) {
        return (
            <div className={`flex items-center justify-center bg-fondo text-slate-600 ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : "true"}>
                <Package className="size-1/3 min-h-5 min-w-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
        );
    }

    return <img src={url} alt={alt} loading="lazy" onError={() => setFallida(url)} className={`object-cover ${className}`} />;
};

export default ImagenProducto;
