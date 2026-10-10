import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

/*
    Envuelve las páginas que requieren sesión. Si no hay usuario, lo manda al
    login y recuerda a qué página quería ir para regresarlo allí después.
*/
const RutaProtegida = ({ children }) => {
    const { perfil, cargando } = useAuth();
    const ubicacion = useLocation();

    // Supabase tarda un instante en recuperar la sesión guardada: no hay que redirigir antes de tiempo.
    if (cargando) {
        return <p className="p-10 text-center text-slate-400">Cargando...</p>;
    }

    if (!perfil) {
        return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
    }

    return children;
};

export default RutaProtegida;
