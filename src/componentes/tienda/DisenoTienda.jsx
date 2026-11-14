import { Outlet } from "react-router-dom";
import ProveedorTienda from "../../contexto/ProveedorTienda.jsx";
import PiePagina from "../PiePagina.jsx";
import CarritoLateral from "./CarritoLateral.jsx";
import EncabezadoTienda from "./EncabezadoTienda.jsx";

/* Marco común de /tienda y /tienda/:id. Los productos se cargan una sola vez para ambas. */
const DisenoTienda = () => (
    <ProveedorTienda>
        <EncabezadoTienda />
        <main className="min-h-[60vh]">
            <Outlet />
        </main>
        <CarritoLateral />
        <PiePagina />
    </ProveedorTienda>
);

export default DisenoTienda;
