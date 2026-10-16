/* Consultas públicas para las reseñas que se muestran en la portada. */
import { obtenerCliente, verificar } from "./supabase.js";

export const listarResenasPublicas = async (limite = 8) => {
    const filas = verificar(
        await obtenerCliente()
            .from("resenas_publicas")
            .select("nombre, puntuacion, comentario, fecha")
            .order("fecha", { ascending: false })
            .limit(limite)
    );

    return filas.map((fila) => ({
        nombre: fila.nombre,
        puntuacion: Number(fila.puntuacion),
        comentario: fila.comentario,
        fecha: fila.fecha,
    }));
};
