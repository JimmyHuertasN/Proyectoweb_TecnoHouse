import { useEffect } from "react";

/*
    Muestra con una transición los elementos marcados con data-animacion-entrada
    cuando entran en pantalla. "contenido" es un valor que cambia cuando la página
    recibe datos nuevos (por ejemplo, la cantidad de técnicos), para volver a buscarlos.
*/
const useAnimacionEntrada = (contenido) => {
    useEffect(() => {
        const elementos = document.querySelectorAll("[data-animacion-entrada]:not(.entrada-visible)");

        // Sin soporte del navegador, el contenido se muestra de inmediato.
        if (!("IntersectionObserver" in window)) {
            elementos.forEach((elemento) => elemento.classList.add("entrada-visible"));
            return undefined;
        }

        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                entrada.target.classList.add("entrada-visible");
                observador.unobserve(entrada.target);
            });
        // Se activa cuando la sección ya subió un 10 % dentro de la pantalla, para que la entrada se vea.
        }, { threshold: 0, rootMargin: "0px 0px -10% 0px" });

        elementos.forEach((elemento) => observador.observe(elemento));
        return () => observador.disconnect();
    }, [contenido]);
};

export default useAnimacionEntrada;
