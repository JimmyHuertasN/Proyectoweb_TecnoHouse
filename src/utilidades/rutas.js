/* Página principal de cada rol después de iniciar sesión. */
const INICIO_POR_ROL = {
    cliente: "/cliente",
    tecnico: "/tecnico",
    admin: "/admin",
};

export const rutaInicio = (rol) => INICIO_POR_ROL[rol] ?? "/";

/*
    A dónde lleva "Solicitar reparación". Solo los clientes crean solicitudes:
    sin sesión se invita a registrarse, y técnico o administrador van a su panel.
*/
export const rutaSolicitarReparacion = (usuario) => {
    if (!usuario) return "/registro";
    return usuario.rol === "cliente" ? "/cliente/solicitudes/nueva" : rutaInicio(usuario.rol);
};
