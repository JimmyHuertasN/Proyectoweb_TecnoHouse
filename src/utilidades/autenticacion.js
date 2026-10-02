/*
    auth.js
    Helpers de registro e inicio de sesión de TecnoHouse.
    Los usuarios se guardan en el localStorage del navegador bajo la
    clave "usuarios", y el usuario que inicia sesión queda en "usuarioActivo".
*/

export const CLAVE_USUARIOS = "usuarios";
export const CLAVE_USUARIO_ACTIVO = "usuarioActivo";

/* Devuelve la lista de usuarios guardados; si no hay nada, devuelve un arreglo vacío. */
export const ObtenerUsuarios = () => {
    const guardados = localStorage.getItem(CLAVE_USUARIOS);
    return guardados ? JSON.parse(guardados) : [];
};

/* Guarda la lista completa de usuarios en el localStorage. */
export const GuardarUsuarios = (usuarios) => {
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
};

/* Busca un usuario por correo. Se normaliza a minúsculas para evitar duplicados. */
export const BuscarUsuario = (correo) => {
    return ObtenerUsuarios().find(usuario => usuario.correo === correo.trim().toLowerCase());
};
