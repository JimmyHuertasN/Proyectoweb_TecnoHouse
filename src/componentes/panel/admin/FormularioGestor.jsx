import { useState } from "react";
import { validarDatosPersonales } from "../../../utilidades/validaciones.js";
import Aviso from "../../Aviso.jsx";

const VALORES_INICIALES = { nombre: "", correo: "", telefono: "", contrasena: "" };

const CAMPOS = [
    { nombre: "nombre", etiqueta: "Nombre completo", tipo: "text", placeholder: "Ej. Laura Gómez", autoComplete: "off" },
    { nombre: "correo", etiqueta: "Correo", tipo: "email", placeholder: "gestor@correo.com", autoComplete: "off" },
    { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel", placeholder: "300 123 4567", autoComplete: "off" },
    { nombre: "contrasena", etiqueta: "Contraseña inicial", tipo: "password", placeholder: "Mínimo 8 caracteres", autoComplete: "new-password" },
];

const validar = (valores) => {
    const errorDatos = validarDatosPersonales(valores);
    if (errorDatos) return errorDatos;
    if (valores.contrasena.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    return null;
};

/* Crea una cuenta nueva de gestor. "alCrear" llama al API; si falla, el error se muestra aquí. */
const FormularioGestor = ({ alCrear, alCancelar }) => {
    const [valores, setValores] = useState(VALORES_INICIALES);
    const [verContrasena, setVerContrasena] = useState(false);
    const [error, setError] = useState("");
    const [creando, setCreando] = useState(false);

    const manejarCambio = (evento) => {
        const { name, value } = evento.target;
        setValores((anteriores) => ({ ...anteriores, [name]: value }));
    };

    const manejarEnvio = async (evento) => {
        evento.preventDefault();
        if (creando) return;

        const errorValidacion = validar(valores);
        if (errorValidacion) {
            setError(errorValidacion);
            return;
        }

        setError("");
        setCreando(true);
        try {
            await alCrear({ ...valores, nombre: valores.nombre.trim(), correo: valores.correo.trim().toLowerCase(), telefono: valores.telefono.trim() });
        } catch (errorApi) {
            setError(errorApi.message);
            setCreando(false);
        }
    };

    return (
        <form onSubmit={manejarEnvio} noValidate className="tarjeta mb-8">
            <h2 className="mb-1 text-lg font-semibold">Nuevo gestor de tienda</h2>
            <p className="mb-5 text-sm text-slate-400">Se crea la cuenta ya confirmada para que entre con este correo y contraseña.</p>

            <Aviso texto={error} tipo="error" />

            <div className="grid gap-5 sm:grid-cols-2">
                {CAMPOS.map((campo) => {
                    const esContrasena = campo.nombre === "contrasena";
                    return (
                        <div key={campo.nombre}>
                            <label htmlFor={`gestor-${campo.nombre}`} className="etiqueta">{campo.etiqueta}</label>
                            <input
                                id={`gestor-${campo.nombre}`}
                                name={campo.nombre}
                                type={esContrasena && verContrasena ? "text" : campo.tipo}
                                placeholder={campo.placeholder}
                                autoComplete={campo.autoComplete}
                                maxLength={80}
                                className="campo"
                                value={valores[campo.nombre]}
                                onChange={manejarCambio}
                            />
                            {esContrasena && (
                                <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-[13px] text-slate-400">
                                    <input
                                        type="checkbox"
                                        className="size-4 cursor-pointer accent-marca"
                                        checked={verContrasena}
                                        onChange={(evento) => setVerContrasena(evento.target.checked)}
                                    />
                                    Mostrar contraseña
                                </label>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={alCancelar} className="boton-secundario">Cancelar</button>
                <button type="submit" disabled={creando} className="boton-primario">
                    {creando ? "Creando..." : "Crear gestor"}
                </button>
            </div>
        </form>
    );
};

export default FormularioGestor;
