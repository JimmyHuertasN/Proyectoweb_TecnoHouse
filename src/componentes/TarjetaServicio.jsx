const TarjetaServicio = ({ icono, titulo, descripcion }) => {
    return (
        <article className="tarjeta-elevable">
            <h3 className="mb-4 text-xl font-bold">{icono} {titulo}</h3>
            <p className="mb-5 leading-relaxed text-slate-400">{descripcion}</p>
            <button className="cursor-pointer font-bold text-marca hover:underline">Ver más</button>
        </article>
    );
};

export default TarjetaServicio;
