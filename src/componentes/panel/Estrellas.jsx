import { Star } from "lucide-react";

/* Muestra una puntuación de 1 a 5 con estrellas (solo lectura). */
const Estrellas = ({ puntuacion, tamano = "text-base" }) => (
    <span className={`inline-flex flex-row items-center gap-1 whitespace-nowrap ${tamano} tracking-wide`} role="img" aria-label={`${puntuacion} de 5 estrellas`}>
        {[1, 2, 3, 4, 5].map((valor) => (
            <span key={valor} className={`inline-flex ${valor <= Math.round(puntuacion) ? "text-amber-400" : "text-slate-600"}`} aria-hidden="true">
                <Star className="size-[1em]" fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
            </span>
        ))}
    </span>
);

export default Estrellas;
