/* Consultas públicas para las reseñas que se muestran en la portada. */
import { llamarApi } from "./backend.js";

export const listarResenasPublicas = async (limite = 8) => {
    const filas = await llamarApi("/api/resenas-publicas", { publico: true });

    return filas
        .sort((resenaA, resenaB) => resenaB.fecha.localeCompare(resenaA.fecha))
        .slice(0, limite)
        .map((fila) => ({
        nombre: fila.nombre,
        puntuacion: Number(fila.puntuacion),
        comentario: fila.comentario,
        fecha: fila.fecha,
    }));
};
