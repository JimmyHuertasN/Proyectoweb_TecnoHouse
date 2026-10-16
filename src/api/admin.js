/*
    admin.js
    Consultas del panel del administrador. Las reglas de seguridad (RLS) le dejan
    leer todas las tablas.
*/
import { ESTADOS_FINALES, ESTADOS_SOLICITUD } from "../datos/opciones.js";
import { obtenerCliente, verificar } from "./supabase.js";

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
