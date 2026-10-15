/*
    dispositivos.js
    CRUD de los dispositivos de cada cliente sobre la tabla "dispositivos".
    Todas las consultas filtran por cliente_id; además, las reglas de seguridad
    (RLS) de Supabase impiden que un cliente lea o modifique equipos ajenos.
*/
import { ESTADOS_FINALES, TIPOS_DISPOSITIVO } from "../datos/opciones.js";
import { obtenerCliente, verificar } from "./supabase.js";

const COLUMNAS = "id, cliente_id, tipo, marca, modelo, serial, creado_en";

/* Convierte una fila de la base de datos al formato que usa la aplicación. */
const aDispositivo = (fila) => ({
    id: String(fila.id),
    usuarioId: fila.cliente_id,
    tipo: fila.tipo,
    marca: fila.marca ?? "",
    modelo: fila.modelo ?? "",
    numeroSerie: fila.serial ?? "",
    creadoEn: fila.creado_en,
});

/* Valida y limpia los datos del formulario, y los deja con los nombres de las columnas. */
const prepararDatos = ({ tipo, marca, modelo, numeroSerie }) => {
    if (!TIPOS_DISPOSITIVO.some((opcion) => opcion.valor === tipo)) {
        throw new Error("Elige el tipo de dispositivo.");
    }

    if (!marca.trim() || !modelo.trim()) {
        throw new Error("La marca y el modelo son obligatorios.");
    }

    return { tipo, marca: marca.trim(), modelo: modelo.trim(), serial: numeroSerie.trim() || null };
};

/* Devuelve los dispositivos del usuario, del más reciente al más antiguo. */
export const listarDispositivos = async (usuarioId) => {
    const filas = verificar(
        await obtenerCliente()
            .from("dispositivos")
            .select(COLUMNAS)
            .eq("cliente_id", usuarioId)
            .order("creado_en", { ascending: false })
    );
    return filas.map(aDispositivo);
};

export const crearDispositivo = async (usuarioId, datosFormulario) => {
    const fila = verificar(
        await obtenerCliente()
            .from("dispositivos")
            .insert({ cliente_id: usuarioId, ...prepararDatos(datosFormulario) })
            .select(COLUMNAS)
            .single()
    );
    return aDispositivo(fila);
};

export const actualizarDispositivo = async (usuarioId, id, datosFormulario) => {
    const filas = verificar(
        await obtenerCliente()
            .from("dispositivos")
            .update(prepararDatos(datosFormulario))
            .eq("id", id)
            .eq("cliente_id", usuarioId)
            .select(COLUMNAS)
    );

    if (filas.length === 0) throw new Error("No encontramos ese dispositivo.");
    return aDispositivo(filas[0]);
};

/* No se permite borrar un equipo que el taller todavía tiene en proceso. */
export const eliminarDispositivo = async (usuarioId, id) => {
    const cliente = obtenerCliente();

    // Con head: true no se traen filas, solo el conteo (que viene en la respuesta, no en data).
    const enCurso = await cliente
        .from("servicios")
        .select("id", { count: "exact", head: true })
        .eq("dispositivo_id", id)
        .not("estado", "in", `(${ESTADOS_FINALES.join(",")})`);
    verificar(enCurso);

    if (enCurso.count > 0) {
        throw new Error("Este dispositivo tiene una solicitud en curso. Podrás eliminarlo cuando finalice.");
    }

    const { data, error } = await cliente.from("dispositivos").delete().eq("id", id).eq("cliente_id", usuarioId).select("id");

    // 23503: la base de datos no deja borrar un dispositivo que aparece en servicios anteriores.
    if (error?.code === "23503") {
        throw new Error("Este dispositivo tiene historial de servicios, por eso no se puede eliminar.");
    }
    if (error) verificar({ error });
    if (data.length === 0) throw new Error("No encontramos ese dispositivo.");
};
