/*
    usuarios.js
    Registro, inicio de sesión y perfil. Todas las funciones son async para que
    tengan la misma forma que tendrán con la API real (fetch devuelve promesas).
    Si algo falla lanzan un Error con un mensaje listo para mostrar al usuario.

    Ejemplo de cómo quedaría iniciarSesion con el backend:
        const res = await fetch(`${URL_API}/auth/login`, { method: "POST", ... });
        if (!res.ok) throw new Error("Correo o contraseña incorrectos.");
        return res.json();
*/
import { CLAVES, generarId, guardar, leer } from "./almacenamiento.js";

/* Lo que se puede mostrar del usuario: nunca se devuelve la contraseña. */
const datosPublicos = ({ id, nombre, correo, telefono, creadoEn }) => ({ id, nombre, correo, telefono, creadoEn });

/* Los usuarios creados antes de esta versión no tenían id; se les asigna uno la primera vez. */
const obtenerUsuarios = () => {
    const usuarios = leer(CLAVES.usuarios, []);
    if (usuarios.every((usuario) => usuario.id)) return usuarios;

    const conId = usuarios.map((usuario) => (usuario.id ? usuario : { ...usuario, id: generarId() }));
    guardar(CLAVES.usuarios, conId);
    return conId;
};

const normalizarCorreo = (correo) => correo.trim().toLowerCase();

export const registrarUsuario = async ({ nombre, correo, telefono, contrasena }) => {
    const usuarios = obtenerUsuarios();
    const correoNormalizado = normalizarCorreo(correo);

    if (usuarios.some((usuario) => usuario.correo === correoNormalizado)) {
        throw new Error("Ese correo ya tiene una cuenta. Inicia sesión.");
    }

    const nuevoUsuario = {
        id: generarId(),
        nombre: nombre.trim(),
        correo: correoNormalizado,
        telefono: telefono.trim(),
        // Solo para la práctica: un backend real guarda la contraseña cifrada (hash), nunca en texto plano.
        contrasena,
        creadoEn: new Date().toISOString(),
    };

    guardar(CLAVES.usuarios, [...usuarios, nuevoUsuario]);
    return datosPublicos(nuevoUsuario);
};

export const iniciarSesion = async (correo, contrasena) => {
    const usuario = obtenerUsuarios().find((guardado) => guardado.correo === normalizarCorreo(correo));

    if (!usuario) {
        throw new Error("No encontramos una cuenta con ese correo.");
    }

    if (usuario.contrasena !== contrasena) {
        throw new Error("La contraseña es incorrecta.");
    }

    return datosPublicos(usuario);
};

export const actualizarUsuario = async (id, { nombre, correo, telefono }) => {
    const usuarios = obtenerUsuarios();
    const correoNormalizado = normalizarCorreo(correo);

    if (!usuarios.some((usuario) => usuario.id === id)) {
        throw new Error("Tu cuenta ya no existe. Vuelve a iniciar sesión.");
    }

    if (usuarios.some((usuario) => usuario.id !== id && usuario.correo === correoNormalizado)) {
        throw new Error("Ese correo ya está en uso por otra cuenta.");
    }

    const actualizados = usuarios.map((usuario) =>
        usuario.id === id
            ? { ...usuario, nombre: nombre.trim(), correo: correoNormalizado, telefono: telefono.trim() }
            : usuario
    );

    guardar(CLAVES.usuarios, actualizados);
    return datosPublicos(actualizados.find((usuario) => usuario.id === id));
};
