import { useEffect, useState } from "react";
import * as api from "../api/tecnico.js";

/* Carga las solicitudes que aún no tienen técnico y permite tomarlas. */
export const usePendientes = () => {
    const [pendientes, setPendientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    // Cada vez que aumenta, se vuelve a pedir la lista (llegan solicitudes nuevas o alguien tomó una).
    const [recargas, setRecargas] = useState(0);

    useEffect(() => {
        let vigente = true;

        api.listarPendientes()
            .then((lista) => {
                if (!vigente) return;
                setPendientes(lista);
                setError(null);
            })
            .catch((errorApi) => vigente && setError(errorApi.message || "No se pudieron cargar las solicitudes pendientes."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [recargas]);

    const recargar = () => setRecargas((anterior) => anterior + 1);

    const tomarServicio = async (id) => {
        await api.aceptarServicio(id);
        setPendientes((actuales) => actuales.filter((solicitud) => solicitud.id !== id));
    };

    return { pendientes, cargando, error, recargar, tomarServicio };
};
