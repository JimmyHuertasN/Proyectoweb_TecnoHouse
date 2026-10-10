/*
    Validaciones compartidas entre el registro y la edición del perfil.
    Cada función devuelve el mensaje de error, o null si todo está bien.
*/

export const esCorreoValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

export const validarDatosPersonales = ({ nombre, correo, telefono }) => {
    if (!nombre || !correo || !telefono) {
        return "Por favor completa todos los campos.";
    }

    if (nombre.length < 3) {
        return "El nombre debe tener al menos 3 caracteres.";
    }

    if (!esCorreoValido(correo)) {
        return "Escribe un correo electrónico válido.";
    }

    if (!/^[0-9+\s-]{7,20}$/.test(telefono)) {
        return "Escribe un teléfono válido (solo números, espacios o guiones).";
    }

    return null;
};
