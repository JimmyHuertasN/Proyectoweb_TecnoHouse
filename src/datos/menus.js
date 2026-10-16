/* Menú lateral de cada rol. "accion" es el botón destacado debajo de los enlaces (opcional). */

export const MENU_CLIENTE = {
    inicio: "/cliente",
    enlaces: [
        { ruta: "/cliente", texto: "Resumen", icono: "🏠", exacta: true },
        { ruta: "/cliente/dispositivos", texto: "Mis dispositivos", icono: "💻" },
        { ruta: "/cliente/solicitudes", texto: "Solicitudes", icono: "🛠️" },
        { ruta: "/cliente/perfil", texto: "Mi perfil", icono: "👤" },
    ],
    accion: { ruta: "/cliente/solicitudes/nueva", texto: "+ Solicitar reparación" },
};

export const MENU_TECNICO = {
    inicio: "/tecnico",
    enlaces: [
        { ruta: "/tecnico/pendientes", texto: "Solicitudes pendientes", icono: "📥" },
        { ruta: "/tecnico/servicios", texto: "Mis servicios", icono: "🧰" },
        { ruta: "/tecnico/perfil", texto: "Mi perfil", icono: "👤" },
    ],
};
