import { useEffect, useState } from "react";

const SECCIONES = [
    { id: "servicios", texto: "Servicios" },
    { id: "como-funciona", texto: "Cómo funciona" },
    { id: "tecnicos", texto: "Técnicos" },
    { id: "resenas", texto: "Reseñas" },
    { id: "preguntas-frecuentes", texto: "Preguntas" },
    { id: "ubicacion", texto: "Ubicación" },
    { id: "contacto", texto: "Contacto" },
];

/*
    Barra con las secciones de la página de reparaciones. Queda fija debajo del encabezado
    y resalta la sección que se está viendo. En celulares se desliza hacia los lados.
*/
const NavegacionSecciones = () => {
    const [seccionActiva, setSeccionActiva] = useState("");

    useEffect(() => {
        const secciones = SECCIONES.map(({ id }) => document.getElementById(id)).filter(Boolean);
        if (secciones.length === 0) return undefined;

        // Se considera "visible" la sección que cruza la franja superior de la pantalla.
        const observador = new IntersectionObserver((entradas) => {
            const visible = entradas.find((entrada) => entrada.isIntersecting);
            if (visible) setSeccionActiva(visible.target.id);
        }, { rootMargin: "-25% 0px -65% 0px" });

        secciones.forEach((seccion) => observador.observe(seccion));
        return () => observador.disconnect();
    }, []);

    return (
        <nav aria-label="Secciones de reparaciones" className="sticky top-16 z-40 border-b border-white/10 bg-fondo/90 backdrop-blur">
            <ul className="contenedor flex gap-1 overflow-x-auto py-1.5 [scrollbar-width:none]">
                {SECCIONES.map(({ id, texto }) => {
                    const activa = seccionActiva === id;
                    return (
                        <li key={id} className="shrink-0">
                            <a
                                href={`#${id}`}
                                aria-current={activa ? "location" : undefined}
                                className={`flex min-h-11 items-center rounded-full px-3.5 text-sm transition ${activa ? "bg-white/10 font-semibold text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                {texto}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default NavegacionSecciones;
