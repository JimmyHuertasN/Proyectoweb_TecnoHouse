import Estrellas from "./panel/Estrellas.jsx";
import { iniciales } from "../utilidades/formato.js";

const TarjetaTecnico = ({ tecnico }) => {
    const calificacion = Number(tecnico.calificacion_promedio ?? tecnico.calificacion ?? 0);

    return (
        <article data-animacion-entrada className="tarjeta-elevable w-full max-w-sm text-center leading-relaxed sm:w-70">
            <div role="img" aria-label={`Iniciales de ${tecnico.nombre}`} className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full border border-marca/30 bg-marca/10 text-2xl font-bold text-marca">
                {iniciales(tecnico.nombre)}
            </div>
            <h3 className="mb-1 text-xl leading-snug font-bold text-white">{tecnico.nombre}</h3>
            <p className="mb-4 font-semibold text-slate-400">{tecnico.especialidad || "Técnico de TecnoHouse"}</p>
            <div className="mb-4 flex flex-col items-center gap-1">
                <Estrellas puntuacion={calificacion} />
                <span className="text-sm text-slate-400">{calificacion.toFixed(1)} / 5</span>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${tecnico.disponible ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-700/60 text-slate-300"}`}>
                <span className={`size-2 rounded-full ${tecnico.disponible ? "bg-emerald-400" : "bg-slate-500"}`} aria-hidden="true" />
                {tecnico.disponible ? "Disponible" : "No disponible"}
            </span>
        </article>
    );
};

export default TarjetaTecnico;
