/*
    admin.js
    Consultas del panel del administrador. Las reglas de seguridad (RLS) le dejan
    leer todas las tablas.
*/
import { OTROS_PROBLEMAS } from "../datos/categoriasProblemas.js";
import { ESTADOS_FINALES, ESTADOS_SOLICITUD } from "../datos/opciones.js";
import { aSolicitud, COLUMNAS_SOLICITUD } from "./solicitudes.js";
import { estaEnRango } from "../utilidades/filtros.js";
import {
    agruparPorMes,
    calcularPorcentajeAprobadas,
    calcularTiempoPromedio,
    contarPorDispositivo,
    filtrarPorFecha,
    mesesEnRango,
} from "../utilidades/reportes.js";
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

/*
    Los reportes reciben "desde" y "hasta" (AAAA-MM-DD en hora local, vacío = sin límite) y filtran por la
    fecha de solicitud del servicio (servicios.creado_en). El filtro se aplica aquí, después de traer solo
    las columnas necesarias, para usar el mismo cálculo de días locales que las listas del panel.
*/
export const obtenerMetricas = async (desde = "", hasta = "") => {
    const cliente = obtenerCliente();

    const [perfilesClientes, tecnicos, tecnicosDisponibles, servicios, cotizacionesAprobadas] = await Promise.all([
        cliente.from("perfiles").select("creado_en").eq("rol", "cliente").then(verificar),
        contar(cliente.from("perfiles").select("id", { count: "exact", head: true }).eq("rol", "tecnico")),
        contar(cliente.from("tecnicos").select("perfil_id", { count: "exact", head: true }).eq("disponible", true)),
        cliente.from("servicios").select("estado, creado_en").then(verificar),
        cliente.from("cotizaciones").select("total, servicio:servicios(estado, creado_en)").eq("estado", "aprobada").then(verificar),
    ]);

    const serviciosEnRango = filtrarPorFecha(servicios, desde, hasta);
    const aprobadasEnRango = cotizacionesAprobadas.filter((cotizacion) => cotizacion.servicio && estaEnRango(cotizacion.servicio.creado_en, desde, hasta));

    return {
        clientes: perfilesClientes.length,
        clientesNuevos: filtrarPorFecha(perfilesClientes, desde, hasta).length,
        tecnicos,
        tecnicosDisponibles,
        totalServicios: serviciosEnRango.length,
        serviciosEnCurso: serviciosEnRango.filter((servicio) => !ESTADOS_FINALES.includes(servicio.estado)).length,
        serviciosPorEstado: contarPorEstado(serviciosEnRango),
        ingresos: calcularIngresos(aprobadasEnRango),
    };
};

/*
    Ingresos de cada mes del rango: cotizaciones aprobadas de servicios ya terminados, en el mes en que
    se solicitó el servicio (la base de datos no guarda la fecha de finalización).
*/
export const obtenerIngresosPorMes = async (desde = "", hasta = "") => {
    const cotizaciones = verificar(
        await obtenerCliente().from("cotizaciones").select("total, servicio:servicios(estado, creado_en)").eq("estado", "aprobada")
    );
    const realizadas = cotizaciones.filter(
        (cotizacion) => cotizacion.servicio && ESTADOS_FINALES.includes(cotizacion.servicio.estado) && estaEnRango(cotizacion.servicio.creado_en, desde, hasta)
    );

    return agruparPorMes(realizadas, mesesEnRango(desde, hasta), (cotizacion) => cotizacion.servicio.creado_en, (cotizacion) => Number(cotizacion.total)).map(
        ({ clave, etiqueta, nombreCompleto, valor }) => ({ mes: clave, etiqueta, nombreCompleto, total: valor })
    );
};

/*
    Días promedio entre la solicitud y el cierre del servicio. La base de datos no guarda cuándo se
    finalizó: se usa la fecha de la calificación del cliente, el único registro posterior al trabajo.
    Devuelve { dias, servicios } o null si ningún servicio del rango fue calificado.
*/
export const obtenerTiempoPromedio = async (desde = "", hasta = "") => {
    const calificaciones = verificar(
        await obtenerCliente().from("calificaciones").select("servicio_id, creado_en, servicio:servicios(creado_en, estado)")
    );

    // Un servicio cuenta una sola vez, con su calificación más antigua.
    const porServicio = new Map();
    for (const calificacion of calificaciones) {
        const { servicio } = calificacion;
        if (!servicio || !ESTADOS_FINALES.includes(servicio.estado) || !estaEnRango(servicio.creado_en, desde, hasta)) continue;

        const anterior = porServicio.get(calificacion.servicio_id);
        if (!anterior || calificacion.creado_en < anterior.fin) porServicio.set(calificacion.servicio_id, { inicio: servicio.creado_en, fin: calificacion.creado_en });
    }

    return calcularTiempoPromedio([...porServicio.values()]);
};

