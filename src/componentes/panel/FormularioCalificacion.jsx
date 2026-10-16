import { useState } from "react";
import { buscarOpcion, NIVELES_CALIFICACION } from "../../datos/opciones.js";
import Aviso from "../Aviso.jsx";

const LONGITUD_MAXIMA_COMENTARIO = 300;

const SelectorEstrellas = ({ puntuacion, alElegir }) => (
    <div className="flex gap-1">
        {NIVELES_CALIFICACION.map((nivel) => (
            <label
                key={nivel.valor}
                title={nivel.etiqueta}
                className={`cursor-pointer text-4xl transition hover:scale-110 has-focus-visible:rounded has-focus-visible:ring-2 has-focus-visible:ring-marca ${
                    nivel.valor <= puntuacion ? "text-amber-400" : "text-slate-600"
                }`}
            >
                <input
                    type="radio"
                    name="puntuacion"
                    value={nivel.valor}
                    checked={puntuacion === nivel.valor}
                    onChange={() => alElegir(nivel.valor)}
                    className="sr-only"
                />
                <span aria-hidden="true">★</span>
                <span className="sr-only">{nivel.valor} de 5: {nivel.etiqueta}</span>
            </label>
        ))}
    </div>
);

/* "alCalificar" la recibe del padre, que llama a la API. Si falla, el error se muestra en el formulario. */
const FormularioCalificacion = ({ alCalificar }) => {
    const [puntuacion, setPuntuacion] = useState(0);
    const [comentario, setComentario] = useState("");
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        if (puntuacion === 0) {
            setError("Elige de 1 a 5 estrellas.");
            return;
        }

        setError("");
        setEnviando(true);

        try {
            await alCalificar({ puntuacion, comentario });
        } catch (errorApi) {
            setError(errorApi.message);
            setEnviando(false);
        }
    };

    return (
        <form onSubmit={manejarEnvio} noValidate className="tarjeta mb-6 border-amber-500/50">
            <h2 className="text-lg font-semibold">¿Cómo te fue con el servicio?</h2>
            <p className="mb-5 text-sm text-slate-400">Tu calificación ayuda a otros clientes a elegir técnico.</p>

            <Aviso texto={error} tipo="error" />

            <fieldset className="mb-5">
                <legend className="etiqueta">Calificación</legend>
                <SelectorEstrellas puntuacion={puntuacion} alElegir={setPuntuacion} />
                <p className="mt-1 h-5 text-sm text-amber-300">{puntuacion > 0 && buscarOpcion(NIVELES_CALIFICACION, puntuacion).etiqueta}</p>
            </fieldset>

            <label htmlFor="comentario" className="etiqueta">
                Comentario <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <textarea
                id="comentario"
                rows={3}
                maxLength={LONGITUD_MAXIMA_COMENTARIO}
                className="campo resize-y"
                placeholder="Ej. El técnico fue muy amable y entregó el equipo antes de lo prometido."
                value={comentario}
                onChange={(evento) => setComentario(evento.target.value)}
            />
            <p className="mt-1 text-right text-xs text-slate-500">
                {comentario.length}/{LONGITUD_MAXIMA_COMENTARIO}
            </p>

            <div className="mt-4 flex justify-end">
                <button type="submit" disabled={enviando} className="boton-primario">
                    {enviando ? "Enviando..." : "Enviar calificación"}
                </button>
            </div>
        </form>
    );
};

export default FormularioCalificacion;
