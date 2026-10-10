/* Funciones para mostrar datos de forma legible en pantalla. */

export const formatearFecha = (fechaIso) => {
    return new Date(fechaIso).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

export const formatearFechaHora = (fechaIso) => {
    return new Date(fechaIso).toLocaleString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

export const primerNombre = (nombreCompleto = "") => nombreCompleto.trim().split(/\s+/)[0];

export const iniciales = (nombreCompleto = "") => {
    return nombreCompleto
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((palabra) => palabra[0]?.toUpperCase() ?? "")
        .join("");
};
