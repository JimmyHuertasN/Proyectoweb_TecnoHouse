import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CLASE_BOTON =
    "inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca";
const CLASE_NORMAL =
    "cursor-pointer border-borde text-slate-300 hover:border-marca hover:text-marca disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-borde disabled:hover:text-slate-300";
const CLASE_ACTUAL = "border-marca bg-marca text-white";

/* Con muchas páginas: la primera, la última y las vecinas de la actual; el resto se resume con "…". */
const rangoPaginas = (actual, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, indice) => indice + 1);

    const visibles = new Set([1, total, actual - 1, actual, actual + 1]);
    if (actual <= 3) [2, 3, 4].forEach((numero) => visibles.add(numero));
    if (actual >= total - 2) [total - 3, total - 2, total - 1].forEach((numero) => visibles.add(numero));

    const numeros = [...visibles].filter((numero) => numero >= 1 && numero <= total).sort((a, b) => a - b);
    return numeros.flatMap((numero, indice) => {
        const anterior = numeros[indice - 1];
        if (anterior === undefined || numero - anterior === 1) return [numero];
        // Si solo falta un número, se muestra ese número en vez de "…".
        return numero - anterior === 2 ? [anterior + 1, numero] : [`puntos-${numero}`, numero];
    });
};

/* No se muestra si todo cabe en una página. */
const Paginacion = ({ pagina, totalPaginas, alCambiar }) => {
    const navegacion = useRef(null);
    // Al llegar al extremo, el botón pulsado queda deshabilitado y perdería el foco: se pasa a la página actual.
    const enfocarActual = useRef(false);

    useEffect(() => {
        if (!enfocarActual.current) return;
        enfocarActual.current = false;
        // En celular los números están ocultos: entonces el foco va al botón que sigue habilitado.
        const actual = navegacion.current?.querySelector('[aria-current="page"]');
        const destino = actual?.offsetParent ? actual : navegacion.current?.querySelector("button:not(:disabled)");
        destino?.focus();
    }, [pagina]);

    if (totalPaginas <= 1) return null;

    const moverA = (numero) => {
        enfocarActual.current = numero === 1 || numero === totalPaginas;
        alCambiar(numero);
    };

    return (
        <nav ref={navegacion} aria-label="Paginación" className="mt-6 flex items-center justify-center gap-2">
            <button
                type="button"
                onClick={() => moverA(pagina - 1)}
                disabled={pagina === 1}
                aria-label="Página anterior"
                className={`${CLASE_BOTON} ${CLASE_NORMAL}`}
            >
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Anterior</span>
            </button>

            <p className="px-2 text-sm text-slate-400 sm:hidden">
                Página {pagina} de {totalPaginas}
            </p>

            <ul className="hidden items-center gap-1.5 sm:flex">
                {rangoPaginas(pagina, totalPaginas).map((elemento) =>
                    typeof elemento === "string" ? (
                        <li key={elemento} aria-hidden="true" className="px-1 text-slate-500">
                            …
                        </li>
                    ) : (
                        <li key={elemento}>
                            <button
                                type="button"
                                onClick={() => moverA(elemento)}
                                aria-label={`Página ${elemento}`}
                                aria-current={elemento === pagina ? "page" : undefined}
                                className={`${CLASE_BOTON} ${elemento === pagina ? CLASE_ACTUAL : CLASE_NORMAL}`}
                            >
                                {elemento}
                            </button>
                        </li>
                    )
                )}
            </ul>

            <button
                type="button"
                onClick={() => moverA(pagina + 1)}
                disabled={pagina === totalPaginas}
                aria-label="Página siguiente"
                className={`${CLASE_BOTON} ${CLASE_NORMAL}`}
            >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="size-4" aria-hidden="true" />
            </button>
        </nav>
    );
};

export default Paginacion;
