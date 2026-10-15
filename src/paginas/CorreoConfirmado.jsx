import { Link } from "react-router-dom";
import { errorEnlaceCorreo } from "../api/supabase.js";
import DisenoAutenticacion from "../componentes/DisenoAutenticacion.jsx";
import { useSesion } from "../contexto/ContextoSesion.js";
import { primerNombre } from "../utilidades/formato.js";
import { rutaInicio } from "../utilidades/rutas.js";

/* Ruta /correo-confirmado: aquí llega el enlace del correo de confirmación de la cuenta. */
const CorreoConfirmado = () => {
    const { usuario, cargando } = useSesion();

    if (cargando) {
        return (
            <DisenoAutenticacion antetitulo="Confirmación de cuenta" titulo="Confirmando tu correo..." descripcion="Esto toma solo un momento." />
        );
    }

    if (errorEnlaceCorreo) {
        return (
            <DisenoAutenticacion
                antetitulo="Confirmación de cuenta"
                titulo="El enlace no es válido"
                descripcion="Puede que ya lo hayas usado o que haya expirado. Inicia sesión: si tu cuenta aún no está confirmada, ahí podrás pedir un correo nuevo."
            >
                <Link to="/login" className="boton-primario w-full py-3">Ir a iniciar sesión</Link>
            </DisenoAutenticacion>
        );
    }

    if (usuario) {
        return (
            <DisenoAutenticacion
                antetitulo="Confirmación de cuenta"
                titulo={`¡Bienvenido, ${primerNombre(usuario.nombre)}!`}
                descripcion="Tu correo quedó confirmado y tu cuenta ya está activa."
            >
                <Link to={rutaInicio(usuario.rol)} className="boton-primario w-full py-3">Ir a mi panel</Link>
            </DisenoAutenticacion>
        );
    }

    return (
        <DisenoAutenticacion
            antetitulo="Confirmación de cuenta"
            titulo="¡Correo confirmado!"
            descripcion="Tu cuenta ya está activa. Inicia sesión para continuar."
        >
            <Link to="/login" className="boton-primario w-full py-3">Iniciar sesión</Link>
        </DisenoAutenticacion>
    );
};

export default CorreoConfirmado;
