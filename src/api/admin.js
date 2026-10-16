/*
    admin.js
    Consultas del panel del administrador. Las reglas de seguridad (RLS) le dejan
    leer todas las tablas.
*/
import { ESTADOS_FINALES, ESTADOS_SOLICITUD } from "../datos/opciones.js";
import { aSolicitud, COLUMNAS_SOLICITUD } from "./solicitudes.js";
import { obtenerCliente, verificar } from "./supabase.js";
import { obtenerPerfiles } from "./usuarios.js";

/* Con head: true no se traen filas, solo el conteo. */
const contar = async (consulta) => {
    const { count, error } = await consulta;
    verificar({ error });
    return count ?? 0;
};

const sumarTotales = (cotizaciones) => cotizaciones.reduce((suma, cotizacion) => suma + Number(cotizacion.total), 0);

/*
    Ingresos = cotizaciones aprobadas. Se separan las de servicios ya terminados
    (ingreso realizado) de las que siguen en reparación (por cobrar).
*/
const calcularIngresos = (cotizacionesAprobadas) => {
    const terminadas = cotizacionesAprobadas.filter((cotizacion) => ESTADOS_FINALES.includes(cotizacion.servicio?.estado));
    const total = sumarTotales(cotizacionesAprobadas);
    const realizados = sumarTotales(terminadas);
    return { total, realizados, porCobrar: total - realizados };
};

const contarPorEstado = (servicios) =>
    ESTADOS_SOLICITUD.map((estado) => ({
        ...estado,
        cantidad: servicios.filter((servicio) => servicio.estado === estado.valor).length,
    }));

export const obtenerMetricas = async () => {
    const cliente = obtenerCliente();
    const contarPerfiles = (rol) => contar(cliente.from("perfiles").select("id", { count: "exact", head: true }).eq("rol", rol));

    const [clientes, tecnicos, tecnicosDisponibles, servicios, cotizacionesAprobadas] = await Promise.all([
        contarPerfiles("cliente"),
        contarPerfiles("tecnico"),
        contar(cliente.from("tecnicos").select("perfil_id", { count: "exact", head: true }).eq("disponible", true)),
        cliente.from("servicios").select("estado").then(verificar),
        cliente.from("cotizaciones").select("total, servicio:servicios(estado)").eq("estado", "aprobada").then(verificar),
    ]);

    return {
        clientes,
        tecnicos,
        tecnicosDisponibles,
        totalServicios: servicios.length,
        serviciosEnCurso: servicios.filter((servicio) => !ESTADOS_FINALES.includes(servicio.estado)).length,
        serviciosPorEstado: contarPorEstado(servicios),
        ingresos: calcularIngresos(cotizacionesAprobadas),
    };
};

const SIN_PERFIL = { nombre: "", telefono: "" };

/* Agrega a cada servicio el nombre del cliente y del técnico (si tiene). */
const conPersonas = async (filas) => {
    const perfiles = await obtenerPerfiles(filas.flatMap((fila) => [fila.cliente_id, fila.tecnico_id]));
    return filas.map((fila) => ({
        ...aSolicitud(fila),
        cliente: perfiles[fila.cliente_id] ?? SIN_PERFIL,
        tecnico: fila.tecnico_id ? (perfiles[fila.tecnico_id] ?? SIN_PERFIL) : null,
    }));
};

export const listarServicios = async () => {
    const filas = verificar(
        await obtenerCliente().from("servicios").select(COLUMNAS_SOLICITUD).order("creado_en", { ascending: false })
    );
    return conPersonas(filas);
};

export const obtenerServicio = async (id) => {
    const fila = verificar(await obtenerCliente().from("servicios").select(COLUMNAS_SOLICITUD).eq("id", id).maybeSingle());
    if (!fila) throw new Error("No encontramos ese servicio.");

    const [servicio] = await conPersonas([fila]);
    return servicio;
};

