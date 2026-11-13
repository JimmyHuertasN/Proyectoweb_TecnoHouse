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

    // Se guarda la ruta pedida para volver a ella después de iniciar sesión.
    if (!usuario) {
        return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
    }

    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.rol)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RutaProtegida;
