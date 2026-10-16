import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "../componentes/Toast.jsx";
import { ContextoToast } from "./ContextoToast.js";

const DURACION_TOAST = 5000;

const ProveedorToast = ({ children }) => {
    const [notificaciones, setNotificaciones] = useState([]);
    const temporizadores = useRef(new Map());

    useEffect(() => () => temporizadores.current.forEach((temporizador) => window.clearTimeout(temporizador)), []);

    const cerrar = useCallback((id) => {
        window.clearTimeout(temporizadores.current.get(id));
        temporizadores.current.delete(id);
        setNotificaciones((actuales) => actuales.filter((notificacion) => notificacion.id !== id));
    }, []);

    const mostrar = useCallback((tipo, mensaje) => {
        if (!mensaje) return;
        const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
        setNotificaciones((actuales) => [...actuales, { id, tipo, mensaje: String(mensaje) }]);
        temporizadores.current.set(id, window.setTimeout(() => cerrar(id), DURACION_TOAST));
    }, [cerrar]);

    const toast = {
        exito: (mensaje) => mostrar("exito", mensaje),
        error: (mensaje) => mostrar("error", mensaje),
        informacion: (mensaje) => mostrar("informacion", mensaje),
    };

    return (
        <ContextoToast.Provider value={toast}>
            {children}
            <Toast notificaciones={notificaciones} alCerrar={cerrar} />
        </ContextoToast.Provider>
    );
};

export default ProveedorToast;
