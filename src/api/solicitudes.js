/*
    solicitudes.js
    Solicitudes de servicio técnico. Cada solicitud guarda una copia de los datos
    del dispositivo para que el historial se conserve aunque el cliente lo
    edite o lo elimine después.
*/
import { ESTADOS_FINALES, GRAVEDADES } from "../datos/opciones.js";
import { CLAVES, generarId, guardar, leer } from "./almacenamiento.js";

export const LONGITUD_MINIMA_DESCRIPCION = 15;

const obtenerTodas = () => leer(CLAVES.solicitudes, []);

/* Código legible y consecutivo, por ejemplo TH-2026-0007. */
const generarCodigo = (solicitudes) => {
    const ultimoConsecutivo = solicitudes.reduce((mayor, solicitud) => {
        const numero = Number(solicitud.codigo.split("-").pop());
        return Number.isNaN(numero) ? mayor : Math.max(mayor, numero);
    }, 0);

    const anio = new Date().getFullYear();
    return `TH-${anio}-${String(ultimoConsecutivo + 1).padStart(4, "0")}`;
};

export const estaActiva = (solicitud) => !ESTADOS_FINALES.includes(solicitud.estado);

/* Devuelve las solicitudes del usuario, de la más reciente a la más antigua. */
export const listarSolicitudes = async (usuarioId) => {
    return obtenerTodas()
        .filter((solicitud) => solicitud.usuarioId === usuarioId)
        .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
};

export const obtenerSolicitud = async (usuarioId, codigo) => {
    const solicitud = obtenerTodas().find((item) => item.codigo === codigo && item.usuarioId === usuarioId);
    if (!solicitud) throw new Error("No encontramos esa solicitud.");
    return solicitud;
};

export const crearSolicitud = async (usuarioId, { dispositivoId, descripcion, gravedad }) => {
    const solicitudes = obtenerTodas();
    const dispositivo = leer(CLAVES.dispositivos, []).find(
        (item) => item.id === dispositivoId && item.usuarioId === usuarioId
    );
    const descripcionLimpia = descripcion.trim();

    if (!dispositivo) {
        throw new Error("Elige uno de tus dispositivos registrados.");
    }

    if (!GRAVEDADES.some((opcion) => opcion.valor === gravedad)) {
        throw new Error("Indica qué tan grave es la falla.");
    }

    if (descripcionLimpia.length < LONGITUD_MINIMA_DESCRIPCION) {
        throw new Error(`Describe la falla con al menos ${LONGITUD_MINIMA_DESCRIPCION} caracteres.`);
    }

    if (solicitudes.some((item) => item.dispositivoId === dispositivoId && estaActiva(item))) {
        throw new Error("Ese dispositivo ya tiene una solicitud en curso.");
    }

    const ahora = new Date().toISOString();
    const nueva = {
        id: generarId(),
        codigo: generarCodigo(solicitudes),
        usuarioId,
        dispositivoId,
        dispositivo: {
            tipo: dispositivo.tipo,
            marca: dispositivo.marca,
            modelo: dispositivo.modelo,
            numeroSerie: dispositivo.numeroSerie,
        },
        descripcion: descripcionLimpia,
        gravedad,
        estado: "pendiente",
        creadaEn: ahora,
        historial: [{ estado: "pendiente", fecha: ahora, nota: "Solicitud creada por el cliente." }],
    };

    guardar(CLAVES.solicitudes, [...solicitudes, nueva]);
    return nueva;
};

/* El cliente solo puede cancelar mientras el taller no haya empezado a trabajar. */
export const cancelarSolicitud = async (usuarioId, codigo) => {
    const solicitudes = obtenerTodas();
    const solicitud = solicitudes.find((item) => item.codigo === codigo && item.usuarioId === usuarioId);

    if (!solicitud) {
        throw new Error("No encontramos esa solicitud.");
    }

    if (solicitud.estado !== "pendiente") {
        throw new Error("Solo puedes cancelar solicitudes que aún están pendientes.");
    }

    const cancelada = {
        ...solicitud,
        estado: "cancelada",
        historial: [
            ...solicitud.historial,
            { estado: "cancelada", fecha: new Date().toISOString(), nota: "Solicitud cancelada por el cliente." },
        ],
    };

    guardar(CLAVES.solicitudes, solicitudes.map((item) => (item.codigo === codigo ? cancelada : item)));
    return cancelada;
};
