import { createContext, useContext } from "react";

/*
    Contexto que comparte el usuario que inició sesión con toda la aplicación,
    sin tener que pasarlo por props de componente en componente.
    El valor lo provee <ProveedorSesion> (ver ProveedorSesion.jsx).
*/
export const ContextoSesion = createContext(null);

export const useSesion = () => {
    const contexto = useContext(ContextoSesion);
    if (!contexto) {
        throw new Error("useSesion debe usarse dentro de <ProveedorSesion>.");
    }
    return contexto;
};
