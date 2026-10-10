const TarjetaTecnico = ({ tecnico, alEliminar }) => {
    return (
        <div className="tarjeta-elevable w-70 leading-relaxed">
            <h3 className="mb-3 text-xl leading-snug font-bold">{tecnico.nombre}</h3>
            <p className="mb-2.5 font-bold text-slate-400">{tecnico.especialidad}</p>
            <p className="mb-2">{tecnico.email}</p>
            <p className="mb-2">{tecnico.telefono}</p>
            <p className={`mb-2 ${tecnico.disponible ? "text-green-500" : "text-red-500"}`}>
                {tecnico.disponible ? "Disponible" : "No disponible"}
            </p>
            <button className="mt-4 cursor-pointer font-bold text-marca hover:underline" onClick={() => alEliminar(tecnico.id)}>
                Eliminar
            </button>
        </div>
    );
};

export default TarjetaTecnico;
