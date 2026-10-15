/*
    supabase.js
    Cliente de Supabase que usan todos los módulos de src/api. Las páginas y
    los componentes nunca llaman a Supabase directamente: siempre pasan por
    src/api, así la forma de guardar los datos queda en un solo lugar.

    La URL y la clave pública se leen del archivo .env (ver README).
*/
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const clavePublica = import.meta.env.VITE_SUPABASE_ANON_KEY;

/*
    Los enlaces de los correos de Supabase (confirmar cuenta, recuperar contraseña)
    traen los datos después del "#" de la URL. Supabase los procesa y los borra al
    iniciar, así que se guardan antes para poder mostrar si el enlace venía con error.
*/
const fragmento = new URLSearchParams(window.location.hash.slice(1));
export const errorEnlaceCorreo = fragmento.get("error_code");

export const supabaseConfigurado = Boolean(url && clavePublica);
export const supabase = supabaseConfigurado ? createClient(url, clavePublica) : null;

/* Devuelve el cliente o explica qué falta, en vez de fallar con "cannot read properties of null". */
export const obtenerCliente = () => {
    if (!supabase) {
        throw new Error("Falta el archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver README).");
    }
    return supabase;
};

/* Convierte los errores de Supabase (en inglés y técnicos) en mensajes claros para el usuario. */
const MENSAJES = [
    ["invalid login credentials", "El correo o la contraseña son incorrectos."],
    ["email not confirmed", "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."],
    ["user already registered", "Ese correo ya tiene una cuenta. Inicia sesión."],
    ["password should be at least", "La contraseña es demasiado corta."],
    ["rate limit", "Se hicieron demasiados intentos. Espera unos minutos y vuelve a intentarlo."],
    ["for security purposes", "Por seguridad, espera un minuto antes de volver a pedir el correo."],
    ["new password should be different", "La nueva contraseña debe ser diferente a la anterior."],
    ["failed to fetch", "No hay conexión con el servidor. Revisa tu internet."],
    ["row-level security", "No tienes permiso para realizar esta acción."],
];

export const traducirError = (error) => {
    const mensaje = error?.message ?? String(error);
    const conocido = MENSAJES.find(([texto]) => mensaje.toLowerCase().includes(texto));
    return conocido ? conocido[1] : mensaje;
};

/*
    Revisa la respuesta de una consulta: si trae error lo lanza traducido, si no devuelve los datos.
    El error conserva el código de Supabase (ej. "email_not_confirmed") por si la página lo necesita.
*/
export const verificar = ({ data, error }) => {
    if (error) {
        const errorTraducido = new Error(traducirError(error));
        errorTraducido.codigo = error.code;
        throw errorTraducido;
    }
    return data;
};
