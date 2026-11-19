import { Link } from "react-router-dom";
import { useRef } from "react";

/* Marca compacta para encabezados; la inclinación sigue al cursor solo al pasar sobre el icono. */
const Logotipo = ({ destino = "/", className = "text-xl" }) => {
    const icono = useRef(null);

    const seguirCursor = (evento) => {
        const elemento = icono.current;
        if (!elemento || evento.pointerType === "touch") return;
        const limites = elemento.getBoundingClientRect();
        const x = (evento.clientX - limites.left) / limites.width;
        const y = (evento.clientY - limites.top) / limites.height;
        elemento.style.setProperty("--logo-x", `${x * 100}%`);
        elemento.style.setProperty("--logo-y", `${y * 100}%`);
        elemento.style.setProperty("--logo-rotate-x", `${(0.5 - y) * 10}deg`);
        elemento.style.setProperty("--logo-rotate-y", `${(x - 0.5) * 10}deg`);
    };

    const reiniciarCursor = () => {
        if (!icono.current) return;
        for (const propiedad of ["--logo-x", "--logo-y", "--logo-rotate-x", "--logo-rotate-y"]) {
            icono.current.style.removeProperty(propiedad);
        }
    };

    return (
        <Link
            to={destino}
            className={`logo-enlace group inline-flex shrink-0 items-center gap-2.5 font-extrabold leading-none tracking-tight text-white ${className}`}
            aria-label="TecnoHouse, ir al inicio"
        >
            <span ref={icono} onPointerMove={seguirCursor} onPointerLeave={reiniciarCursor} className="logo-marca" aria-hidden="true">
                <img src="/tecnohouse-marca.svg" alt="" className="size-[72%] object-contain" />
                <span className="logo-reflejo" />
            </span>
            <span>Tecno<span className="text-marca">House</span></span>
        </Link>
    );
};

export default Logotipo;
