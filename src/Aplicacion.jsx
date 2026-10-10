import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DisenoPanel from "./componentes/panel/DisenoPanel.jsx";
import RutaProtegida from "./componentes/panel/RutaProtegida.jsx";
import ProveedorSesion from "./contexto/ProveedorSesion.jsx";
import CerrarSesion from "./paginas/CerrarSesion.jsx";
import IniciarSesion from "./paginas/IniciarSesion.jsx";
import Inicio from "./paginas/Inicio.jsx";
import Registro from "./paginas/Registro.jsx";
import DetalleSolicitud from "./paginas/panel/DetalleSolicitud.jsx";
import MisDispositivos from "./paginas/panel/MisDispositivos.jsx";
import MisSolicitudes from "./paginas/panel/MisSolicitudes.jsx";
import NuevaSolicitud from "./paginas/panel/NuevaSolicitud.jsx";
import Perfil from "./paginas/panel/Perfil.jsx";
import ResumenPanel from "./paginas/panel/ResumenPanel.jsx";

const Aplicacion = () => {
    return (
        <ProveedorSesion>
            <BrowserRouter>
                <Routes>
                    {/* Sitio público */}
                    <Route path="/" element={<Inicio />} />
                    <Route path="/login" element={<IniciarSesion />} />
                    <Route path="/registro" element={<Registro />} />
                    <Route path="/salir" element={<CerrarSesion />} />

                    {/* Panel del cliente: todas estas rutas comparten el menú lateral y exigen sesión. */}
                    <Route
                        path="/panel"
                        element={
                            <RutaProtegida>
                                <DisenoPanel />
                            </RutaProtegida>
                        }
                    >
                        <Route index element={<ResumenPanel />} />
                        <Route path="dispositivos" element={<MisDispositivos />} />
                        <Route path="solicitudes" element={<MisSolicitudes />} />
                        <Route path="solicitudes/nueva" element={<NuevaSolicitud />} />
                        <Route path="solicitudes/:codigo" element={<DetalleSolicitud />} />
                        <Route path="perfil" element={<Perfil />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </ProveedorSesion>
    );
};

export default Aplicacion;
