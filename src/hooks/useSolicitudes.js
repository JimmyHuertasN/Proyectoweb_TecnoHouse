import { useEffect, useState } from "react";
import * as api from "../api/solicitudes.js";
import { useSesion } from "../contexto/ContextoSesion.js";

/* Carga las solicitudes del usuario que inició sesión y permite crear nuevas. */
export const useSolicitudes = () => {
    const { usuario } = useSesion();
    const [solicitudes, setSolicitudes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let vigente = true;

        api.listarSolicitudes(usuario.id)
            .then((lista) => vigente && setSolicitudes(lista))
            .catch(() => vigente && setError("No se pudieron cargar tus solicitudes."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [usuario.id]);

    const crearSolicitud = async (datos) => {
        const nueva = await api.crearSolicitud(usuario.id, datos);
        setSolicitudes((actuales) => [nueva, ...actuales]);
        return nueva;
    };

    return { solicitudes, cargando, error, crearSolicitud };
};
