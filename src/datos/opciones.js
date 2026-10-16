/* Catálogos fijos que usan los formularios y las tarjetas del panel del cliente. */

export const TIPOS_DISPOSITIVO = [
    { valor: "computador", etiqueta: "Computador", icono: Laptop },
    { valor: "celular", etiqueta: "Celular", icono: Smartphone },
    { valor: "consola", etiqueta: "Consola", icono: Gamepad2 },
];

export const GRAVEDADES = [
    { valor: "baja", etiqueta: "Baja", descripcion: "Funciona, pero presenta detalles menores." },
    { valor: "media", etiqueta: "Media", descripcion: "Falla con frecuencia y afecta su uso." },
    { valor: "alta", etiqueta: "Alta", descripcion: "No enciende o no se puede usar." },
];

/*
    Estados del tipo "estado_servicio" de la base de datos. El orden de este
    arreglo es el recorrido normal de una reparación.
*/
export const ESTADOS_SOLICITUD = [
    { valor: "solicitado", etiqueta: "Solicitado" },
    { valor: "asignado", etiqueta: "Técnico asignado" },
    { valor: "en_diagnostico", etiqueta: "En diagnóstico" },
    { valor: "cotizado", etiqueta: "Cotizado" },
    { valor: "aprobado", etiqueta: "Cotización aprobada" },
    { valor: "en_reparacion", etiqueta: "En reparación" },
    { valor: "finalizado", etiqueta: "Finalizado" },
    { valor: "calificado", etiqueta: "Calificado" },
];

/*
    Cambios de estado que hace el técnico con un botón. Los demás los hace la base de datos:
    "cotizado" al crear la cotización, y "aprobado" o "en_diagnostico" cuando el cliente responde.
*/
export const AVANCES_TECNICO = {
    asignado: { siguiente: "en_diagnostico", accion: "Iniciar diagnóstico" },
    aprobado: { siguiente: "en_reparacion", accion: "Iniciar reparación" },
    en_reparacion: { siguiente: "finalizado", accion: "Marcar como finalizado" },
};

/* Estados del tipo "estado_cotizacion" de la base de datos. */
export const ESTADOS_COTIZACION = [
    { valor: "pendiente", etiqueta: "Pendiente" },
    { valor: "aprobada", etiqueta: "Aprobada" },
    { valor: "rechazada", etiqueta: "Rechazada" },
];

/* La base de datos acepta puntuaciones de 1 a 5. */
export const NIVELES_CALIFICACION = [
    { valor: 1, etiqueta: "Muy malo" },
    { valor: 2, etiqueta: "Malo" },
    { valor: 3, etiqueta: "Regular" },
    { valor: 4, etiqueta: "Bueno" },
    { valor: 5, etiqueta: "Excelente" },
];

/* Una solicitud en estos estados ya no está en curso. */
export const ESTADOS_FINALES = ["finalizado", "calificado"];

/* Busca la opción de un catálogo por su valor (ej. buscarOpcion(GRAVEDADES, "alta")). */
export const buscarOpcion = (catalogo, valor) => {
    return catalogo.find((opcion) => opcion.valor === valor) ?? { valor, etiqueta: valor, icono: Laptop };
};
import { Gamepad2, Laptop, Smartphone } from "lucide-react";
