const TarjetaTecnico = ({ tecnico }) => {
    return (
        <div className="tarjeta-elevable w-70 leading-relaxed">
            <h3 className="mb-3 text-xl leading-snug font-bold">{tecnico.nombre}</h3>
            <p className="mb-2.5 font-bold text-slate-400">{tecnico.especialidad || "Técnico de TecnoHouse"}</p>
            <p className="mb-2">Calificación: {Number(tecnico.calificacion_promedio).toFixed(1)} / 5</p>
            <p className={`mb-2 ${tecnico.disponible ? "text-green-500" : "text-red-500"}`}>
                {tecnico.disponible ? "Disponible" : "No disponible"}
            </p>
        </div>
    );
};

export default TarjetaTecnico;
