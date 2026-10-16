import { useEffect, useState } from "react";
import * as api from "../api/tecnico.js";
import { useSesion } from "../contexto/ContextoSesion.js";

/* Carga los servicios asignados al técnico que inició sesión. */
export const useServiciosAsignados = () => {
    const { usuario } = useSesion();
    const [servicios, setServicios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let vigente = true;

        api.listarAsignados(usuario.id)
            .then((lista) => vigente && setServicios(lista))
            .catch(() => vigente && setError("No se pudieron cargar tus servicios."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [usuario.id]);

    return { servicios, cargando, error };
};
