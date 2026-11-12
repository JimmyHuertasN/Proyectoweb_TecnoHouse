/* Cliente HTTP del API ASP.NET. Supabase Auth sigue entregando el JWT de sesión. */
import { obtenerCliente } from "./supabase.js";

const apiUrl = (import.meta.env.VITE_TECNOHOUSE_API_URL ?? "").replace(/\/$/, "");

export const llamarApi = async (ruta, { metodo = "GET", datos, publico = false } = {}) => {
    if (!apiUrl) {
        throw new Error("Configura VITE_TECNOHOUSE_API_URL con la dirección del API TecnoHouse (ver README). ");
    }

    const encabezados = { Accept: "application/json" };
    if (datos !== undefined) encabezados["Content-Type"] = "application/json";

    if (!publico) {
        const { data, error } = await obtenerCliente().auth.getSession();
        if (error) throw new Error(error.message);
        if (!data.session?.access_token) throw new Error("Inicia sesión para consultar los datos de TecnoHouse.");
        encabezados.Authorization = `Bearer ${data.session.access_token}`;
    }

    const respuesta = await fetch(`${apiUrl}${ruta}`, {
        method: metodo,
        headers: encabezados,
        ...(datos === undefined ? {} : { body: JSON.stringify(datos) }),
    });

    const texto = await respuesta.text();
    let resultado = null;
    if (texto) {
        try {
            resultado = JSON.parse(texto);
        } catch {
            resultado = texto;
        }
    }

    if (!respuesta.ok) {
        throw new Error(resultado?.error ?? resultado?.title ?? `El API respondió ${respuesta.status}.`);
    }
    return resultado;
};
