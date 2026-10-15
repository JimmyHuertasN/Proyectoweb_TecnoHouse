/*
    usuarios.js
    Registro, inicio de sesión y perfil con Supabase Auth.
    - Las cuentas (correo y contraseña) las maneja Supabase Auth.
    - Los datos del usuario (nombre, teléfono y rol) viven en la tabla "perfiles".
      Un trigger de la base de datos crea el perfil al registrarse, con rol "cliente".
*/
import { obtenerCliente, verificar } from "./supabase.js";

/*
    Páginas de la aplicación a las que llevan los enlaces de los correos de Supabase.
    Deben estar permitidas en Supabase: Authentication → URL Configuration → Redirect URLs.
*/
const urlDeLaApp = (ruta) => `${window.location.origin}${ruta}`;

export const registrarUsuario = async ({ nombre, correo, telefono, contrasena }) => {
    const data = verificar(
        await obtenerCliente().auth.signUp({
            email: correo,
            password: contrasena,
            options: {
                // El trigger de la base de datos copia estos datos a la tabla "perfiles".
                data: { nombre, telefono },
                emailRedirectTo: urlDeLaApp("/correo-confirmado"),
            },
        })
    );

    // Con la confirmación por correo activa, Supabase no da error si el correo ya existe:
    // devuelve un usuario sin identidades. Así se detecta ese caso.
    if (data.user?.identities?.length === 0) {
        throw new Error("Ese correo ya tiene una cuenta. Inicia sesión.");
    }

    return { requiereConfirmacion: !data.session };
};

/* Une la cuenta de Supabase Auth con su fila de "perfiles" en un solo objeto para la aplicación. */
export const obtenerPerfil = async (usuarioAuth) => {
    const { data: perfil, error } = await obtenerCliente()
        .from("perfiles")
        .select("nombre, telefono, rol, creado_en")
        .eq("id", usuarioAuth.id)
        .maybeSingle();

    if (error) console.error("No se pudo leer el perfil:", error.message);

    const metadatos = usuarioAuth.user_metadata ?? {};
    return {
        id: usuarioAuth.id,
        correo: usuarioAuth.email,
        nombre: perfil?.nombre ?? metadatos.nombre ?? usuarioAuth.email,
        telefono: perfil?.telefono ?? metadatos.telefono ?? "",
        rol: perfil?.rol ?? "cliente",
        creadoEn: perfil?.creado_en ?? usuarioAuth.created_at,
    };
};

export const iniciarSesion = async (correo, contrasena) => {
    const { user } = verificar(await obtenerCliente().auth.signInWithPassword({ email: correo, password: contrasena }));
    return obtenerPerfil(user);
};

export const cerrarSesion = async () => {
    verificar(await obtenerCliente().auth.signOut());
};

/* Vuelve a enviar el correo para confirmar la cuenta (por si no llegó o el enlace expiró). */
export const reenviarConfirmacion = async (correo) => {
    verificar(
        await obtenerCliente().auth.resend({
            type: "signup",
            email: correo,
            options: { emailRedirectTo: urlDeLaApp("/correo-confirmado") },
        })
    );
};

/*
    Envía el correo con el enlace para crear una contraseña nueva.
    Por seguridad Supabase no avisa si el correo no existe: siempre responde igual.
*/
export const enviarRecuperacion = async (correo) => {
    verificar(await obtenerCliente().auth.resetPasswordForEmail(correo, { redirectTo: urlDeLaApp("/nueva-contrasena") }));
};

/* Cambia la contraseña del usuario que abrió el enlace de recuperación (o que ya inició sesión). */
export const cambiarContrasena = async (contrasenaNueva) => {
    verificar(await obtenerCliente().auth.updateUser({ password: contrasenaNueva }));
};

export const actualizarPerfil = async (id, { nombre, telefono }) => {
    const filas = verificar(
        await obtenerCliente().from("perfiles").update({ nombre, telefono }).eq("id", id).select("id")
    );

    // Si las reglas de seguridad (RLS) no permiten el cambio, Supabase no da error: simplemente no actualiza nada.
    if (filas.length === 0) {
        throw new Error("No se pudieron guardar los cambios. Vuelve a iniciar sesión e inténtalo de nuevo.");
    }
};
