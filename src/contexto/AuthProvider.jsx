import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import { supabase, supabaseConfigurado } from "../utilidades/supabase.js";

export const AuthProvider = ({ children }) => {
    const [sesion, setSesion] = useState(null);
    const [cargando, setCargando] = useState(supabaseConfigurado);

    useEffect(() => {
        let activo = true;

        if (!supabaseConfigurado) {
            return () => {
                activo = false;
            };
        }

        const cargarSesion = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error("No se pudo recuperar la sesión de Supabase:", error);
            }
            if (activo) {
                setSesion(data.session);
                setCargando(false);
            }
        };

        cargarSesion();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
            setSesion(nuevaSesion);
            setCargando(false);
        });

        return () => {
            activo = false;
            subscription.unsubscribe();
        };
    }, []);

    const registrar = async ({ nombre, telefono, correo, contrasena }) => {
        if (!supabaseConfigurado) {
            throw new Error("Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env.");
        }

        const { data, error } = await supabase.auth.signUp({
            email: correo,
            password: contrasena,
            options: {
                data: { nombre, telefono },
            },
        });

        if (error) throw error;
        return data;
    };

    const iniciarSesion = async ({ correo, contrasena }) => {
        if (!supabaseConfigurado) {
            throw new Error("Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env.");
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: correo,
            password: contrasena,
        });

        if (error) throw error;
        return data;
    };

    // useCallback mantiene la misma función entre renders: CerrarSesion.jsx la usa dentro de un useEffect.
    const cerrarSesion = useCallback(async () => {
        if (supabaseConfigurado) await supabase.auth.signOut();
    }, []);

    /* Actualiza nombre y teléfono en los metadatos del usuario de Supabase. */
    const actualizarPerfil = async ({ nombre, telefono }) => {
        const { data, error } = await supabase.auth.updateUser({ data: { nombre, telefono } });
        if (error) throw error;
        return data;
    };

    const usuario = sesion?.user ?? null;

    // Datos del usuario en el formato que usa el panel del cliente.
    const perfil = usuario && {
        id: usuario.id,
        nombre: usuario.user_metadata?.nombre || usuario.email,
        correo: usuario.email,
        telefono: usuario.user_metadata?.telefono ?? "",
        creadoEn: usuario.created_at,
    };

    return (
        <AuthContext.Provider value={{ sesion, usuario, perfil, cargando, registrar, iniciarSesion, cerrarSesion, actualizarPerfil }}>
            {children}
        </AuthContext.Provider>
    );
};