/*
    De todas las cotizaciones emitidas en el rango, cuántas aprobó el cliente. Se cuentan las cotizaciones
    y no el estado actual del servicio, porque un servicio aprobado sigue avanzando a "en reparación", etc.
    Devuelve { porcentaje, aprobadas, cotizadas }.
*/
export const obtenerPorcentajeAprobadas = async (desde = "", hasta = "") => {
    const cotizaciones = verificar(await obtenerCliente().from("cotizaciones").select("estado, servicio:servicios(creado_en)"));
    return calcularPorcentajeAprobadas(cotizaciones.filter((cotizacion) => cotizacion.servicio && estaEnRango(cotizacion.servicio.creado_en, desde, hasta)));
};

/* Cantidad de servicios del rango por tipo de equipo (celular, computador, consola), de mayor a menor. */
export const obtenerServiciosPorDispositivo = async (desde = "", hasta = "") => {
    const servicios = verificar(await obtenerCliente().from("servicios").select("creado_en, dispositivo:dispositivos(tipo)"));
    return contarPorDispositivo(filtrarPorFecha(servicios, desde, hasta));
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

    const cliente = obtenerCliente();
    const [perfil, ficha] = await Promise.all([
        cliente.from("perfiles").select("rol").eq("id", tecnicoId).maybeSingle().then(verificar),
        cliente.from("tecnicos").select("perfil_id, disponible").eq("perfil_id", tecnicoId).maybeSingle().then(verificar),
    ]);
    if (!perfil || perfil.rol !== "tecnico" || !ficha) {
        throw new Error("Solo puedes asignar servicios a técnicos activos.");
    }
    if (!ficha.disponible) {
        throw new Error("El técnico seleccionado no está disponible para nuevos servicios.");
    }

    const cambios = servicio.estado === "solicitado" ? { tecnico_id: tecnicoId, estado: "asignado" } : { tecnico_id: tecnicoId };
    const filas = verificar(
        await cliente.from("servicios").update(cambios).eq("id", servicio.id).eq("estado", servicio.estado).select("id")
    );

    if (filas.length === 0) throw new Error("El servicio cambió de estado. Actualiza la página e inténtalo de nuevo.");
};

const contarPorCliente = (filas, clienteId) => filas.filter((fila) => fila.cliente_id === clienteId).length;

/* Los técnicos desactivados también tienen rol "cliente": se reconocen porque conservan su fila en "tecnicos". */
export const listarClientes = async () => {
    const cliente = obtenerCliente();
    const [perfiles, fichasTecnicos, dispositivos, servicios] = await Promise.all([
        cliente.from("perfiles").select("id, nombre, telefono, creado_en").eq("rol", "cliente").order("nombre").then(verificar),
        cliente.from("tecnicos").select("perfil_id").then(verificar),
        cliente.from("dispositivos").select("cliente_id").then(verificar),
        cliente.from("servicios").select("cliente_id, estado").then(verificar),
    ]);

    const idsTecnicos = new Set(fichasTecnicos.map((ficha) => ficha.perfil_id));
    return perfiles
        .filter((perfil) => !idsTecnicos.has(perfil.id))
        .map((perfil) => {
            const suyos = servicios.filter((servicio) => servicio.cliente_id === perfil.id);
            return {
                id: perfil.id,
                nombre: perfil.nombre,
                telefono: perfil.telefono ?? "",
                registradoEn: perfil.creado_en,
                dispositivos: contarPorCliente(dispositivos, perfil.id),
                servicios: suyos.length,
                serviciosEnCurso: suyos.filter((servicio) => !ESTADOS_FINALES.includes(servicio.estado)).length,
            };
        });
};

