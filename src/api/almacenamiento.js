/*
    almacenamiento.js
    Base de datos "de mentira" del proyecto: cada clave de localStorage hace
    el papel de una tabla. Los módulos de src/api son los únicos que la usan;
    las páginas y componentes nunca tocan localStorage directamente.

    Cuando exista el backend, se cambian las funciones de src/api por llamadas
    con fetch y el resto de la aplicación sigue funcionando igual.
*/

export const CLAVES = {
    usuarios: "usuarios",
    sesion: "usuarioActivo",
    dispositivos: "dispositivos",
    solicitudes: "solicitudes",
};

/* Lee y convierte el JSON guardado. Si no existe o está dañado, devuelve el valor por defecto. */
export const leer = (clave, valorPorDefecto) => {
    try {
        const guardado = localStorage.getItem(clave);
        return guardado ? JSON.parse(guardado) : valorPorDefecto;
    } catch {
        return valorPorDefecto;
    }
};

export const guardar = (clave, valor) => {
    localStorage.setItem(clave, JSON.stringify(valor));
};

export const eliminar = (clave) => {
    localStorage.removeItem(clave);
};

/* Identificador único corto. Un backend real lo generaría en la base de datos. */
export const generarId = () => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};
