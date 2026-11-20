import { useEffect, useRef, useState } from "react";

/* Ancho en px del elemento, actualizado al cambiar el tamaño (los SVG se dibujan en px reales para que el texto no se escale). */
export const useAncho = () => {
    const referencia = useRef(null);
    const [ancho, setAncho] = useState(0);

    useEffect(() => {
        const elemento = referencia.current;
        if (!elemento) return undefined;
        const observador = new ResizeObserver(([entrada]) => setAncho(Math.floor(entrada.contentRect.width)));
        observador.observe(elemento);
        return () => observador.disconnect();
    }, []);

    return [referencia, ancho];
};

/*
    Índice de la categoría (mes) señalada con el cursor o el teclado. El contenedor del gráfico
    recibe el foco: las flechas recorren los meses, Inicio/Fin saltan a los extremos y Escape lo suelta.
*/
export const useCategoriaActiva = (cantidad) => {
    const [activa, setActiva] = useState(null);

    const alPresionarTecla = (evento) => {
        const mover = { ArrowRight: 1, ArrowLeft: -1 }[evento.key];
        if (mover) {
            evento.preventDefault();
            setActiva((actual) => Math.min(cantidad - 1, Math.max(0, (actual ?? (mover > 0 ? -1 : cantidad)) + mover)));
        } else if (evento.key === "Home" || evento.key === "End") {
            evento.preventDefault();
            setActiva(evento.key === "Home" ? 0 : cantidad - 1);
        } else if (evento.key === "Escape") {
            setActiva(null);
        }
    };

    const propsContenedor = {
        tabIndex: 0,
        onKeyDown: alPresionarTecla,
        onFocus: () => setActiva((actual) => actual ?? cantidad - 1),
        onBlur: () => setActiva(null),
    };

    return [activa, setActiva, propsContenedor];
};
