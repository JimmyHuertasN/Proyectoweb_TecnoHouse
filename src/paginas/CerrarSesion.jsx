import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

/*
    Ruta /salir. Se cierra la sesión desde aquí (fuera del panel) porque si se
    hiciera dentro, RutaProtegida vería que ya no hay usuario y mandaría al
    login antes de que alcanzara a llegar la navegación hacia el inicio.
*/
const CerrarSesion = () => {
    const { cerrarSesion } = useAuth();

    useEffect(() => {
        cerrarSesion();
    }, [cerrarSesion]);

    return <Navigate to="/" replace />;
};

export default CerrarSesion;
