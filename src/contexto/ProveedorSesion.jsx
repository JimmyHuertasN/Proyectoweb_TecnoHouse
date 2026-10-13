import { useCallback, useState } from "react";
import { CLAVES, eliminar, guardar, leer } from "../api/almacenamiento.js";
import * as apiUsuarios from "../api/usuarios.js";
import { ContextoSesion } from "./ContextoSesion.js";

/* Las sesiones guardadas por la versión anterior no tienen id: se descartan y el usuario vuelve a entrar. */
const leerSesionGuardada = () => {
    const sesion = leer(CLAVES.sesion, null);
    return sesion?.id ? { ...sesion, rol: sesion.rol ?? "cliente" } : null; /*Verifica si el rol marcado por el usuario pertece a esa cuenta*/
}; 

const ProveedorSesion = ({ children }) => {
    const [usuario, setUsuario] = useState(leerSesionGuardada);

    const recordarUsuario = (datos) => {
        guardar(CLAVES.sesion, datos);
        setUsuario(datos);
        return datos;
    };

    const iniciarSesion = async (correo, contrasena) => {
        return recordarUsuario(await apiUsuarios.iniciarSesion(correo, contrasena));
    };

    const actualizarPerfil = async (datos) => {
        return recordarUsuario(await apiUsuarios.actualizarUsuario(usuario.id, datos));
    };

    // useCallback mantiene la misma función entre renders: CerrarSesion.jsx la usa dentro de un useEffect.
    const cerrarSesion = useCallback(() => {
        eliminar(CLAVES.sesion);
        setUsuario(null);
    }, []);

    return (
        <ContextoSesion.Provider value={{ usuario, iniciarSesion, actualizarPerfil, cerrarSesion }}>
            {children}
        </ContextoSesion.Provider>
    );
};

export default ProveedorSesion;
