/*
    solicitudes.js
    Solicitudes de servicio técnico sobre la tabla "servicios".

    La tabla no tiene columna de gravedad, así que se guarda al inicio del
    texto del problema, por ejemplo: "[Gravedad: alta] La pantalla no enciende".
    Si el equipo agrega una columna "gravedad", solo hay que cambiar
    componerProblema y separarProblema.
*/
import { buscarOpcion, ESTADOS_COTIZACION, ESTADOS_FINALES, GRAVEDADES, NIVELES_CALIFICACION } from "../datos/opciones.js";
import { formatearPesos } from "../utilidades/formato.js";
import { obtenerCliente, verificar } from "./supabase.js";

export const LONGITUD_MINIMA_DESCRIPCION = 15;

// "dispositivo:dispositivos(...)" trae los datos del equipo en la misma consulta (relación por dispositivo_id).
const COLUMNAS = "id, cliente_id, dispositivo_id, tecnico_id, problema, estado, creado_en, dispositivo:dispositivos(tipo, marca, modelo, serial)";

const PATRON_GRAVEDAD = /^\[Gravedad: (baja|media|alta)\]\s*/;

const componerProblema = (gravedad, descripcion) => `[Gravedad: ${gravedad}] ${descripcion}`;

const separarProblema = (problema = "") => {
    const coincidencia = problema.match(PATRON_GRAVEDAD);
    return coincidencia
        ? { gravedad: coincidencia[1], descripcion: problema.slice(coincidencia[0].length) }
        : { gravedad: null, descripcion: problema };
};

/* Código legible a partir del id, por ejemplo TH-0007. */
export const formatearCodigo = (id) => `TH-${String(id).padStart(4, "0")}`;

export const estaActiva = (solicitud) => !ESTADOS_FINALES.includes(solicitud.estado);

/* Convierte una fila de "servicios" al formato que usa la aplicación. */
const aSolicitud = (fila) => {
    const { gravedad, descripcion } = separarProblema(fila.problema);
    const dispositivo = fila.dispositivo ?? {};

    return {
        id: String(fila.id),
        codigo: formatearCodigo(fila.id),
        usuarioId: fila.cliente_id,
        dispositivoId: String(fila.dispositivo_id),
        tieneTecnico: Boolean(fila.tecnico_id),
        dispositivo: {
            tipo: dispositivo.tipo,
            marca: dispositivo.marca ?? "",
            modelo: dispositivo.modelo ?? "",
            numeroSerie: dispositivo.serial ?? "",
        },
        descripcion,
        gravedad,
        estado: fila.estado,
        creadaEn: fila.creado_en,
    };
};

/* Devuelve las solicitudes del usuario, de la más reciente a la más antigua. */
export const listarSolicitudes = async (usuarioId) => {
    const filas = verificar(
        await obtenerCliente()
            .from("servicios")
            .select(COLUMNAS)
            .eq("cliente_id", usuarioId)
            .order("creado_en", { ascending: false })
    );
    return filas.map(aSolicitud);
};

export const obtenerSolicitud = async (usuarioId, id) => {
    const fila = verificar(
        await obtenerCliente().from("servicios").select(COLUMNAS).eq("id", id).eq("cliente_id", usuarioId).maybeSingle()
    );
    if (!fila) throw new Error("No encontramos esa solicitud.");
    return aSolicitud(fila);
};

export const crearSolicitud = async (usuarioId, { dispositivoId, descripcion, gravedad }) => {
    const cliente = obtenerCliente();
    const descripcionLimpia = descripcion.trim();

    if (!GRAVEDADES.some((opcion) => opcion.valor === gravedad)) {
        throw new Error("Indica qué tan grave es la falla.");
    }

    if (descripcionLimpia.length < LONGITUD_MINIMA_DESCRIPCION) {
        throw new Error(`Describe la falla con al menos ${LONGITUD_MINIMA_DESCRIPCION} caracteres.`);
    }

    const enCurso = await cliente
        .from("servicios")
        .select("id", { count: "exact", head: true })
        .eq("dispositivo_id", dispositivoId)
        .not("estado", "in", `(${ESTADOS_FINALES.join(",")})`);
    verificar(enCurso);

    if (enCurso.count > 0) {
        throw new Error("Ese dispositivo ya tiene una solicitud en curso.");
    }

    const fila = verificar(
        await cliente
            .from("servicios")
            .insert({
                cliente_id: usuarioId,
                dispositivo_id: Number(dispositivoId),
                problema: componerProblema(gravedad, descripcionLimpia),
            })
            .select(COLUMNAS)
            .single()
    );
    return aSolicitud(fila);
};

