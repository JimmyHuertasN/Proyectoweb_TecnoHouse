import { useSyncExternalStore } from "react";

/*
    Tema del sitio: "oscuro" (por defecto) o "claro". Se guarda en el navegador y se aplica
    con data-tema en <html>. El script de index.html lo aplica antes de pintar la página.
*/
const CLAVE = "tecnohouse-tema";
const COLOR_BARRA = { oscuro: "#06080d", claro: "#f4f6fa" };
const oyentes = new Set();

const temaActual = () => (document.documentElement.dataset.tema === "claro" ? "claro" : "oscuro");

const suscribir = (oyente) => {
    oyentes.add(oyente);
    return () => oyentes.delete(oyente);
};

const aplicarTema = (tema) => {
    document.documentElement.dataset.tema = tema;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLOR_BARRA[tema]);
    try {
        localStorage.setItem(CLAVE, tema);
    } catch {
        // Sin almacenamiento (modo privado) el tema dura solo mientras la página esté abierta.
    }
    oyentes.forEach((oyente) => oyente());
};

const useTema = () => {
    const tema = useSyncExternalStore(suscribir, temaActual);
    return { tema, alternarTema: () => aplicarTema(tema === "claro" ? "oscuro" : "claro") };
};

export default useTema;
