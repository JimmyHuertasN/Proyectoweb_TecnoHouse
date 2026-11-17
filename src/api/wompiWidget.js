const URL_WIDGET_WOMPI = "https://checkout.wompi.co/widget.js";
let promesaDeCarga;

/* Descarga una sola copia del SDK y resuelve únicamente si exportó WidgetCheckout. */
export const cargarWidgetWompi = () => {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("El checkout de Wompi solo puede abrirse desde el navegador."));
    }
    if (typeof window.WidgetCheckout === "function") return Promise.resolve();
    if (promesaDeCarga) return promesaDeCarga;

    const existente = document.querySelector(`script[src="${URL_WIDGET_WOMPI}"]`);
    const script = existente ?? document.createElement("script");
    script.async = true;
    script.src = URL_WIDGET_WOMPI;

    promesaDeCarga = new Promise((resolve, reject) => {
        const limpiar = () => {
            script.removeEventListener("load", alCargar);
            script.removeEventListener("error", alFallar);
        };
        const alCargar = () => {
            limpiar();
            if (typeof window.WidgetCheckout === "function") resolve();
            else reject(new Error("Wompi cargó, pero no se encontró WidgetCheckout."));
        };
        const alFallar = () => {
            limpiar();
            reject(new Error("No se pudo cargar el widget de Wompi. Revisa tu conexión o desactiva temporalmente el bloqueador de anuncios."));
        };

        script.addEventListener("load", alCargar, { once: true });
        script.addEventListener("error", alFallar, { once: true });
        if (!existente) document.head.appendChild(script);
    }).catch((error) => {
        if (script.dataset.wompiCargado !== "true") script.remove();
        promesaDeCarga = undefined;
        throw error;
    });

    script.addEventListener("load", () => { script.dataset.wompiCargado = "true"; }, { once: true });
    return promesaDeCarga;
};
