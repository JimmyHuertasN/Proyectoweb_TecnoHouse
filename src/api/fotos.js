/* Operaciones de Storage y metadatos para las fotos de cada servicio. */
import { obtenerCliente, verificar } from "./supabase.js";

export const CANTIDAD_MAXIMA_FOTOS = 3;
export const TAMANO_MAXIMO_FOTO = 3 * 1024 * 1024;
export const TIPOS_FOTO_PERMITIDOS = ["image/jpeg", "image/png"];

const BUCKET_FOTOS = "fotos-servicio";
const DURACION_URL_FIRMADA = 60 * 60;

const validarFotos = (archivos) => {
    if (archivos.length > CANTIDAD_MAXIMA_FOTOS) {
        throw new Error(`Puedes adjuntar hasta ${CANTIDAD_MAXIMA_FOTOS} imágenes.`);
    }
    if (archivos.some((archivo) => !TIPOS_FOTO_PERMITIDOS.includes(archivo.type))) {
        throw new Error("Las fotos deben estar en formato JPG o PNG.");
    }
    if (archivos.some((archivo) => archivo.size > TAMANO_MAXIMO_FOTO)) {
        throw new Error("Cada foto debe pesar máximo 3 MB.");
    }
};

const crearNombreUnico = (archivo) => {
    const extension = archivo.type === "image/png" ? "png" : "jpg";
    const identificador = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${identificador}.${extension}`;
};

/* Sube archivos privados y registra sus rutas. Si falla un paso, quita los objetos ya cargados. */
export const subirFotos = async (servicioId, archivos) => {
    const fotos = Array.from(archivos);
    validarFotos(fotos);
    if (fotos.length === 0) return [];

    const cliente = obtenerCliente();
    const { count, error: errorConteo } = await cliente
        .from("servicio_fotos")
        .select("id", { count: "exact", head: true })
        .eq("servicio_id", servicioId);
    verificar({ error: errorConteo });
    if ((count ?? 0) + fotos.length > CANTIDAD_MAXIMA_FOTOS) {
        throw new Error(`Este servicio admite hasta ${CANTIDAD_MAXIMA_FOTOS} imágenes.`);
    }

    const rutasSubidas = [];

    try {
        for (const archivo of fotos) {
            const ruta = `${Number(servicioId)}/${crearNombreUnico(archivo)}`;
            const { error } = await cliente.storage.from(BUCKET_FOTOS).upload(ruta, archivo, {
                contentType: archivo.type,
                upsert: false,
            });
            if (error) verificar({ error });
            rutasSubidas.push(ruta);
        }

        const filas = rutasSubidas.map((ruta) => ({ servicio_id: Number(servicioId), ruta }));
        return verificar(await cliente.from("servicio_fotos").insert(filas).select("id, servicio_id, ruta, creado_en"));
    } catch (error) {
        if (rutasSubidas.length > 0) {
            // Limpia los archivos de Storage si no se pudo terminar el registro de la galería.
            await cliente.storage.from(BUCKET_FOTOS).remove(rutasSubidas);
        }
        throw error;
    }
};

/* Devuelve metadatos y enlaces firmados que vencen después de una hora. */
export const listarFotos = async (servicioId) => {
    const cliente = obtenerCliente();
    const filas = verificar(
        await cliente.from("servicio_fotos").select("id, servicio_id, ruta, creado_en").eq("servicio_id", servicioId).order("creado_en")
    );

    return Promise.all(filas.map(async (fila) => {
        const respuesta = verificar(
            await cliente.storage.from(BUCKET_FOTOS).createSignedUrl(fila.ruta, DURACION_URL_FIRMADA)
        );
        return { id: fila.id, servicioId: fila.servicio_id, ruta: fila.ruta, creadaEn: fila.creado_en, url: respuesta.signedUrl };
    }));
};

/* Elimina primero el objeto y luego su registro; la política permite hacerlo al cliente dueño. */
export const eliminarFoto = async (fotoId) => {
    const cliente = obtenerCliente();
    const foto = verificar(
        await cliente.from("servicio_fotos").select("id, ruta").eq("id", fotoId).single()
    );

    verificar(await cliente.storage.from(BUCKET_FOTOS).remove([foto.ruta]));
    verificar(await cliente.from("servicio_fotos").delete().eq("id", foto.id));
};
