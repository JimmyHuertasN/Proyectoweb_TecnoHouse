/*
    tecnico.js
    Consultas del panel del técnico sobre la tabla "servicios". Las reglas de
    seguridad (RLS) solo le dejan ver las solicitudes pendientes y las suyas.
*/
import { AVANCES_TECNICO } from "../datos/opciones.js";
import { aSolicitud, COLUMNAS_SOLICITUD } from "./solicitudes.js";
import { obtenerCliente, verificar } from "./supabase.js";

/* Devuelve { idCliente: { nombre, telefono } } para mostrar quién pidió cada servicio. */
const obtenerClientes = async (idsClientes) => {
    if (idsClientes.length === 0) return {};

    const perfiles = verificar(
        await obtenerCliente().from("perfiles").select("id, nombre, telefono").in("id", [...new Set(idsClientes)])
    );
    return Object.fromEntries(perfiles.map((perfil) => [perfil.id, { nombre: perfil.nombre, telefono: perfil.telefono ?? "" }]));
};

const conClientes = async (filas) => {
    const clientes = await obtenerClientes(filas.map((fila) => fila.cliente_id));
    return filas.map((fila) => ({
        ...aSolicitud(fila),
        cliente: clientes[fila.cliente_id] ?? { nombre: "Cliente", telefono: "" },
    }));
};

/* Solicitudes sin técnico, de la más antigua a la más reciente, para atender primero las que llevan más tiempo esperando. */
export const listarPendientes = async () => {
    const filas = verificar(
        await obtenerCliente()
            .from("servicios")
            .select(COLUMNAS_SOLICITUD)
            .is("tecnico_id", null)
            .eq("estado", "solicitado")
            .order("creado_en", { ascending: true })
    );
    return conClientes(filas);
};

/* La función aceptar_servicio de Supabase evita que dos técnicos tomen el mismo servicio. */
export const aceptarServicio = async (servicioId) => {
    verificar(await obtenerCliente().rpc("aceptar_servicio", { p_servicio_id: Number(servicioId) }));
};

export const listarAsignados = async (tecnicoId) => {
    const filas = verificar(
        await obtenerCliente()
            .from("servicios")
            .select(COLUMNAS_SOLICITUD)
            .eq("tecnico_id", tecnicoId)
            .order("creado_en", { ascending: false })
    );
    return conClientes(filas);
};

export const obtenerAsignado = async (tecnicoId, id) => {
    const fila = verificar(
        await obtenerCliente().from("servicios").select(COLUMNAS_SOLICITUD).eq("id", id).eq("tecnico_id", tecnicoId).maybeSingle()
    );
    if (!fila) throw new Error("No encontramos ese servicio entre tus asignados.");

    const [servicio] = await conClientes([fila]);
    return servicio;
};

const aDiagnostico = (fila) => ({
    id: String(fila.id),
    hallazgos: fila.hallazgos,
    recomendaciones: fila.recomendaciones ?? "",
    creadoEn: fila.creado_en,
});

export const listarDiagnosticos = async (servicioId) => {
    const filas = verificar(
        await obtenerCliente()
            .from("diagnosticos")
            .select("id, hallazgos, recomendaciones, creado_en")
            .eq("servicio_id", servicioId)
            .order("creado_en", { ascending: false })
    );
    return filas.map(aDiagnostico);
};

export const registrarDiagnostico = async (servicioId, { hallazgos, recomendaciones }) => {
    if (!hallazgos.trim()) throw new Error("Describe qué encontraste en el equipo.");

    verificar(
        await obtenerCliente()
            .from("diagnosticos")
            .insert({ servicio_id: Number(servicioId), hallazgos: hallazgos.trim(), recomendaciones: recomendaciones.trim() || null })
    );
};

/* Valida los ítems del formulario y los deja con los nombres de las columnas. */
export const prepararItems = (items) => {
    const limpios = items.map((item) => ({
        concepto: item.concepto.trim(),
        precio: item.precio === "" ? NaN : Number(item.precio),
    }));

    if (limpios.length === 0) throw new Error("Agrega al menos un ítem a la cotización.");
    if (limpios.some((item) => !item.concepto)) throw new Error("Cada ítem necesita un concepto.");
    if (limpios.some((item) => !Number.isFinite(item.precio) || item.precio < 0)) {
        throw new Error("Cada ítem necesita un precio de 0 o más.");
    }
    return limpios;
};

/*
    Al crear la cotización, la base de datos pasa el servicio a "cotizado" y calcula el total
    a partir de los ítems. Si los ítems no se guardan, se deshace todo para no dejar una cotización vacía.
*/
export const crearCotizacion = async (servicioId, items) => {
    const filasItems = prepararItems(items);
    const cliente = obtenerCliente();

    const cotizacion = verificar(
        await cliente.from("cotizaciones").insert({ servicio_id: Number(servicioId) }).select("id").single()
    );

    const { error } = await cliente
        .from("cotizacion_items")
        .insert(filasItems.map((item) => ({ ...item, cotizacion_id: cotizacion.id })));

    if (error) {
        await cliente.from("cotizaciones").delete().eq("id", cotizacion.id);
        await cliente.from("servicios").update({ estado: "en_diagnostico" }).eq("id", servicioId);
        verificar({ error });
    }
};

/*
    Pasa el servicio al siguiente estado. El filtro por el estado actual evita
    avanzar dos veces si el servicio cambió en otra pestaña o lo cambió el cliente.
*/
export const avanzarEstado = async (tecnicoId, servicio) => {
    const avance = AVANCES_TECNICO[servicio.estado];
    if (!avance) throw new Error("Este servicio no se puede avanzar desde su estado actual.");

    const filas = verificar(
        await obtenerCliente()
            .from("servicios")
            .update({ estado: avance.siguiente })
            .eq("id", servicio.id)
            .eq("tecnico_id", tecnicoId)
            .eq("estado", servicio.estado)
            .select("id")
    );

    if (filas.length === 0) throw new Error("El servicio cambió de estado. Actualiza la página e inténtalo de nuevo.");
};
