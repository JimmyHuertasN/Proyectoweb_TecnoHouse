import {
    BriefcaseBusiness,
    ChartNoAxesCombined,
    ClipboardList,
    House,
    Inbox,
    Laptop,
    LayoutDashboard,
    PackageSearch,
    ShoppingCart,
    Store,
    UserCog,
    UserRound,
    UsersRound,
    Wrench,
} from "lucide-react";

/* Menú lateral de cada rol. "accion" es el botón destacado debajo de los enlaces (opcional). */

export const MENU_CLIENTE = {
    inicio: "/cliente",
    enlaces: [
        { ruta: "/cliente", texto: "Resumen", icono: House, exacta: true },
        { ruta: "/cliente/pedidos", texto: "Mis pedidos", icono: ShoppingCart },
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
        { ruta: "/admin/gestores", texto: "Gestores de tienda", icono: UserCog },
        { ruta: "/admin/catalogo", texto: "Tienda", icono: Store },
        { ruta: "/admin/inventario", texto: "Inventario", icono: PackageSearch },
        { ruta: "/admin/pedidos", texto: "Pedidos", icono: ShoppingCart },
        { ruta: "/admin/reportes-tienda", texto: "Reportes de tienda", icono: ClipboardList },
        { ruta: "/admin/estadisticas", texto: "Estadísticas", icono: ChartNoAxesCombined },
    ],
};

export const MENU_GESTOR_TIENDA = {
    inicio: "/gestor-tienda",
    enlaces: [
        { ruta: "/gestor-tienda", texto: "Resumen", icono: LayoutDashboard, exacta: true },
        { ruta: "/gestor-tienda/catalogo", texto: "Productos", icono: Store },
        { ruta: "/gestor-tienda/inventario", texto: "Inventario", icono: PackageSearch },
        { ruta: "/gestor-tienda/pedidos", texto: "Pedidos", icono: ShoppingCart },
        { ruta: "/gestor-tienda/reportes", texto: "Reportes", icono: ClipboardList },
        { ruta: "/gestor-tienda/perfil", texto: "Mi perfil", icono: UserRound },
    ],
};
