import { useCallback, useEffect, useRef, useState } from "react";
import ModalConfirmacion from "../componentes/ModalConfirmacion.jsx";
import { ContextoConfirmacion } from "./ContextoConfirmacion.js";

const ProveedorConfirmacion = ({ children }) => {
    const [solicitud, setSolicitud] = useState(null);
    const resolver = useRef(null);

    const terminar = useCallback((resultado) => {
        resolver.current?.(resultado);
        resolver.current = null;
        setSolicitud(null);
    }, []);
    const confirmarAccion = useCallback(() => terminar(true), [terminar]);
    const cancelarAccion = useCallback(() => terminar(false), [terminar]);

    const confirmar = useCallback((opciones) => {
        if (resolver.current) terminar(false);
        return new Promise((resolve) => {
            resolver.current = resolve;
            setSolicitud({ titulo: "Confirmar acción", mensaje: "¿Quieres continuar?", ...opciones });
        });
    }, [terminar]);

    useEffect(() => () => resolver.current?.(false), []);

    return (
        <ContextoConfirmacion.Provider value={confirmar}>
            {children}
            <ModalConfirmacion
                abierto={Boolean(solicitud)}
                titulo={solicitud?.titulo}
                mensaje={solicitud?.mensaje}
                alConfirmar={confirmarAccion}
                alCancelar={cancelarAccion}
            />
        </ContextoConfirmacion.Provider>
    );
};

export default ProveedorConfirmacion;
