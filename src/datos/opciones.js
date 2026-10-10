/* Catálogos fijos que usan los formularios y las tarjetas del panel del cliente. */

export const TIPOS_DISPOSITIVO = [
    { valor: "computador", etiqueta: "Computador", icono: "💻" },
    { valor: "celular", etiqueta: "Celular", icono: "📱" },
    { valor: "consola", etiqueta: "Consola", icono: "🎮" },
];

export const GRAVEDADES = [
    { valor: "baja", etiqueta: "Baja", descripcion: "Funciona, pero presenta detalles menores." },
    { valor: "media", etiqueta: "Media", descripcion: "Falla con frecuencia y afecta su uso." },
    { valor: "alta", etiqueta: "Alta", descripcion: "No enciende o no se puede usar." },
];

/* El orden de este arreglo es el recorrido normal de una reparación. */
export const ESTADOS_SOLICITUD = [
    { valor: "pendiente", etiqueta: "Pendiente" },
    { valor: "en_revision", etiqueta: "En diagnóstico" },
    { valor: "en_reparacion", etiqueta: "En reparación" },
    { valor: "lista", etiqueta: "Lista para entregar" },
    { valor: "entregada", etiqueta: "Entregada" },
    { valor: "cancelada", etiqueta: "Cancelada" },
];

/* Una solicitud en estos estados ya no está en curso. */
export const ESTADOS_FINALES = ["entregada", "cancelada"];

/* Busca la opción de un catálogo por su valor (ej. buscarOpcion(GRAVEDADES, "alta")). */
export const buscarOpcion = (catalogo, valor) => {
    return catalogo.find((opcion) => opcion.valor === valor) ?? { valor, etiqueta: valor };
};
