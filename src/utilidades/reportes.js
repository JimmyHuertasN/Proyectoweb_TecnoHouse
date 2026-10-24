/*
    reportes.js
    Cálculos puros de los reportes del administrador (rangos de fechas, meses, promedios).
    No consultan Supabase: reciben filas ya cargadas y devuelven números. Las fechas son
    AAAA-MM-DD en hora local, igual que los filtros de fechas de las listas.
*/
import { TIPOS_DISPOSITIVO } from "../datos/opciones.js";
import { estaEnRango, fechaLocal } from "./filtros.js";

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;
const MESES_POR_DEFECTO = 6;
const MESES_MAXIMOS = 24;

export const RANGOS_PREDEFINIDOS = [
    { valor: "7d", etiqueta: "Últimos 7 días" },
    { valor: "30d", etiqueta: "Últimos 30 días" },
    { valor: "6m", etiqueta: "Últimos 6 meses" },
    { valor: "personalizado", etiqueta: "Personalizado" },
];

const dosDigitos = (numero) => String(numero).padStart(2, "0");

const aTextoFecha = (fecha) => `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;

/* "2026-03-15" → Date local a las 00:00 (new Date("2026-03-15") sería UTC y correría el día). */
const desdeTextoFecha = (texto) => {
    const [anio, mes, dia] = texto.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
};

/* Hasta hoy incluido: 7 días son hoy y los 6 anteriores; 6 meses empiezan el día 1 del mes de hace 5 meses. */
export const rangoPredefinido = (valor, hoy = new Date()) => {
    const hasta = aTextoFecha(hoy);

    if (valor === "7d") return { desde: aTextoFecha(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6)), hasta };
    if (valor === "30d") return { desde: aTextoFecha(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 29)), hasta };
    if (valor === "6m") return { desde: aTextoFecha(new Date(hoy.getFullYear(), hoy.getMonth() - (MESES_POR_DEFECTO - 1), 1)), hasta };
    return { desde: "", hasta: "" };
};

const formatoMes = new Intl.DateTimeFormat("es-CO", { month: "short" });
const formatoMesLargo = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" });

/* Clave AAAA-MM del mes de una fecha ISO, en hora local. */
export const claveMes = (fechaIso) => fechaLocal(fechaIso).slice(0, 7);

/*
    Los meses que toca el rango, del más antiguo al actual. Si no hay "desde" se muestran los
    últimos 6 meses; nunca más de 24, para que el gráfico siga siendo legible.
*/
export const mesesEnRango = (desde = "", hasta = "", hoy = new Date()) => {
    const fin = hasta ? desdeTextoFecha(hasta) : hoy;
    let inicio = desde ? desdeTextoFecha(desde) : new Date(fin.getFullYear(), fin.getMonth() - (MESES_POR_DEFECTO - 1), 1);

    const primerMes = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
    const ultimoMes = new Date(fin.getFullYear(), fin.getMonth(), 1);
    const cantidad = Math.max(1, (ultimoMes.getFullYear() - primerMes.getFullYear()) * 12 + ultimoMes.getMonth() - primerMes.getMonth() + 1);
    const mostrados = Math.min(cantidad, MESES_MAXIMOS);
    const conAnio = mostrados > 12;

    inicio = new Date(ultimoMes.getFullYear(), ultimoMes.getMonth() - (mostrados - 1), 1);
    return Array.from({ length: mostrados }, (_, indice) => {
        const mes = new Date(inicio.getFullYear(), inicio.getMonth() + indice, 1);
        const etiqueta = formatoMes.format(mes);
        return {
            clave: `${mes.getFullYear()}-${dosDigitos(mes.getMonth() + 1)}`,
            etiqueta: conAnio ? `${etiqueta} ${String(mes.getFullYear()).slice(2)}` : etiqueta,
            nombreCompleto: formatoMesLargo.format(mes),
        };
    });
};

/* Suma "valor" de las filas de cada mes (por omisión cuenta 1 por fila). Los meses sin filas quedan en 0. */
export const agruparPorMes = (filas, meses, obtenerFecha, obtenerValor = () => 1) =>
    meses.map((mes) => ({
        ...mes,
        valor: filas.reduce((suma, fila) => (claveMes(obtenerFecha(fila)) === mes.clave ? suma + obtenerValor(fila) : suma), 0),
    }));

/* Promedio en días de { inicio, fin } (fechas ISO), con un decimal. null si no hay ninguno válido. */
export const calcularTiempoPromedio = (periodos) => {
    const duraciones = periodos
        .map(({ inicio, fin }) => (new Date(fin) - new Date(inicio)) / MILISEGUNDOS_POR_DIA)
        .filter((dias) => Number.isFinite(dias) && dias >= 0);
    if (duraciones.length === 0) return null;

    const promedio = duraciones.reduce((suma, dias) => suma + dias, 0) / duraciones.length;
    return { dias: Math.round(promedio * 10) / 10, servicios: duraciones.length };
};

/* Porcentaje (0-100, sin decimales) de cotizaciones aprobadas sobre todas las que se emitieron. */
export const calcularPorcentajeAprobadas = (cotizaciones) => {
    const aprobadas = cotizaciones.filter((cotizacion) => cotizacion.estado === "aprobada").length;
    const cotizadas = cotizaciones.length;
    return { porcentaje: cotizadas === 0 ? 0 : Math.round((aprobadas / cotizadas) * 100), aprobadas, cotizadas };
};

const PLURALES_DISPOSITIVO = { computador: "Computadores", celular: "Celulares", consola: "Consolas" };

const etiquetaDispositivo = (tipo) => {
    if (!tipo) return "Sin dato";
    return PLURALES_DISPOSITIVO[tipo] ?? TIPOS_DISPOSITIVO.find((opcion) => opcion.valor === tipo)?.etiqueta ?? tipo;
};

/* Cantidad de servicios por tipo de equipo, del más frecuente al menos. */
export const contarPorDispositivo = (servicios) => {
    const conteo = new Map();
    for (const servicio of servicios) {
        const dispositivo = etiquetaDispositivo(servicio.dispositivo?.tipo);
        conteo.set(dispositivo, (conteo.get(dispositivo) ?? 0) + 1);
    }
    return [...conteo].map(([dispositivo, cantidad]) => ({ dispositivo, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
};

/* Filas cuya fecha (por omisión "creado_en") cae en el rango. */
export const filtrarPorFecha = (filas, desde, hasta, obtenerFecha = (fila) => fila.creado_en) =>
    filas.filter((fila) => estaEnRango(obtenerFecha(fila), desde, hasta));
