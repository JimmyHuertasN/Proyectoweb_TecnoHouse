/* Consultas y suscripción en tiempo real para la conversación de un servicio. */
import { obtenerPerfiles } from "./usuarios.js";
import { obtenerCliente, verificar } from "./supabase.js";

export const LONGITUD_MAXIMA_MENSAJE = 500;
// Supabase reutiliza un canal con el mismo nombre aunque se esté cerrando; cada suscripción usa uno propio.
let consecutivoCanales = 0;

// Adapta una fila de Supabase al formato que muestra el chat.
const aMensaje = (fila, perfiles) => ({
    id: String(fila.id),
    servicioId: String(fila.servicio_id),
    autorId: fila.autor_id,
    autor: perfiles[fila.autor_id]?.nombre ?? "Usuario",
    texto: fila.texto,
    creadoEn: fila.creado_en,
});

/* Lee la conversación en orden cronológico y agrega el nombre de cada autor. */
export const listarMensajes = async (servicioId) => {
    const filas = verificar(await obtenerCliente()
        .from("mensajes_servicio")
        .select("id, servicio_id, autor_id, texto, creado_en")
        .eq("servicio_id", servicioId)
        .order("creado_en", { ascending: true }));
    const perfiles = await obtenerPerfiles(filas.map((fila) => fila.autor_id));
    return filas.map((fila) => aMensaje(fila, perfiles));
};

/* Guarda mensajes nuevos; las políticas RLS determinan quién participa. */
export const enviarMensaje = async (servicioId, autorId, texto) => {
    const textoLimpio = texto.trim();
    if (!textoLimpio) throw new Error("Escribe un mensaje antes de enviarlo.");
    if (textoLimpio.length > LONGITUD_MAXIMA_MENSAJE) throw new Error("El mensaje no puede superar los 500 caracteres.");

    const fila = verificar(await obtenerCliente()
        .from("mensajes_servicio")
        .insert({ servicio_id: Number(servicioId), autor_id: autorId, texto: textoLimpio })
        .select("id, servicio_id, autor_id, texto, creado_en")
        .single());
    const perfiles = await obtenerPerfiles([fila.autor_id]);
    return aMensaje(fila, perfiles);
};

/* Escucha inserciones únicamente del servicio actual. */
export const suscribirMensajes = (servicioId, alCambiar) => {
    const cliente = obtenerCliente();
    consecutivoCanales += 1;
    const canal = cliente.channel(`mensajes-servicio-${servicioId}-${consecutivoCanales}`)
        .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "mensajes_servicio",
            filter: `servicio_id=eq.${servicioId}`,
        }, alCambiar)
        .subscribe();

    return () => cliente.removeChannel(canal);
};
