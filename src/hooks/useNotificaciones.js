import { useCallback, useEffect, useState } from "react";
import * as apiNotificaciones from "../api/notificaciones.js";
import { useSesion } from "../contexto/ContextoSesion.js";

/* Mantiene los avisos y su contador sincronizados con Supabase Realtime. */
const useNotificaciones = () => {
    const { usuario } = useSesion();
    // Guarda el contenido del menú y el total global de avisos pendientes.
    const [notificaciones, setNotificaciones] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    // Consulta de nuevo la lista y el contador después de una acción del usuario.
    const recargar = useCallback(async () => {
        try {
            const [lista, cantidad] = await Promise.all([
                apiNotificaciones.listarNotificaciones(usuario.id),
                apiNotificaciones.contarNoLeidas(usuario.id),
            ]);
            setNotificaciones(lista);
            setNoLeidas(cantidad);
            setError("");
        } catch (errorApi) {
            setError(errorApi.message);
        } finally {
            setCargando(false);
        }
    }, [usuario.id]);

    // Carga el estado inicial y vuelve a consultarlo cuando Realtime avisa de un cambio.
    useEffect(() => {
        let vigente = true;
        let temporizador = null;
        const actualizar = async () => {
            try {
                const [lista, cantidad] = await Promise.all([
                    apiNotificaciones.listarNotificaciones(usuario.id),
                    apiNotificaciones.contarNoLeidas(usuario.id),
                ]);
                if (vigente) {
                    setNotificaciones(lista);
                    setNoLeidas(cantidad);
                    setError("");
                }
            } catch (errorApi) {
                if (vigente) setError(errorApi.message);
            } finally {
                if (vigente) setCargando(false);
            }
        };

        // Agrupa los eventos que Supabase emite al marcar varias notificaciones a la vez.
        const programarActualizacion = () => {
            window.clearTimeout(temporizador);
            temporizador = window.setTimeout(actualizar, 120);
        };

        setCargando(true);
        actualizar();
        const cancelar = apiNotificaciones.suscribirNotificaciones(usuario.id, programarActualizacion);
        return () => {
            vigente = false;
            window.clearTimeout(temporizador);
            cancelar();
        };
    }, [usuario.id]);

    // Actualiza un aviso y sincroniza los datos locales.
    const marcarUna = useCallback(async (id) => {
        await apiNotificaciones.marcarLeida(usuario.id, id);
        await recargar();
    }, [usuario.id, recargar]);

    // Actualiza todos los avisos pendientes del usuario.
    const marcarTodas = useCallback(async () => {
        await apiNotificaciones.marcarTodasLeidas(usuario.id);
        await recargar();
    }, [usuario.id, recargar]);

    return { notificaciones, noLeidas, cargando, error, marcarUna, marcarTodas, recargar };
};

export default useNotificaciones;
