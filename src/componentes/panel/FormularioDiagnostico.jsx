import { useState } from "react";
import Aviso from "../Aviso.jsx";

const VALORES_INICIALES = { hallazgos: "", recomendaciones: "" };

/* "alGuardar" la recibe del padre, que llama a la API. Si falla, el error se muestra en el formulario. */
const FormularioDiagnostico = ({ alGuardar }) => {
    const [valores, setValores] = useState(VALORES_INICIALES);
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);

    const manejarCambio = (evento) => {
        const { name, value } = evento.target;
        setValores((anteriores) => ({ ...anteriores, [name]: value }));
    };

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        if (!valores.hallazgos.trim()) {
            setError("Describe qué encontraste en el equipo.");
            return;
        }

        setError("");
        setGuardando(true);

        try {
            await alGuardar(valores);
            setValores(VALORES_INICIALES);
        } catch (errorApi) {
            setError(errorApi.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <form onSubmit={manejarEnvio} noValidate className="tarjeta">
            <h2 className="mb-4 text-lg font-semibold">1. Registrar diagnóstico</h2>
            <Aviso texto={error} tipo="error" />

            <label htmlFor="hallazgos" className="etiqueta">Hallazgos</label>
            <textarea
                id="hallazgos"
                name="hallazgos"
                rows={3}
                maxLength={500}
                className="campo resize-y"
                placeholder="Ej. El ventilador está obstruido y la pasta térmica del procesador está seca."
                value={valores.hallazgos}
                onChange={manejarCambio}
            />

            <label htmlFor="recomendaciones" className="etiqueta mt-4">
                Recomendaciones <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <textarea
                id="recomendaciones"
                name="recomendaciones"
                rows={2}
                maxLength={500}
                className="campo resize-y"
                placeholder="Ej. Limpieza interna y cambio de pasta térmica."
                value={valores.recomendaciones}
                onChange={manejarCambio}
            />

            <div className="mt-4 flex justify-end">
                <button type="submit" disabled={guardando} className="boton-primario">
                    {guardando ? "Guardando..." : "Guardar diagnóstico"}
                </button>
            </div>
        </form>
    );
};

export default FormularioDiagnostico;
