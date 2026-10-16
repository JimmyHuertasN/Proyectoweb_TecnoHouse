import { useState } from "react";
import Aviso from "../Aviso.jsx";

/* "alCambiar" la recibe del padre, que llama a la API. Si falla, el error se muestra aquí mismo. */
const InterruptorDisponibilidad = ({ disponible, alCambiar }) => {
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);

    const cambiar = async () => {
        setError("");
        setGuardando(true);

        try {
            await alCambiar(!disponible);
        } catch (errorApi) {
            setError(errorApi.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div>
            <Aviso texto={error} tipo="error" />
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    role="switch"
                    aria-checked={disponible}
                    aria-label="Disponible para nuevos servicios"
                    onClick={cambiar}
                    disabled={guardando}
                    className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full transition disabled:opacity-60 ${disponible ? "bg-emerald-500" : "bg-slate-600"}`}
                >
                    <span className={`absolute top-1 left-1 size-6 rounded-full bg-white transition-transform ${disponible ? "translate-x-6" : ""}`} />
                </button>
                <div>
                    <p className={`font-semibold ${disponible ? "text-emerald-300" : "text-red-300"}`}>
                        {disponible ? "Disponible" : "No disponible"}
                    </p>
                    <p className="text-sm text-slate-400">
                        {disponible ? "Los clientes te ven disponible en la página de inicio." : "Los clientes te ven como no disponible."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InterruptorDisponibilidad;