export const obtenerFichaCliente = async (clienteId) => {
    const cliente = obtenerCliente();
    const [perfil, dispositivos, filasServicios] = await Promise.all([
        cliente.from("perfiles").select("id, nombre, telefono, rol, creado_en").eq("id", clienteId).maybeSingle().then(verificar),
        cliente.from("dispositivos").select("id, tipo, marca, modelo, serial").eq("cliente_id", clienteId).order("creado_en", { ascending: false }).then(verificar),
        cliente.from("servicios").select(COLUMNAS_SOLICITUD).eq("cliente_id", clienteId).order("creado_en", { ascending: false }).then(verificar),
    ]);

    if (!perfil || perfil.rol !== "cliente") throw new Error("No encontramos ese cliente.");

    return {
        id: perfil.id,
        nombre: perfil.nombre,
        telefono: perfil.telefono ?? "",
        registradoEn: perfil.creado_en,
        dispositivos: dispositivos.map((fila) => ({
            id: String(fila.id),
            tipo: fila.tipo,
            marca: fila.marca ?? "",
            modelo: fila.modelo ?? "",
            numeroSerie: fila.serial ?? "",
        })),
        servicios: await conPersonas(filasServicios),
    };
};

const contarProblemas = (servicios) => {
    const conteo = new Map();
    for (const servicio of servicios) {
        const categoria = servicio.categoria || OTROS_PROBLEMAS;
        conteo.set(categoria, (conteo.get(categoria) ?? 0) + 1);
    }
    // De más a menos frecuente; "Otros" siempre al final.
    return [...conteo]
        .map(([categoria, cantidad]) => ({ categoria, cantidad }))
        .sort((a, b) => {
            if (a.categoria === OTROS_PROBLEMAS || b.categoria === OTROS_PROBLEMAS) {
                return a.categoria === b.categoria ? 0 : a.categoria === OTROS_PROBLEMAS ? 1 : -1;
            }
            return b.cantidad - a.cantidad;
        });
};

/* Promedio real de cada técnico a partir de sus calificaciones; los mejores primero. */
const rankingTecnicos = async (calificaciones, limite = 5) => {
    const porTecnico = new Map();
    for (const { puntuacion, servicio } of calificaciones) {
        if (!servicio?.tecnico_id) continue;
        const actual = porTecnico.get(servicio.tecnico_id) ?? { suma: 0, cantidad: 0 };
        porTecnico.set(servicio.tecnico_id, { suma: actual.suma + puntuacion, cantidad: actual.cantidad + 1 });
    }

    const perfiles = await obtenerPerfiles([...porTecnico.keys()]);
    return [...porTecnico]
        .map(([id, { suma, cantidad }]) => ({ id, nombre: perfiles[id]?.nombre ?? "Técnico", promedio: suma / cantidad, cantidad }))
        .sort((a, b) => b.promedio - a.promedio || b.cantidad - a.cantidad)
        .slice(0, limite);
};

export const obtenerEstadisticas = async (desde = "", hasta = "") => {
    const cliente = obtenerCliente();
    const [servicios, calificaciones] = await Promise.all([
        cliente.from("servicios").select("categoria, creado_en").then(verificar),
        cliente.from("calificaciones").select("puntuacion, servicio:servicios(tecnico_id, creado_en)").then(verificar),
    ]);

    const serviciosEnRango = filtrarPorFecha(servicios, desde, hasta);
    const calificacionesEnRango = calificaciones.filter((calificacion) => calificacion.servicio && estaEnRango(calificacion.servicio.creado_en, desde, hasta));

    return {
        serviciosPorMes: agruparPorMes(serviciosEnRango, mesesEnRango(desde, hasta), (servicio) => servicio.creado_en).map(
            ({ clave, etiqueta, nombreCompleto, valor }) => ({ clave, etiqueta, nombreCompleto, cantidad: valor })
        ),
        problemasFrecuentes: contarProblemas(serviciosEnRango),
        mejoresTecnicos: await rankingTecnicos(calificacionesEnRango),
    };
};

/* Suma de las cotizaciones aprobadas de cada servicio ({ [servicioId]: total }); sirve para exportar la lista de servicios. */
export const obtenerTotalesPorServicio = async () => {
    const cotizaciones = verificar(await obtenerCliente().from("cotizaciones").select("servicio_id, total").eq("estado", "aprobada"));
    const totales = {};
    for (const cotizacion of cotizaciones) {
        totales[cotizacion.servicio_id] = (totales[cotizacion.servicio_id] ?? 0) + Number(cotizacion.total);
    }
    return totales;
};
