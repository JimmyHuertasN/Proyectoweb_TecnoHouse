/* Página principal de cada rol después de iniciar sesión. */
const INICIO_POR_ROL = {
    cliente: "/cliente",
    tecnico: "/tecnico",
    admin: "/admin",
    gestor_tienda: "/gestor-tienda",
};

export const rutaInicio = (rol) => INICIO_POR_ROL[rol] ?? "/";

/*
    A dónde lleva "Solicitar reparación". Solo los clientes crean solicitudes:
    sin sesión se invita a registrarse, y los demás roles van a su panel.
*/
export const rutaSolicitarReparacion = (usuario) => {
    if (!usuario) return "/registro";
    return usuario.rol === "cliente" ? "/cliente/solicitudes/nueva" : rutaInicio(usuario.rol);
};

/*
    Las páginas de gestión de la tienda las comparten el administrador y el gestor.
    Cada uno las ve dentro de su propio panel, así que los enlaces dependen del rol.
*/
const SECCIONES_TIENDA = {
    admin: {
        resumen: "/admin",
        catalogo: "/admin/catalogo",
        inventario: "/admin/inventario",
        pedidos: "/admin/pedidos",
        reportes: "/admin/reportes-tienda",
    },
    gestor_tienda: {
        resumen: "/gestor-tienda",
        catalogo: "/gestor-tienda/catalogo",
        inventario: "/gestor-tienda/inventario",
        pedidos: "/gestor-tienda/pedidos",
        reportes: "/gestor-tienda/reportes",
    },
};

export const rutaTienda = (rol, seccion) => SECCIONES_TIENDA[rol]?.[seccion] ?? "/tienda";
