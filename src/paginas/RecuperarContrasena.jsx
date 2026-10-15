import { useState } from "react";
import { Link } from "react-router-dom";
import { enviarRecuperacion } from "../api/usuarios.js";
import Aviso from "../componentes/Aviso.jsx";
import DisenoAutenticacion from "../componentes/DisenoAutenticacion.jsx";
import { esCorreoValido } from "../utilidades/validaciones.js";

/* Ruta /recuperar: pide el correo y envía el enlace para crear una contraseña nueva. */
const RecuperarContrasena = () => {
    const [correo, setCorreo] = useState("");
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
    const [enviando, setEnviando] = useState(false);

    const manejarEnvio = async (evento) => {
        evento.preventDefault();
        const correoNormalizado = correo.trim().toLowerCase();

        if (!esCorreoValido(correoNormalizado)) {
            setMensaje({ texto: "Escribe un correo electrónico válido.", tipo: "error" });
            return;
        }

        setEnviando(true);
        try {
            await enviarRecuperacion(correoNormalizado);
            // El mensaje no confirma si la cuenta existe, para no revelar qué correos están registrados.
            setMensaje({
                texto: `Si ${correoNormalizado} tiene una cuenta, te llegará un correo con el enlace para crear una contraseña nueva.`,
                tipo: "exito",
            });
        } catch (errorApi) {
            setMensaje({ texto: errorApi.message, tipo: "error" });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <DisenoAutenticacion
            antetitulo="Recupera tu acceso"
            titulo="¿Olvidaste tu contraseña?"
            descripcion="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva."
        >
            <Aviso texto={mensaje.texto} tipo={mensaje.tipo} />

            <form className="space-y-5" noValidate onSubmit={manejarEnvio}>
                <div>
                    <label htmlFor="correo-recuperar" className="etiqueta">Correo electrónico</label>
                    <input
                        id="correo-recuperar"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        autoComplete="email"
                        className="campo py-3"
                        value={correo}
                        onChange={(evento) => setCorreo(evento.target.value)}
                        required
                    />
                </div>

                <button className="boton-primario w-full py-3 text-[15px] font-bold" type="submit" disabled={enviando}>
                    {enviando ? "Enviando..." : "Enviar enlace"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
                ¿La recordaste? <Link to="/login" className="font-bold text-marca hover:underline">Inicia sesión</Link>
            </p>
        </DisenoAutenticacion>
    );
};

export default RecuperarContrasena;
