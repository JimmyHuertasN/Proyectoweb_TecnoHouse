import { useMemo, useState } from "react";

const sonIguales = (a, b) => Object.keys({ ...a, ...b }).every((clave) => a[clave] === b[clave]);

/*
    Filtra y pagina una lista en el navegador.
    - lista: los elementos ya cargados.
    - cumple(elemento, filtros): true si el elemento pasa la búsqueda y los filtros.
      Debe definirse fuera del componente para que no cambie en cada render.
    - filtrosVacios: valores sin ningún filtro (los que deja "Limpiar filtros"); incluye "texto".
    - tamanoPagina: elementos por página.
    - filtrosIniciales: con qué filtros abre la página (por defecto, sin filtros).
*/
export const useFiltroPaginado = (lista, cumple, filtrosVacios, tamanoPagina = 10, filtrosIniciales = filtrosVacios) => {
    const [filtros, setFiltros] = useState(filtrosIniciales);
    const [pagina, setPagina] = useState(1);

    const filtrados = useMemo(() => lista.filter((elemento) => cumple(elemento, filtros)), [lista, cumple, filtros]);
    const total = filtrados.length;
    const totalPaginas = Math.max(1, Math.ceil(total / tamanoPagina));

    // Si la lista se achica (por ejemplo, al tomar o borrar un elemento), se pasa a la última página que existe.
    if (pagina > totalPaginas) setPagina(totalPaginas);
    const paginaActual = Math.min(pagina, totalPaginas);

    const elementos = useMemo(
        () => filtrados.slice((paginaActual - 1) * tamanoPagina, paginaActual * tamanoPagina),
        [filtrados, paginaActual, tamanoPagina]
    );

    const cambiarFiltro = (nombre, valor) => {
        setFiltros((anteriores) => ({ ...anteriores, [nombre]: valor }));
        setPagina(1);
    };

    const limpiarFiltros = () => {
        setFiltros(filtrosVacios);
        setPagina(1);
    };

    const irAPagina = (numero) => setPagina(Math.min(Math.max(1, numero), totalPaginas));

    return {
        elementos,
        total,
        pagina: paginaActual,
        totalPaginas,
        primero: total === 0 ? 0 : (paginaActual - 1) * tamanoPagina + 1,
        ultimo: Math.min(paginaActual * tamanoPagina, total),
        irAPagina,
        paginaAnterior: () => irAPagina(paginaActual - 1),
        paginaSiguiente: () => irAPagina(paginaActual + 1),
        filtros,
        cambiarFiltro,
        limpiarFiltros,
        hayFiltrosActivos: !sonIguales(filtros, filtrosVacios),
    };
};
