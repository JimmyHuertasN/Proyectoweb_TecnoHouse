import { useContext } from "react";
import { ContextoToast } from "../contexto/ContextoToast.js";

const useToast = () => {
    const toast = useContext(ContextoToast);
    if (!toast) throw new Error("useToast debe usarse dentro de ProveedorToast.");
    return toast;
};

export default useToast;
