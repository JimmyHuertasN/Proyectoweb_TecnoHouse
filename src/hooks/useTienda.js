import { useContext } from "react";
import { ContextoTienda } from "../contexto/ContextoTienda.js";

const useTienda = () => {
    const tienda = useContext(ContextoTienda);
    if (!tienda) throw new Error("useTienda debe usarse dentro de ProveedorTienda.");
    return tienda;
};

export default useTienda;
