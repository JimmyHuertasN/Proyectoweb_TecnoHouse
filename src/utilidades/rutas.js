/* Página principal de cada rol después de iniciar sesión. */
const INICIO_POR_ROL = {
    cliente: "/cliente",
    tecnico: "/tecnico",
    admin: "/admin",
};

export const rutaInicio = (rol) => INICIO_POR_ROL[rol] ?? "/";
