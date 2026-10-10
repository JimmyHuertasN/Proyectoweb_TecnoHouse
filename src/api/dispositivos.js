/*
    dispositivos.js
    CRUD de los dispositivos de cada cliente. Todas las operaciones reciben el
    id del usuario: así un cliente nunca puede ver ni modificar equipos ajenos
    (con la API real, ese id saldría del token de sesión en el servidor).
*/
import { ESTADOS_FINALES, TIPOS_DISPOSITIVO } from "../datos/opciones.js";
import { CLAVES, generarId, guardar, leer } from "./almacenamiento.js";

const obtenerTodos = () => leer(CLAVES.dispositivos, []);

/* Valida y limpia los datos del formulario antes de guardarlos. */
const prepararDatos = ({ tipo, marca, modelo, numeroSerie }) => {
    const datos = {
        tipo,
        marca: marca.trim(),
        modelo: modelo.trim(),
        numeroSerie: numeroSerie.trim(),
    };

    if (!TIPOS_DISPOSITIVO.some((opcion) => opcion.valor === datos.tipo)) {
        throw new Error("Elige el tipo de dispositivo.");
    }

    if (!datos.marca || !datos.modelo) {
        throw new Error("La marca y el modelo son obligatorios.");
    }

    return datos;
};

const buscarPropio = (dispositivos, usuarioId, id) => {
    const dispositivo = dispositivos.find((item) => item.id === id && item.usuarioId === usuarioId);
    if (!dispositivo) throw new Error("No encontramos ese dispositivo.");
    return dispositivo;
};

/* Devuelve los dispositivos del usuario, del más reciente al más antiguo. */
export const listarDispositivos = async (usuarioId) => {
    return obtenerTodos()
        .filter((dispositivo) => dispositivo.usuarioId === usuarioId)
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
};

export const crearDispositivo = async (usuarioId, datosFormulario) => {
    const nuevo = {
        id: generarId(),
        usuarioId,
        ...prepararDatos(datosFormulario),
        creadoEn: new Date().toISOString(),
    };

    guardar(CLAVES.dispositivos, [...obtenerTodos(), nuevo]);
    return nuevo;
};

export const actualizarDispositivo = async (usuarioId, id, datosFormulario) => {
    const dispositivos = obtenerTodos();
    const actualizado = { ...buscarPropio(dispositivos, usuarioId, id), ...prepararDatos(datosFormulario) };

    guardar(CLAVES.dispositivos, dispositivos.map((item) => (item.id === id ? actualizado : item)));
    return actualizado;
};

/* No se permite borrar un equipo que el taller todavía tiene en proceso. */
export const eliminarDispositivo = async (usuarioId, id) => {
    const dispositivos = obtenerTodos();
    buscarPropio(dispositivos, usuarioId, id);

    const tieneSolicitudActiva = leer(CLAVES.solicitudes, []).some(
        (solicitud) => solicitud.dispositivoId === id && !ESTADOS_FINALES.includes(solicitud.estado)
    );

    if (tieneSolicitudActiva) {
        throw new Error("Este dispositivo tiene una solicitud en curso. Podrás eliminarlo cuando finalice o la canceles.");
    }

    guardar(CLAVES.dispositivos, dispositivos.filter((item) => item.id !== id));
};
