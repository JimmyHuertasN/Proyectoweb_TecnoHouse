import { useState } from "react";
import { iniciales } from "../../utilidades/formato.js";
import Aviso from "../Aviso.jsx";
import useConfirmar from "../../hooks/useConfirmar.js";

const preguntaConfirmacion = (tecnico) =>
    tecnico.activo
        ? `¿Desactivar a ${tecnico.nombre}? Ya no podrá entrar al panel del técnico ni tomar servicios.`
        : `¿Activar de nuevo a ${tecnico.nombre}? Podrá volver a entrar al panel del técnico.`;

/* "alCambiarEstado" la recibe del padre, que llama a la API. Si falla, el error se muestra en la tarjeta. */
const TarjetaGestionTecnico = ({ tecnico, alCambiarEstado }) => {
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);
    const confirmar = useConfirmar();

    const cambiarEstado = async () => {
        const accion = tecnico.activo ? "Desactivar técnico" : "Activar técnico";
        if (!await confirmar({ titulo: accion, mensaje: preguntaConfirmacion(tecnico) })) return;

        setError("");
        setGuardando(true);

        try {
            await alCambiarEstado(tecnico, !tecnico.activo);
        } catch (errorApi) {
            setError(errorApi.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <article className={`tarjeta flex flex-col ${tecnico.activo ? "" : "opacity-70"}`}>
            <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-marca/15 font-bold text-marca">
                    {iniciales(tecnico.nombre)}
                </span>
                <div className="min-w-0">
                    <h3 className="truncate font-semibold">{tecnico.nombre}</h3>
                    <p className="truncate text-sm text-marca">{tecnico.especialidad || "Sin especialidad"}</p>
                </div>
            </div>

            <Aviso texto={error} tipo="error" />

            <dl className="mt-4 flex-1 space-y-1 text-sm">
                <div className="flex gap-2">
                    <dt className="text-slate-400">Teléfono:</dt>
                    <dd>{tecnico.telefono || "No registrado"}</dd>
                </div>
                <div className="flex gap-2">
                    <dt className="text-slate-400">Calificación:</dt>
                    <dd>{tecnico.calificacion > 0 ? `${tecnico.calificacion.toFixed(1)} / 5` : "Sin calificaciones"}</dd>
                </div>
                <div className="flex gap-2">
                    <dt className="text-slate-400">Servicios en curso:</dt>
                    <dd>{tecnico.serviciosEnCurso}</dd>
                </div>
                {tecnico.activo && (
                    <div className="flex gap-2">
                        <dt className="text-slate-400">Estado:</dt>
                        <dd className={tecnico.disponible ? "text-emerald-300" : "text-red-300"}>{tecnico.disponible ? "Disponible" : "No disponible"}</dd>
                    </div>
                )}
            </dl>

            <button
                type="button"
                onClick={cambiarEstado}
                disabled={guardando}
                className={`mt-5 w-full ${tecnico.activo ? "boton-peligro" : "boton-primario"}`}
            >
                {guardando ? "Guardando..." : tecnico.activo ? "Desactivar" : "Activar"}
            </button>
        </article>
    );
};

export default TarjetaGestionTecnico;
