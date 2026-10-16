/* Muestra una puntuación de 1 a 5 con estrellas (solo lectura). */
const Estrellas = ({ puntuacion, tamano = "text-base" }) => (
    <span className={`${tamano} tracking-wide`} role="img" aria-label={`${puntuacion} de 5 estrellas`}>
        {[1, 2, 3, 4, 5].map((valor) => (
            <span key={valor} className={valor <= Math.round(puntuacion) ? "text-amber-400" : "text-slate-600"} aria-hidden="true">
                ★
            </span>
        ))}
    </span>
);

export default Estrellas;