/* Lee una tabla relacionada con el servicio; si las reglas de seguridad no la dejan leer, la omite. */
const leerRelacionadas = async (tabla, columnas, servicioId) => {
    const { data, error } = await obtenerCliente().from(tabla).select(columnas).eq("servicio_id", servicioId);
    if (error) {
        console.warn(`No se pudo leer ${tabla}:`, error.message);
        return [];
    }
    return data;
};

const COLUMNAS_COTIZACION = "id, total, estado, creado_en, items:cotizacion_items(id, concepto, precio)";

/* Los ítems se ordenan por id para mostrarlos en el orden en que el técnico los agregó. */
const aCotizacion = (fila) => ({
    id: String(fila.id),
    total: Number(fila.total),
    estado: fila.estado,
    creadaEn: fila.creado_en,
    items: fila.items
        .map((item) => ({ id: item.id, concepto: item.concepto, precio: Number(item.precio) }))
        .sort((a, b) => a.id - b.id),
});

/* El total no se calcula aquí: la base de datos lo actualiza cada vez que cambian los ítems. */
export const listarCotizaciones = async (servicioId) => {
    const filas = verificar(
        await obtenerCliente()
            .from("cotizaciones")
            .select(COLUMNAS_COTIZACION)
            .eq("servicio_id", servicioId)
            .order("creado_en", { ascending: false })
    );
    return filas.map(aCotizacion);
};

/* El cliente no puede editar "cotizaciones" directamente: lo hace la función responder_cotizacion de Supabase. */
export const responderCotizacion = async (cotizacionId, aprobar) => {
    verificar(
        await obtenerCliente().rpc("responder_cotizacion", {
            p_cotizacion_id: Number(cotizacionId),
            p_aprobar: aprobar,
        })
    );
};

/* Al guardarla, la base de datos pasa el servicio a "calificado" y recalcula el promedio del técnico. */
export const calificarServicio = async (servicioId, { puntuacion, comentario }) => {
    if (!NIVELES_CALIFICACION.some((nivel) => nivel.valor === puntuacion)) {
        throw new Error("Elige de 1 a 5 estrellas.");
    }

    const { error } = await obtenerCliente()
        .from("calificaciones")
        .insert({ servicio_id: Number(servicioId), puntuacion, comentario: comentario.trim() || null });

    // 23505: ya existe una calificación para este servicio.
    if (error?.code === "23505") {
        throw new Error("Este servicio ya fue calificado.");
    }
    if (error) verificar({ error });
};

/*
    Arma el historial de una solicitud con lo que registra el taller:
    la creación, los diagnósticos, las cotizaciones y la calificación.
*/
export const obtenerHistorial = async (solicitud) => {
    const [diagnosticos, cotizaciones, calificaciones] = await Promise.all([
        leerRelacionadas("diagnosticos", "hallazgos, recomendaciones, creado_en", solicitud.id),
        leerRelacionadas("cotizaciones", "total, estado, creado_en", solicitud.id),
        leerRelacionadas("calificaciones", "puntuacion, comentario, creado_en", solicitud.id),
    ]);

    const eventos = [
        { fecha: solicitud.creadaEn, titulo: "Solicitud creada", detalle: "Registraste la solicitud de servicio." },
        ...diagnosticos.map((diagnostico) => ({
            fecha: diagnostico.creado_en,
            titulo: "Diagnóstico del técnico",
            detalle: [diagnostico.hallazgos, diagnostico.recomendaciones && `Recomendación: ${diagnostico.recomendaciones}`]
                .filter(Boolean)
                .join(" "),
        })),
        ...cotizaciones.map((cotizacion) => ({
            fecha: cotizacion.creado_en,
            titulo: `Cotización por ${formatearPesos(cotizacion.total)}`,
            detalle: `Estado: ${buscarOpcion(ESTADOS_COTIZACION, cotizacion.estado).etiqueta.toLowerCase()}.`,
        })),
        ...calificaciones.map((calificacion) => ({
            fecha: calificacion.creado_en,
            titulo: `Calificaste el servicio con ${calificacion.puntuacion}/5`,
            detalle: calificacion.comentario ?? "",
        })),
    ];

    return eventos.sort((a, b) => b.fecha.localeCompare(a.fecha));
};
