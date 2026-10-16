const Skeleton = ({ tipo = "fila", cantidad = 3, className = "", etiqueta = "Cargando contenido" }) => {
    const elementos = Array.from({ length: cantidad }, (_, indice) => indice);
    const clase = tipo === "metrica"
        ? "h-32 rounded-xl"
        : tipo === "tarjeta"
            ? "h-56 rounded-xl"
            : "h-20 rounded-lg";

    return (
        <div role="status" aria-label={etiqueta} className={className}>
            <span className="sr-only">{etiqueta}</span>
            <div className={tipo === "fila" ? "space-y-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"} aria-hidden="true">
                {elementos.map((indice) => <div key={indice} className={`animate-pulse border border-borde bg-tarjeta/80 motion-reduce:animate-none ${clase}`} />)}
            </div>
        </div>
    );
};

export default Skeleton;
