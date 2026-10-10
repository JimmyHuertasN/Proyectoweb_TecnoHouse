/*
    almacenamiento.js
    Almacenamiento temporal de dispositivos y solicitudes: cada clave de
    localStorage hace el papel de una tabla. Los módulos de src/api son los
    únicos que lo usan; las páginas y componentes nunca tocan localStorage.

    Las cuentas de usuario ya viven en Supabase. Cuando existan las tablas de
    dispositivos y solicitudes, se cambian las funciones de src/api por
    consultas a Supabase y el resto de la aplicación sigue funcionando igual.
*/

export const CLAVES = {
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

/* Identificador único corto. Un backend real lo generaría en la base de datos. */
export const generarId = () => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};
