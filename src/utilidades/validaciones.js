/*
    Validaciones compartidas entre el registro y la edición del perfil.
    Cada función devuelve el mensaje de error, o null si todo está bien.
*/

export const esCorreoValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

/* El administrador edita nombre y teléfono de un cliente sin tocar su correo. */
export const validarNombreYTelefono = ({ nombre, telefono }) => {
    if (!nombre || !telefono) {
        return "Por favor completa todos los campos.";
    }

    if (nombre.length < 3) {
        return "El nombre debe tener al menos 3 caracteres.";
    }

    if (!/^[0-9+\s-]{7,20}$/.test(telefono)) {
        return "Escribe un teléfono válido (solo números, espacios o guiones).";
    }

    return null;
};

export const validarDatosPersonales = ({ nombre, correo, telefono }) => {
    if (!correo) {
        return "Por favor completa todos los campos.";
    }

    if (!esCorreoValido(correo)) {
        return "Escribe un correo electrónico válido.";
    }

    return validarNombreYTelefono({ nombre, telefono });
};
