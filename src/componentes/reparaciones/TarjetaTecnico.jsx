import Estrellas from "../panel/Estrellas.jsx";
import { iniciales } from "../../utilidades/formato.js";

const TarjetaTecnico = ({ tecnico }) => {
    // La API entrega "calificacionPromedio"; los otros nombres son de consultas anteriores a Supabase.
    const calificacion = Number(tecnico.calificacionPromedio ?? tecnico.calificacion_promedio ?? tecnico.calificacion ?? 0);

    return (
        <li className="flex items-center gap-4 rounded-2xl border border-borde bg-tarjeta p-5">
            <div role="img" aria-label={`Iniciales de ${tecnico.nombre}`} className="flex size-14 shrink-0 items-center justify-center rounded-full bg-slate-800 text-lg font-semibold text-slate-200">
                {iniciales(tecnico.nombre)}
            </div>

            <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-white">{tecnico.nombre}</h3>
                <p className="line-clamp-2 text-sm text-slate-400">{tecnico.especialidad || "Técnico de TecnoHouse"}</p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {/* Un técnico sin calificaciones tiene promedio 0: se indica en lugar de mostrar 0 estrellas. */}
                    {calificacion > 0 ? (
                        <span className="flex items-center gap-1.5 text-slate-300">
                            <Estrellas puntuacion={calificacion} tamano="text-sm" /> {calificacion.toFixed(1)}
                        </span>
                    ) : (
                        <span className="text-slate-500">Sin calificaciones aún</span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 ${tecnico.disponible ? "text-emerald-300" : "text-slate-500"}`}>
                        <span className={`size-1.5 rounded-full ${tecnico.disponible ? "bg-emerald-400" : "bg-slate-600"}`} aria-hidden="true" />
                        {tecnico.disponible ? "Disponible" : "No disponible"}
                    </span>
                </div>
            </div>
        </li>
    );
};

export default TarjetaTecnico;
