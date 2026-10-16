import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseConfigurado } from "../api/supabase.js";
import * as apiUsuarios from "../api/usuarios.js";
import { ContextoSesion } from "./ContextoSesion.js";

/*
    Mantiene en un solo lugar quién inició sesión. Supabase guarda la sesión en
    el navegador y avisa cada vez que cambia (entrar, salir, renovar el token);
    con cada aviso se vuelve a leer el perfil, que es donde está el rol.
*/
const ProveedorSesion = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    // Mientras Supabase recupera la sesión guardada no se sabe si hay usuario: RutaProtegida espera.
    const [cargando, setCargando] = useState(supabaseConfigurado);

    useEffect(() => {
        if (!supabase) return;

        const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
            // Supabase pide no esperar otras consultas dentro de este aviso: por eso se agenda aparte.
            setTimeout(async () => {
                setUsuario(sesion ? await apiUsuarios.obtenerPerfil(sesion.user) : null);
                setCargando(false);
            }, 0);
        });

        return () => data.subscription.unsubscribe();
    }, []);

    // El administrador puede cambiar el rol de alguien con la sesión abierta (por ejemplo, desactivar
    // a un técnico): al volver a la pestaña se lee de nuevo el perfil y RutaProtegida aplica el rol nuevo.
    useEffect(() => {
        if (!supabase) return;

        const actualizarAlVolver = async () => {
            if (document.visibilityState !== "visible") return;
            const { data } = await supabase.auth.getSession();
            if (data.session) setUsuario(await apiUsuarios.obtenerPerfil(data.session.user));
        };

        document.addEventListener("visibilitychange", actualizarAlVolver);
        return () => document.removeEventListener("visibilitychange", actualizarAlVolver);
    }, []);

    const iniciarSesion = async (correo, contrasena) => {
        const perfil = await apiUsuarios.iniciarSesion(correo, contrasena);
        setUsuario(perfil);
        return perfil;
    };

    const actualizarPerfil = async (datos) => {
        await apiUsuarios.actualizarPerfil(usuario.id, datos);
        setUsuario((actual) => ({ ...actual, ...datos }));
    };

    // useCallback mantiene la misma función entre renders: CerrarSesion.jsx la usa dentro de un useEffect.
    const cerrarSesion = useCallback(async () => {
        await apiUsuarios.cerrarSesion();
        setUsuario(null);
    }, []);

    return (
        <ContextoSesion.Provider value={{ usuario, cargando, iniciarSesion, actualizarPerfil, cerrarSesion }}>
            {children}
        </ContextoSesion.Provider>
    );
};

export default ProveedorSesion;
