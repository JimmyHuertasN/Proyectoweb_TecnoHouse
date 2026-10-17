/* Consultas de notificaciones y suscripción privada del usuario conectado. */
import { obtenerCliente, verificar } from "./supabase.js";

// Columnas compartidas por la lista de notificaciones.
const COLUMNAS = "id, usuario_id, titulo, detalle, enlace, leida, creado_en";
// Evita abrir dos canales Realtime con el mismo nombre desde las campanas del panel.
let consecutivoCanales = 0;

// Mantiene el formato de la base de datos que consume el panel.
const aNotificacion = (fila) => ({
    id: String(fila.id),
    usuarioId: fila.usuario_id,
    titulo: fila.titulo,
    detalle: fila.detalle,
    enlace: fila.enlace,
    leida: fila.leida,
    creadaEn: fila.creado_en,
});

/* Devuelve las notificaciones más recientes del usuario. */
export const listarNotificaciones = async (usuarioId, limite = 10) => {
    const filas = verificar(await obtenerCliente()
        .from("notificaciones")
        .select(COLUMNAS)
        .eq("usuario_id", usuarioId)
        .order("creado_en", { ascending: false })
        .limit(limite));
    return filas.map(aNotificacion);
};

/* Cuenta todos los avisos sin leer, no solo los que aparecen en el menú. */
export const contarNoLeidas = async (usuarioId) => {
    const { count, error } = await obtenerCliente()
        .from("notificaciones")
        .select("id", { count: "exact", head: true })
        .eq("usuario_id", usuarioId)
        .eq("leida", false);
    verificar({ error });
    return count ?? 0;
};

/* Marca como leída una notificación propia. */
export const marcarLeida = async (usuarioId, notificacionId) => {
    verificar(await obtenerCliente()
        .from("notificaciones")
        .update({ leida: true })
        .eq("id", notificacionId)
        .eq("usuario_id", usuarioId));
};

/* Marca como leídas todas las notificaciones pendientes del usuario. */
export const marcarTodasLeidas = async (usuarioId) => {
    verificar(await obtenerCliente()
        .from("notificaciones")
        .update({ leida: true })
        .eq("usuario_id", usuarioId)
        .eq("leida", false));
};

/* Escucha cambios del usuario autenticado; el filtro y RLS limitan los eventos recibidos. */
export const suscribirNotificaciones = (usuarioId, alCambiar) => {
    const cliente = obtenerCliente();
    // Cada campana del diseño usa un canal propio, aunque comparta el mismo usuario.
    consecutivoCanales += 1;
    const canal = cliente.channel(`notificaciones-${usuarioId}-${consecutivoCanales}`)
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "notificaciones",
            filter: `usuario_id=eq.${usuarioId}`,
        }, alCambiar)
        .subscribe();

    return () => cliente.removeChannel(canal);
};
