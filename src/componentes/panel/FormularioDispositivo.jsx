import { useState } from "react";
import { TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import Aviso from "../Aviso.jsx";

const VALORES_INICIALES = { tipo: "computador", marca: "", modelo: "", numeroSerie: "" };

/*
    Sirve para registrar y para editar: si recibe "dispositivo", arranca con sus
    datos. "alGuardar" es la función del padre que llama a la API; si lanza un
    error, el mensaje se muestra aquí mismo.
*/
const FormularioDispositivo = ({ dispositivo, alGuardar, alCancelar }) => {
    const [valores, setValores] = useState(() =>
        dispositivo
            ? {
                  tipo: dispositivo.tipo,
                  marca: dispositivo.marca,
                  modelo: dispositivo.modelo,
                  numeroSerie: dispositivo.numeroSerie,
              }
            : VALORES_INICIALES
    );
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);

    const manejarCambio = (evento) => {
        const { name, value } = evento.target;
        setValores((anteriores) => ({ ...anteriores, [name]: value }));
    };

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        if (!valores.marca.trim() || !valores.modelo.trim()) {
            setError("La marca y el modelo son obligatorios.");
            return;
        }

        setError("");
        setGuardando(true);

        try {
            await alGuardar(valores);
            // Si todo salió bien, el padre cierra el formulario.
        } catch (errorApi) {
            setError(errorApi.message);
            setGuardando(false);
        }
    };

    return (
        <form onSubmit={manejarEnvio} noValidate className="tarjeta mb-8">
            <h2 className="mb-5 text-lg font-semibold">{dispositivo ? "Editar dispositivo" : "Registrar dispositivo"}</h2>

            <Aviso texto={error} tipo="error" />

            <fieldset className="mb-5">
                <legend className="etiqueta">Tipo de dispositivo</legend>
                <div className="grid grid-cols-3 gap-3">
                    {TIPOS_DISPOSITIVO.map((tipo) => (
                        <label
                            key={tipo.valor}
                            className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-slate-600 p-3 text-sm transition hover:border-slate-400 has-checked:border-marca has-checked:bg-marca/10 has-checked:text-marca has-focus-visible:ring-2 has-focus-visible:ring-marca"
                        >
                            <input
                                type="radio"
                                name="tipo"
                                value={tipo.valor}
                                checked={valores.tipo === tipo.valor}
                                onChange={manejarCambio}
                                className="sr-only"
                            />
                            <tipo.icono className="size-6 text-marca" aria-hidden="true" />
                            {tipo.etiqueta}
                        </label>
                    ))}
                </div>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="marca" className="etiqueta">Marca</label>
                    <input id="marca" name="marca" className="campo" placeholder="Ej. Lenovo" maxLength={40} value={valores.marca} onChange={manejarCambio} />
                </div>
                <div>
                    <label htmlFor="modelo" className="etiqueta">Modelo</label>
                    <input id="modelo" name="modelo" className="campo" placeholder="Ej. IdeaPad 3" maxLength={40} value={valores.modelo} onChange={manejarCambio} />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="numeroSerie" className="etiqueta">
                        Número de serie <span className="font-normal text-slate-500">(opcional)</span>
                    </label>
                    <input
                        id="numeroSerie"
                        name="numeroSerie"
                        className="campo"
                        placeholder="Lo encuentras en la etiqueta del equipo o en Ajustes"
                        maxLength={40}
                        value={valores.numeroSerie}
                        onChange={manejarCambio}
                    />
                </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={alCancelar} className="boton-secundario">Cancelar</button>
                <button type="submit" disabled={guardando} className="boton-primario">
                    {guardando ? "Guardando..." : dispositivo ? "Guardar cambios" : "Registrar dispositivo"}
                </button>
            </div>
        </form>
    );
};

export default FormularioDispositivo;
