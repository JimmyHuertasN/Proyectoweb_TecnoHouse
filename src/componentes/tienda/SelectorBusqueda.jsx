import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

const normalizar = (texto) => texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO");

const calcularPosicion = (rectangulo) => {
    const espacioAbajo = window.innerHeight - rectangulo.bottom - 12;
    const abrirArriba = espacioAbajo < 180 && rectangulo.top > espacioAbajo;
    const espacio = abrirArriba ? rectangulo.top - 12 : espacioAbajo;
    const maxHeight = Math.max(100, Math.min(224, espacio));
    return {
        top: abrirArriba ? rectangulo.top - maxHeight - 4 : rectangulo.bottom + 4,
        left: rectangulo.left,
        width: rectangulo.width,
        maxHeight,
    };
};

const SelectorBusqueda = ({
    id,
    value,
    options,
    onChange,
    placeholder = "Busca o selecciona",
    listLabel,
    invalid = false,
    describedBy,
    disabled = false,
}) => {
    const contenedor = useRef(null);
    const campo = useRef(null);
    const lista = useRef(null);
    const [abierto, setAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [indiceActivo, setIndiceActivo] = useState(0);
    const [posicion, setPosicion] = useState(null);
    const idLista = `${id}-opciones`;

    const opcionesFiltradas = useMemo(() => {
        const consulta = normalizar(busqueda.trim());
        if (!consulta) return options;
        return options.filter((opcion) => normalizar(opcion).includes(consulta));
    }, [busqueda, options]);

    useEffect(() => {
        if (!abierto) return undefined;

        const cerrarAlPulsarFuera = (evento) => {
            if (!contenedor.current?.contains(evento.target) && !lista.current?.contains(evento.target)) {
                setAbierto(false);
                setBusqueda("");
            }
        };
        document.addEventListener("pointerdown", cerrarAlPulsarFuera);
        return () => document.removeEventListener("pointerdown", cerrarAlPulsarFuera);
    }, [abierto]);

    // El menú en portal evita que el panel desplazable recorte o cierre el desplegable.
    useEffect(() => {
        if (!abierto) return undefined;

        const moverMenu = () => {
            const rectangulo = campo.current?.getBoundingClientRect();
            if (rectangulo && lista.current) Object.assign(lista.current.style, calcularPosicion(rectangulo));
        };
        window.addEventListener("resize", moverMenu);
        window.addEventListener("scroll", moverMenu, true);
        return () => {
            window.removeEventListener("resize", moverMenu);
            window.removeEventListener("scroll", moverMenu, true);
        };
    }, [abierto]);

    const abrir = (elemento) => {
        setBusqueda("");
        setIndiceActivo(0);
        setPosicion(calcularPosicion(elemento.getBoundingClientRect()));
        setAbierto(true);
    };

    const elegir = (opcion) => {
        onChange(opcion);
        setBusqueda("");
        setAbierto(false);
    };

    const manejarTecla = (evento) => {
        if (evento.key === "ArrowDown") {
            evento.preventDefault();
            if (!abierto) abrir(evento.currentTarget);
            else if (opcionesFiltradas.length > 0) setIndiceActivo((actual) => (actual + 1) % opcionesFiltradas.length);
        } else if (evento.key === "ArrowUp" && abierto && opcionesFiltradas.length > 0) {
            evento.preventDefault();
            setIndiceActivo((actual) => (actual - 1 + opcionesFiltradas.length) % opcionesFiltradas.length);
        } else if (evento.key === "Enter" && abierto && opcionesFiltradas.length > 0) {
            evento.preventDefault();
            elegir(opcionesFiltradas[indiceActivo] ?? opcionesFiltradas[0]);
        } else if (evento.key === "Escape" && abierto) {
            evento.preventDefault();
            setAbierto(false);
            setBusqueda("");
        }
    };

    return (
        <div ref={contenedor} className="relative z-20 mt-1">
            <div className="relative">
                <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                <input
                    ref={campo}
                    id={id}
                    type="text"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={abierto}
                    aria-controls={idLista}
                    aria-activedescendant={abierto && opcionesFiltradas.length > 0 ? `${id}-opcion-${indiceActivo}` : undefined}
                    aria-invalid={invalid}
                    aria-describedby={describedBy}
                    autoComplete="off"
                    disabled={disabled}
                    placeholder={placeholder}
                    value={abierto ? busqueda : value}
                    onFocus={(evento) => { if (!abierto && !disabled) abrir(evento.currentTarget); }}
                    onClick={(evento) => { if (!abierto && !disabled) abrir(evento.currentTarget); }}
                    onChange={(evento) => {
                        setBusqueda(evento.target.value);
                        setIndiceActivo(0);
                        if (!abierto) setPosicion(calcularPosicion(evento.currentTarget.getBoundingClientRect()));
                        setAbierto(true);
                    }}
                    onKeyDown={manejarTecla}
                    className={`campo w-full pr-10 pl-9 ${invalid ? "border-red-400" : ""}`}
                />
                <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            </div>

            {abierto && posicion && createPortal(
                <div ref={lista} style={posicion} className="fixed z-[120] overflow-y-auto rounded-lg border border-slate-600 bg-slate-900 py-1 shadow-xl">
                    {opcionesFiltradas.length > 0 ? (
                        <ul id={idLista} role="listbox" aria-label={listLabel}>
                            {opcionesFiltradas.map((opcion, indice) => (
                                <li
                                    id={`${id}-opcion-${indice}`}
                                    key={opcion}
                                    role="option"
                                    aria-selected={opcion === value}
                                    onMouseDown={(evento) => evento.preventDefault()}
                                    onClick={() => elegir(opcion)}
                                    className={`cursor-pointer px-3 py-2.5 text-sm ${indice === indiceActivo ? "bg-sky-500/20 text-white" : "text-slate-200 hover:bg-white/5"}`}
                                >
                                    {opcion}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p role="status" className="px-3 py-3 text-sm text-slate-400">No hay opciones que coincidan.</p>
                    )}
                </div>,
                document.body,
            )}
        </div>
    );
};

export default SelectorBusqueda;
