const FORMAS = {
    metrica: "h-32 rounded-2xl",
    tarjeta: "h-48 rounded-2xl",
    fila: "h-20 rounded-xl",
};

/* Siluetas que ocupan el lugar del contenido mientras carga. */
const Skeleton = ({ tipo = "fila", cantidad = 3, className = "", etiqueta = "Cargando contenido" }) => {
    const elementos = Array.from({ length: cantidad }, (_, indice) => indice);

    return (
        <div role="status" aria-label={etiqueta} className={className}>
            <span className="sr-only">{etiqueta}</span>
            <div className={tipo === "fila" ? "space-y-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"} aria-hidden="true">
                {elementos.map((indice) => <div key={indice} className={`animate-pulse bg-tarjeta ${FORMAS[tipo] ?? FORMAS.fila}`} />)}
            </div>
        </div>
    );
};

export default Skeleton;
