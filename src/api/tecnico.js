/*
    tecnico.js
    Consultas del panel del técnico sobre la tabla "servicios". Las reglas de
    seguridad (RLS) solo le dejan ver las solicitudes pendientes y las suyas.
*/
import { aSolicitud, COLUMNAS_SOLICITUD } from "./solicitudes.js";
import { obtenerCliente, verificar } from "./supabase.js";

/* Devuelve un objeto { idCliente: nombre } para mostrar quién pidió cada servicio. */
const obtenerNombresClientes = async (idsClientes) => {
    if (idsClientes.length === 0) return {};

    const perfiles = verificar(
        await obtenerCliente().from("perfiles").select("id, nombre").in("id", [...new Set(idsClientes)])
    );
    return Object.fromEntries(perfiles.map((perfil) => [perfil.id, perfil.nombre]));
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

    const nombres = await obtenerNombresClientes(filas.map((fila) => fila.cliente_id));
    return filas.map((fila) => ({ ...aSolicitud(fila), nombreCliente: nombres[fila.cliente_id] ?? "Cliente" }));
};

/* La función aceptar_servicio de Supabase evita que dos técnicos tomen el mismo servicio. */
export const aceptarServicio = async (servicioId) => {
    verificar(await obtenerCliente().rpc("aceptar_servicio", { p_servicio_id: Number(servicioId) }));
};
