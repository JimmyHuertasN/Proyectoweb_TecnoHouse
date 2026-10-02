const TarjetaServicio = ({ icono, titulo, descripcion }) => {
    return (
        <article className="service-card">
            <h3>{icono} {titulo}</h3>
            <p>{descripcion}</p>
            <button>Ver más</button>
        </article>
    );
};

export default TarjetaServicio;
