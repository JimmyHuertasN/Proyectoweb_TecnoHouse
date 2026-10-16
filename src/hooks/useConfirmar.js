import { useContext } from "react";
import { ContextoConfirmacion } from "../contexto/ContextoConfirmacion.js";

const useConfirmar = () => {
    const confirmar = useContext(ContextoConfirmacion);
    if (!confirmar) throw new Error("useConfirmar debe usarse dentro de ProveedorConfirmacion.");
    return confirmar;
};

export default useConfirmar;
