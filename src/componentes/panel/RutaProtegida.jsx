import { Navigate, useLocation } from "react-router-dom";
import { useSesion } from "../../contexto/ContextoSesion.js";

/*
    Envuelve las páginas que requieren sesión. Si no hay usuario, lo manda al
    login y recuerda a qué página quería ir para regresarlo allí después.
*/
const RutaProtegida = ({ children }) => {
    const { usuario } = useSesion();
    const ubicacion = useLocation();

    if (!usuario) {
        return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
    }

    return children;
};

export default RutaProtegida;
