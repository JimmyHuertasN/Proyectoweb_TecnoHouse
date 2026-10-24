import { BriefcaseBusiness, ChartNoAxesCombined, House, Inbox, Laptop, LayoutDashboard, Package, UserRound, UsersRound, Wrench } from "lucide-react";

/* Menú lateral de cada rol. "accion" es el botón destacado debajo de los enlaces (opcional). */

export const MENU_CLIENTE = {
    inicio: "/cliente",
    enlaces: [
        { ruta: "/cliente", texto: "Resumen", icono: House, exacta: true },
        { ruta: "/cliente/dispositivos", texto: "Mis dispositivos", icono: Laptop },
        { ruta: "/cliente/solicitudes", texto: "Solicitudes", icono: Wrench },
        { ruta: "/cliente/perfil", texto: "Mi perfil", icono: UserRound },
    ],
    accion: { ruta: "/cliente/solicitudes/nueva", texto: "+ Solicitar reparación" },
};

export const MENU_TECNICO = {
    inicio: "/tecnico",
    enlaces: [
        { ruta: "/tecnico/pendientes", texto: "Solicitudes pendientes", icono: Inbox },
        { ruta: "/tecnico/servicios", texto: "Mis servicios", icono: BriefcaseBusiness },
        { ruta: "/tecnico/perfil", texto: "Mi perfil", icono: UserRound },
    ],
};

export const MENU_ADMIN = {
    inicio: "/admin",
    enlaces: [
        { ruta: "/admin", texto: "Dashboard", icono: LayoutDashboard, exacta: true },
        { ruta: "/admin/servicios", texto: "Servicios", icono: Wrench },
        { ruta: "/admin/tecnicos", texto: "Técnicos", icono: BriefcaseBusiness },
        { ruta: "/admin/clientes", texto: "Clientes", icono: UsersRound },
        { ruta: "/admin/catalogo", texto: "Catálogo", icono: Package },
        { ruta: "/admin/estadisticas", texto: "Estadísticas", icono: ChartNoAxesCombined },
    ],
};
