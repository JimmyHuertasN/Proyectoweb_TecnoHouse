import { Navigate, useLocation } from "react-router-dom";
import { useSesion } from "../contexto/ContextoSesion.js";

/* Protege una ruta y, si se indican roles, limita el acceso a esos roles. */
const RutaProtegida = ({ children, rolesPermitidos = [] }) => {
    const { usuario } = useSesion();
    const ubicacion = useLocation();
    
    

    if (!usuario) {
        return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
    }//Esta parte verifica si el usuario está autenticado. Si no lo está, redirige a la página de inicio de sesión y guarda la ubicación actual para poder redirigirlo de vuelta después de iniciar sesión.

    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.rol)) {
        return <Navigate to="/" replace />; //Aqui verifica si se han especificado roles permitidos y si el rol del usuario no está incluido en esa lista. Si es así, redirige al usuario a la página de inicio ("/").
    }

    return children; 
};

export default RutaProtegida;
