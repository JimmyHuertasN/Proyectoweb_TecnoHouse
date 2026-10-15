import { Navigate, useLocation } from "react-router-dom";
import { useSesion } from "../contexto/ContextoSesion.js";

/* Protege una ruta y, si se indican roles, limita el acceso a esos roles. */
const RutaProtegida = ({ children, rolesPermitidos = [] }) => {
    const { usuario, cargando } = useSesion();
    const ubicacion = useLocation();

    // Supabase tarda un instante en recuperar la sesión guardada: no hay que redirigir antes de tiempo.
    if (cargando) {
        return <p className="p-10 text-center text-slate-400">Cargando...</p>;
    }

    if (!usuario) {
        return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
    }//Esta parte verifica si el usuario está autenticado. Si no lo está, redirige a la página de inicio de sesión y guarda la ubicación actual para poder redirigirlo de vuelta después de iniciar sesión.

    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.rol)) {
        return <Navigate to="/" replace />; //Aqui verifica si se han especificado roles permitidos y si el rol del usuario no está incluido en esa lista. Si es así, redirige al usuario a la página de inicio ("/").
    }

    return children; 
};

export default RutaProtegida;
