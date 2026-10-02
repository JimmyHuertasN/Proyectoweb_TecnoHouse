const TarjetaTecnico = ({ tecnico, alEliminar }) => {
    return (
        <div className="tecnico-card">
            <h3>{tecnico.nombre}</h3>
            <p className="especialidad">{tecnico.especialidad}</p>
            <p>{tecnico.email}</p>
            <p>{tecnico.telefono}</p>
            <p className={`disponibilidad ${tecnico.disponible ? "disponible" : "no-disponible"}`}>
                {tecnico.disponible ? "Disponible" : "No disponible"}
            </p>
            <button onClick={() => alEliminar(tecnico.id)}>Eliminar</button>
        </div>
    );
};

export default TarjetaTecnico;
