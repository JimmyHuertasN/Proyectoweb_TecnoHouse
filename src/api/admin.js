/*
    admin.js
    Consultas del panel del administrador. Las reglas de seguridad (RLS) le dejan
    leer todas las tablas.
*/
import { OTROS_PROBLEMAS } from "../datos/categoriasProblemas.js";
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

const formatoMes = new Intl.DateTimeFormat("es-CO", { month: "short" });
const formatoMesLargo = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" });

const claveMes = (fecha) => `${fecha.getFullYear()}-${fecha.getMonth()}`;

/* Cantidad de servicios creados en cada uno de los últimos "meses" meses, incluido el actual. */
const contarPorMes = (servicios, meses = 6) => {
    const hoy = new Date();
    return Array.from({ length: meses }, (_, indice) => {
        const mes = new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1 - indice), 1);
        const cantidad = servicios.filter((servicio) => claveMes(new Date(servicio.creado_en)) === claveMes(mes)).length;
        return { clave: claveMes(mes), etiqueta: formatoMes.format(mes), nombreCompleto: formatoMesLargo.format(mes), cantidad };
    });
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

export const obtenerEstadisticas = async () => {
    const cliente = obtenerCliente();
    const [servicios, calificaciones] = await Promise.all([
        cliente.from("servicios").select("categoria, creado_en").then(verificar),
        cliente.from("calificaciones").select("puntuacion, servicio:servicios(tecnico_id)").then(verificar),
    ]);

    return {
        serviciosPorMes: contarPorMes(servicios),
        problemasFrecuentes: contarProblemas(servicios),
        mejoresTecnicos: await rankingTecnicos(calificaciones),
    };
};
