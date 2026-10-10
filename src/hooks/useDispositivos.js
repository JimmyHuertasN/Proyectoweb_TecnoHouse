import { useEffect, useState } from "react";
import * as api from "../api/dispositivos.js";
import { useAuth } from "./useAuth.js";

/*
    Carga los dispositivos del usuario que inició sesión y expone funciones para
    crearlos, editarlos y eliminarlos. Si la API rechaza una operación, el error
    se vuelve a lanzar para que el formulario o la página muestren el mensaje.
*/
export const useDispositivos = () => {
    const { perfil } = useAuth();
    const [dispositivos, setDispositivos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Evita actualizar el estado si el componente se desmontó antes de que llegara la respuesta.
        let vigente = true;

        api.listarDispositivos(perfil.id)
            .then((lista) => vigente && setDispositivos(lista))
            .catch(() => vigente && setError("No se pudieron cargar tus dispositivos."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [perfil.id]);

    const crearDispositivo = async (datos) => {
        const nuevo = await api.crearDispositivo(perfil.id, datos);
        setDispositivos((actuales) => [nuevo, ...actuales]);
        return nuevo;
    };

    const actualizarDispositivo = async (id, datos) => {
        const actualizado = await api.actualizarDispositivo(perfil.id, id, datos);
        setDispositivos((actuales) => actuales.map((item) => (item.id === id ? actualizado : item)));
        return actualizado;
    };

    const eliminarDispositivo = async (id) => {
        await api.eliminarDispositivo(perfil.id, id);
        setDispositivos((actuales) => actuales.filter((item) => item.id !== id));
    };

    return { dispositivos, cargando, error, crearDispositivo, actualizarDispositivo, eliminarDispositivo };
};
