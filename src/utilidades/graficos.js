/*
    graficos.js
    Cálculos puros que comparten los gráficos del panel (componentes/panel/graficos).
*/

/* Colores de las series en orden fijo (ver --grafico-* en principal.css). */
export const COLORES_GRAFICO = ["var(--grafico-1)", "var(--grafico-2)", "var(--grafico-3)", "var(--grafico-4)", "var(--grafico-5)", "var(--grafico-6)"];
export const COLOR_OTROS = "var(--grafico-otros)";

const formatoCompacto = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });

/* Dinero abreviado para ejes y etiquetas: 285.000 → "$285 mil", 1.250.000 → "$1,3 M" (según el navegador). */
export const pesosCompactos = (valor) => (valor === 0 ? "$0" : `$${formatoCompacto.format(valor)}`);

/*
    Marcas "redondas" del eje vertical (0, 250 mil, 500 mil...) para un máximo dado.
    Devuelve { tope, marcas }: "tope" es la última marca, mayor o igual al máximo.
*/
export const marcasEje = (maximo, cantidadDeseada = 4) => {
    if (!(maximo > 0)) return { tope: 1, marcas: [0] };
    const pasoAproximado = maximo / cantidadDeseada;
    const magnitud = 10 ** Math.floor(Math.log10(pasoAproximado));
    const fraccion = pasoAproximado / magnitud;
    const paso = (fraccion <= 1 ? 1 : fraccion <= 2 ? 2 : fraccion <= 2.5 ? 2.5 : fraccion <= 5 ? 5 : 10) * magnitud;
    const tope = Math.ceil(maximo / paso) * paso;
    // Se multiplica en vez de sumar para no acumular errores de coma flotante (0,30000000004).
    const marcas = Array.from({ length: Math.round(tope / paso) + 1 }, (_, indice) => indice * paso);
    return { tope, marcas };
};

/* Porcentaje entero de "parte" sobre "total" (0 si el total es 0). */
export const porcentajeDe = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0);

/*
    Cada cuántas categorías mostrar la etiqueta del eje horizontal para que no se encimen:
    con "ancho" px disponibles y unos "anchoEtiqueta" px por etiqueta.
*/
export const saltoDeEtiquetas = (cantidad, ancho, anchoEtiqueta = 44) =>
    Math.max(1, Math.ceil(cantidad / Math.max(1, Math.floor(ancho / anchoEtiqueta))));

/*
    Partes del gráfico circular para una serie mensual: un color por mes, en orden. Con más de
    "maximo" meses, los más antiguos se suman en "Meses anteriores" (gris) para no pasar de seis partes.
    meses: [{ clave, nombreCompleto, valor }].
*/
export const partesPorMes = (meses, maximo = 6) => {
    const recientes = meses.length > maximo ? meses.slice(-(maximo - 1)) : meses;
    const anteriores = meses.length > maximo ? meses.slice(0, meses.length - (maximo - 1)) : [];
    const partes = recientes.map((mes, indice) => ({
        clave: mes.clave,
        nombre: mes.nombreCompleto.charAt(0).toUpperCase() + mes.nombreCompleto.slice(1),
        valor: mes.valor,
        color: COLORES_GRAFICO[indice],
    }));
    if (anteriores.length === 0) return partes;
    return [{ clave: "anteriores", nombre: "Meses anteriores", valor: anteriores.reduce((suma, mes) => suma + mes.valor, 0), color: COLOR_OTROS }, ...partes];
};

/* Colores en orden fijo para partes ya ordenadas; la que tenga "esOtros" va en gris. */
export const colorearPartes = (partes) => {
    let posicion = 0;
    return partes.map((parte) => ({ ...parte, color: parte.esOtros ? COLOR_OTROS : COLORES_GRAFICO[posicion++] }));
};
