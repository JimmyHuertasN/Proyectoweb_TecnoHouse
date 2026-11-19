import { useState } from "react";
import Aviso from "../Aviso.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import useToast from "../../hooks/useToast.js";
import { validarDatosPersonales } from "../../utilidades/validaciones.js";

/* El correo es la cuenta de Supabase: cambiarlo exige confirmación por email, por eso no se edita aquí. */
const CAMPOS = [
    { nombre: "nombre", etiqueta: "Nombre completo", tipo: "text", autoComplete: "name", editable: true },
    { nombre: "correo", etiqueta: "Correo electrónico", tipo: "email", autoComplete: "email", editable: false },
    { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel", autoComplete: "tel", editable: true },
];

/* Nombre y teléfono de la cuenta con sesión. Lo usan los perfiles del cliente y del gestor de tienda. */
const FormularioDatosPersonales = ({ className = "" }) => {
    const { usuario, actualizarPerfil } = useSesion();
    const toast = useToast();

    const [editando, setEditando] = useState(false);
    const [valores, setValores] = useState({ nombre: usuario.nombre, telefono: usuario.telefono ?? "" });
    const [aviso, setAviso] = useState({ texto: "", tipo: "" });
    const [guardando, setGuardando] = useState(false);

    const manejarCambio = (evento) => {
        const { name, value } = evento.target;
        setValores((anteriores) => ({ ...anteriores, [name]: value }));
    };

    const empezarEdicion = () => {
        setAviso({ texto: "", tipo: "" });
        setEditando(true);
    };

    const cancelarEdicion = () => {
        setValores({ nombre: usuario.nombre, telefono: usuario.telefono ?? "" });
        setAviso({ texto: "", tipo: "" });
        setEditando(false);
    };

    const manejarEnvio = async (evento) => {
        evento.preventDefault();
        if (guardando) return;

        const datos = {
            nombre: valores.nombre.trim(),
            telefono: valores.telefono.trim(),
        };

        const errorValidacion = validarDatosPersonales({ ...datos, correo: usuario.correo });
        if (errorValidacion) {
            setAviso({ texto: errorValidacion, tipo: "error" });
            return;
        }

        setGuardando(true);
        try {
            await actualizarPerfil(datos);
            setAviso({ texto: "", tipo: "" });
            toast.exito("Tus datos se actualizaron correctamente.");
            setEditando(false);
        } catch (errorApi) {
            setAviso({ texto: errorApi.message, tipo: "error" });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <form onSubmit={manejarEnvio} noValidate className={`tarjeta ${className}`}>
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Información personal</h2>
                {!editando && (
                    <button type="button" onClick={empezarEdicion} className="boton-secundario px-3 py-2">
                        Editar
                    </button>
                )}
            </div>

            <Aviso texto={aviso.texto} tipo={aviso.tipo} />

            <div className="grid gap-5 sm:grid-cols-2">
                {CAMPOS.map((campo) => (
                    <div key={campo.nombre} className={campo.nombre === "nombre" ? "sm:col-span-2" : ""}>
                        {editando && campo.editable ? (
                            <>
                                <label htmlFor={`perfil-${campo.nombre}`} className="etiqueta">{campo.etiqueta}</label>
                                <input
                                    id={`perfil-${campo.nombre}`}
                                    name={campo.nombre}
                                    type={campo.tipo}
                                    autoComplete={campo.autoComplete}
                                    className="campo"
                                    value={valores[campo.nombre]}
                                    onChange={manejarCambio}
                                />
                            </>
                        ) : (
                            <>
                                <p className="etiqueta">{campo.etiqueta}</p>
                                <p className="border border-transparent py-2.5 break-words">
                                    {usuario[campo.nombre] || <span className="text-slate-500">Sin registrar</span>}
                                </p>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {editando && (
                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-borde pt-6 sm:flex-row sm:justify-end">
                    <button type="button" onClick={cancelarEdicion} className="boton-secundario">Cancelar</button>
                    <button type="submit" disabled={guardando} className="boton-primario">
                        {guardando ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            )}
        </form>
    );
};

export default FormularioDatosPersonales;
