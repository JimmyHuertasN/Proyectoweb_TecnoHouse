const TarjetaTecnico = ({ tecnico }) => {
    return (
        <div className="tecnico-card">
            <h3>{tecnico.nombre}</h3>
            <p className="especialidad">{tecnico.especialidad || "Técnico de TecnoHouse"}</p>
            <p>Calificación: {Number(tecnico.calificacion_promedio).toFixed(1)} / 5</p>
            <p className={`disponibilidad ${tecnico.disponible ? "disponible" : "no-disponible"}`}>
                {tecnico.disponible ? "Disponible" : "No disponible"}
            </p>
        </div>
    );
};

export default TarjetaTecnico;