/*
    Todos los que tienen ficha en "tecnicos". Un técnico desactivado conserva su ficha,
    pero su rol vuelve a "cliente": por eso "activo" se lee del rol de su perfil.
*/
export const listarTecnicos = async () => {
    const cliente = obtenerCliente();
    const [fichas, serviciosEnCurso] = await Promise.all([
        cliente.from("tecnicos").select("perfil_id, especialidad, disponible, calificacion_promedio").then(verificar),
        cliente.from("servicios").select("tecnico_id").not("tecnico_id", "is", null).not("estado", "in", `(${ESTADOS_FINALES.join(",")})`).then(verificar),
    ]);
    const perfiles = verificar(
        await cliente.from("perfiles").select("id, nombre, telefono, rol").in("id", fichas.map((ficha) => ficha.perfil_id))
    );

    return fichas
        .map((ficha) => {
            const perfil = perfiles.find((fila) => fila.id === ficha.perfil_id);
            return {
                id: ficha.perfil_id,
                nombre: perfil?.nombre ?? "Sin nombre",
                telefono: perfil?.telefono ?? "",
                activo: perfil?.rol === "tecnico",
                especialidad: ficha.especialidad ?? "",
                disponible: ficha.disponible,
                calificacion: Number(ficha.calificacion_promedio ?? 0),
                serviciosEnCurso: serviciosEnCurso.filter((servicio) => servicio.tecnico_id === ficha.perfil_id).length,
            };
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
};

/*
    La función crear_tecnico de Supabase (supabase/crear_tecnico.sql) crea la cuenta ya
    confirmada, le pone el rol "tecnico" y guarda la especialidad en un solo paso.
*/
export const crearTecnico = async ({ nombre, correo, telefono, especialidad, contrasena }) => {
    verificar(
        await obtenerCliente().rpc("crear_tecnico", {
            p_nombre: nombre,
            p_correo: correo,
            p_telefono: telefono,
            p_especialidad: especialidad,
            p_contrasena: contrasena,
        })
    );
};

/*
    Desactivar devuelve el rol a "cliente" (ya no entra al panel del técnico) y lo deja no disponible.
    No se permite si tiene servicios en curso: primero hay que reasignarlos.
*/
export const cambiarEstadoTecnico = async (tecnico, activo) => {
    if (!activo && tecnico.serviciosEnCurso > 0) {
        throw new Error(`${tecnico.nombre} tiene ${tecnico.serviciosEnCurso} servicio(s) en curso. Reasígnalos antes de desactivarlo.`);
    }

    // Si las reglas de seguridad bloquean el cambio, Supabase no da error: solo no actualiza filas.
    const cliente = obtenerCliente();
    const filas = verificar(
        await cliente.from("perfiles").update({ rol: activo ? "tecnico" : "cliente" }).eq("id", tecnico.id).select("rol")
    );
    if (filas.length === 0) throw new Error("No se pudo cambiar el estado del técnico. Revisa los permisos del administrador.");

    if (!activo) {
        verificar(await cliente.from("tecnicos").update({ disponible: false }).eq("perfil_id", tecnico.id));
    }
};

/*
    Cambia el técnico de un servicio activo. Si aún no tenía técnico ("solicitado"),
    pasa a "asignado", igual que cuando un técnico lo toma.
*/
export const reasignarTecnico = async (servicio, tecnicoId) => {
    if (ESTADOS_FINALES.includes(servicio.estado)) {
        throw new Error("No se puede cambiar el técnico de un servicio terminado.");
    }

    const cambios = servicio.estado === "solicitado" ? { tecnico_id: tecnicoId, estado: "asignado" } : { tecnico_id: tecnicoId };
    const filas = verificar(
        await obtenerCliente().from("servicios").update(cambios).eq("id", servicio.id).eq("estado", servicio.estado).select("id")
    );

    if (filas.length === 0) throw new Error("El servicio cambió de estado. Actualiza la página e inténtalo de nuevo.");
};
