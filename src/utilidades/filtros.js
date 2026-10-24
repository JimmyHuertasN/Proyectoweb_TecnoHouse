/*
    filtros.js
    Funciones puras para buscar y filtrar las listas del panel. No consultan Supabase
    ni tocan el estado de React: reciben datos y devuelven datos.
*/
import { ESTADOS_FINALES, ESTADOS_SOLICITUD } from "../datos/opciones.js";

/* Quita tildes, mayúsculas y espacios de los extremos: "Batería" y "bateria" cuentan igual. */
export const normalizarTexto = (texto = "") =>
    String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .trim();

/* Cada palabra buscada debe aparecer en alguno de los campos ("samsung juan" encuentra el Samsung de Juan). */
export const coincideTexto = (texto, campos) => {
    const palabras = normalizarTexto(texto).split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return true;

    const contenido = normalizarTexto(campos.filter((campo) => campo !== null && campo !== undefined).join(" "));
    return palabras.every((palabra) => contenido.includes(palabra));
};

/* Fecha en hora local con el formato de <input type="date"> (AAAA-MM-DD), igual que la que se muestra en pantalla. */
export const fechaLocal = (fechaIso) => {
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return "";

    const dosDigitos = (numero) => String(numero).padStart(2, "0");
    return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
};

/* "desde" y "hasta" son AAAA-MM-DD e incluyen ese día. Vacíos, no filtran. */
export const estaEnRango = (fechaIso, desde = "", hasta = "") => {
    if (!desde && !hasta) return true;

    const dia = fechaLocal(fechaIso);
    if (!dia) return false;
    return (!desde || dia >= desde) && (!hasta || dia <= hasta);
};

const GRUPOS_ESTADO = {
    todas: () => true,
    activas: (estado) => !ESTADOS_FINALES.includes(estado),
    finalizadas: (estado) => ESTADOS_FINALES.includes(estado),
};

/* "filtro" es un grupo (todas, activas, finalizadas) o un estado exacto (ej. "cotizado"). */
export const cumpleEstado = (estado, filtro = "todas") => {
    if (!filtro) return true;
    const grupo = GRUPOS_ESTADO[filtro];
    return grupo ? grupo(estado) : estado === filtro;
};

export const FILTROS_SOLICITUD_VACIOS = { texto: "", estado: "todas", desde: "", hasta: "" };

/*
    Una solicitud cumple si coincide con el texto (código, equipo, problema, categoría,
    cliente o técnico), el estado y el rango de fechas de creación.
*/
export const cumpleFiltrosSolicitud = (solicitud, { texto = "", estado = "todas", desde = "", hasta = "" } = {}) => {
    const { dispositivo = {} } = solicitud;

    return (
        cumpleEstado(solicitud.estado, estado) &&
        estaEnRango(solicitud.creadaEn, desde, hasta) &&
        coincideTexto(texto, [
            solicitud.codigo,
            dispositivo.tipo,
            dispositivo.marca,
            dispositivo.modelo,
            dispositivo.numeroSerie,
            solicitud.descripcion,
            solicitud.categoria,
            solicitud.cliente?.nombre,
            solicitud.tecnico?.nombre,
        ])
    );
};

/* Devuelve una lista nueva con las solicitudes que cumplen los filtros; no modifica la original. */
export const filtrarSolicitudes = (solicitudes, filtros = FILTROS_SOLICITUD_VACIOS) =>
    solicitudes.filter((solicitud) => cumpleFiltrosSolicitud(solicitud, filtros));

/* Opciones del selector de estado, con la cantidad de solicitudes de cada una. */
export const opcionesEstadoSolicitud = (solicitudes) => {
    const opcion = (valor, etiqueta) => ({
        valor,
        etiqueta: `${etiqueta} (${solicitudes.filter((solicitud) => cumpleEstado(solicitud.estado, valor)).length})`,
    });

    return [
        {
            grupo: "Resumen",
            opciones: [opcion("todas", "Todos los estados"), opcion("activas", "En curso"), opcion("finalizadas", "Terminados")],
        },
        { grupo: "Estado exacto", opciones: ESTADOS_SOLICITUD.map((estado) => opcion(estado.valor, estado.etiqueta)) },
    ];
};
