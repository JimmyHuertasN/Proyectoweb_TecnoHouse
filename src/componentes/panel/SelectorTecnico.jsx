import { useState } from "react";
import Aviso from "../Aviso.jsx";
import useConfirmar from "../../hooks/useConfirmar.js";

const describirTecnico = (tecnico) =>
    `${tecnico.nombre} · ${tecnico.especialidad || "Sin especialidad"}${tecnico.disponible ? "" : " (no disponible)"}`;

/* "alAsignar" la recibe del padre, que llama a la API. Si falla, el error se muestra aquí mismo. */
const SelectorTecnico = ({ tecnicos, tecnicoActualId, alAsignar }) => {
    const [elegido, setElegido] = useState("");
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);
    const confirmar = useConfirmar();
    // Un técnico desactivado ya no entra a su panel: no se le pueden asignar servicios.
    const opciones = tecnicos.filter((tecnico) => tecnico.activo && tecnico.id !== tecnicoActualId);

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        if (!elegido) {
            setError("Elige un técnico.");
            return;
        }

        const tecnico = tecnicos.find((opcion) => opcion.id === elegido);
        if (!await confirmar({ titulo: "Asignar técnico", mensaje: `¿Asignar el servicio a ${tecnico.nombre}?` })) return;

        setError("");
        setGuardando(true);

        try {
            await alAsignar(tecnico);
            setElegido("");
        } catch (errorApi) {
            setError(errorApi.message);
        } finally {
            setGuardando(false);
        }
    };

    if (opciones.length === 0) {
        return <p className="text-sm text-slate-400">No hay otros técnicos activos para asignar.</p>;
    }

    return (
        <form onSubmit={manejarEnvio} noValidate>
            <Aviso texto={error} tipo="error" />
            <label htmlFor="tecnico" className="etiqueta">
                {tecnicoActualId ? "Cambiar a" : "Asignar a"}
            </label>
            <select id="tecnico" className="campo" value={elegido} onChange={(evento) => setElegido(evento.target.value)}>
                <option value="">Elige un técnico...</option>
                {opciones.map((tecnico) => (
                    <option key={tecnico.id} value={tecnico.id}>
                        {describirTecnico(tecnico)}
                    </option>
                ))}
            </select>
            <button type="submit" disabled={guardando} className="boton-primario mt-3 w-full">
                {guardando ? "Guardando..." : tecnicoActualId ? "Reasignar técnico" : "Asignar técnico"}
            </button>
        </form>
    );
};

export default SelectorTecnico;
