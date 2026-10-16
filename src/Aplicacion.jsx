import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import DisenoPanel from "./componentes/panel/DisenoPanel.jsx";
import RutaProtegida from "./componentes/RutaProtegida.jsx";
import ProveedorSesion from "./contexto/ProveedorSesion.jsx";
import { MENU_ADMIN, MENU_CLIENTE, MENU_TECNICO } from "./datos/menus.js";
import CerrarSesion from "./paginas/CerrarSesion.jsx";
import CorreoConfirmado from "./paginas/CorreoConfirmado.jsx";
import IniciarSesion from "./paginas/IniciarSesion.jsx";
import Inicio from "./paginas/Inicio.jsx";
import NuevaContrasena from "./paginas/NuevaContrasena.jsx";
import RecuperarContrasena from "./paginas/RecuperarContrasena.jsx";
import Registro from "./paginas/Registro.jsx";
import Dashboard from "./paginas/admin/Dashboard.jsx";
import DetalleServicioAdmin from "./paginas/admin/DetalleServicioAdmin.jsx";
import GestionTecnicos from "./paginas/admin/GestionTecnicos.jsx";
import TodosLosServicios from "./paginas/admin/TodosLosServicios.jsx";
import DetalleSolicitud from "./paginas/panel/DetalleSolicitud.jsx";
import MisDispositivos from "./paginas/panel/MisDispositivos.jsx";
import MisSolicitudes from "./paginas/panel/MisSolicitudes.jsx";
import NuevaSolicitud from "./paginas/panel/NuevaSolicitud.jsx";
import Perfil from "./paginas/panel/Perfil.jsx";
import ResumenPanel from "./paginas/panel/ResumenPanel.jsx";
import DetalleServicio from "./paginas/tecnico/DetalleServicio.jsx";
import MisServicios from "./paginas/tecnico/MisServicios.jsx";
import PerfilTecnico from "./paginas/tecnico/PerfilTecnico.jsx";
import SolicitudesPendientes from "./paginas/tecnico/SolicitudesPendientes.jsx";

const RedireccionPanel = () => {
    const { pathname, search } = useLocation();
    return <Navigate to={pathname.replace(/^\/panel/, "/cliente") + search} replace />;
};

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
                    <Route path="/recuperar" element={<RecuperarContrasena />} />
                    <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
                    <Route path="/correo-confirmado" element={<CorreoConfirmado />} />

                    {/* Panel del cliente: todas estas rutas comparten el menú lateral y exigen sesión. */}
                    <Route
                        path="/cliente"
                        element={
                            <RutaProtegida rolesPermitidos={["cliente"]}>
                                <DisenoPanel menu={MENU_CLIENTE} />
                            </RutaProtegida>
                        }
                    >
                        <Route index element={<ResumenPanel />} />
                        <Route path="dispositivos" element={<MisDispositivos />} />
                        <Route path="solicitudes" element={<MisSolicitudes />} />
                        <Route path="solicitudes/nueva" element={<NuevaSolicitud />} />
                        <Route path="solicitudes/:id" element={<DetalleSolicitud />} />
                        <Route path="perfil" element={<Perfil />} />
                    </Route>

                    {/* Conserva los enlaces viejos: /panel/perfil lleva a /cliente/perfil, etc. */}
                    <Route path="/panel/*" element={<RedireccionPanel />} />

                    {/* Panel del técnico. */}
                    <Route
                        path="/tecnico"
                        element={
                            <RutaProtegida rolesPermitidos={["tecnico"]}>
                                <DisenoPanel menu={MENU_TECNICO} />
                            </RutaProtegida>
                        }
                    >
                        <Route index element={<Navigate to="pendientes" replace />} />
                        <Route path="pendientes" element={<SolicitudesPendientes />} />
                        <Route path="servicios" element={<MisServicios />} />
                        <Route path="servicios/:id" element={<DetalleServicio />} />
                        <Route path="perfil" element={<PerfilTecnico />} />
                    </Route>

                    {/* Panel del administrador. */}
                    <Route
                        path="/admin"
                        element={
                            <RutaProtegida rolesPermitidos={["admin"]}>
                                <DisenoPanel menu={MENU_ADMIN} />
                            </RutaProtegida>
                        }
                    >
                        <Route index element={<Dashboard />} />
                        <Route path="servicios" element={<TodosLosServicios />} />
                        <Route path="servicios/:id" element={<DetalleServicioAdmin />} />
                        <Route path="tecnicos" element={<GestionTecnicos />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </ProveedorSesion>
    );
};

export default Aplicacion;
