import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import ImagenProducto from "../ImagenProducto.jsx";

// Diámetro del círculo de la lupa en píxeles.
const LENTE = 240;
// Aumento moderado para mostrar detalle sin hacer demasiado brusca la ampliación.
const AUMENTO = 2.5;

const GaleriaProducto = ({ imagenes = [], nombre }) => {
    // Guarda qué miniatura se muestra y el estado/posición actual de la lupa.
    const [seleccionada, setSeleccionada] = useState(0);
    const [lupaActiva, setLupaActiva] = useState(false);
    const [posicion, setPosicion] = useState({ x: 50, y: 50, left: 50, top: 50, ancho: 0, alto: 0 });
    // Si no hay fotos válidas, ImagenProducto presenta su estado de respaldo.
    const imagen = imagenes[seleccionada] ?? { url: "" };

    // Cambia la foto activa y oculta la lupa para que no quede sobre la imagen anterior.
    const elegirFoto = (indice) => {
        setSeleccionada((indice + imagenes.length) % imagenes.length);
        setLupaActiva(false);
    };

    // Calcula la posición del puntero y limita el círculo para que no salga de la foto.
    const moverLupa = (evento) => {
        if (evento.pointerType === "touch") return;
        const rect = evento.currentTarget.getBoundingClientRect();
        const left = Math.max(LENTE / 2, Math.min(rect.width - LENTE / 2, evento.clientX - rect.left));
        const top = Math.max(LENTE / 2, Math.min(rect.height - LENTE / 2, evento.clientY - rect.top));
        // Centra el recorte ampliado en el centro visible de la lupa, incluso junto a los bordes.
        setPosicion({
            x: (left / rect.width) * 100,
            y: (top / rect.height) * 100,
            left,
            top,
            ancho: rect.width,
            alto: rect.height,
        });
    };

    return (
        <section aria-label={`Fotos de ${nombre}`}>
            {/* La imagen principal sirve de referencia para el recorte ampliado. */}
            <div
                className="relative aspect-square touch-pan-y overflow-hidden rounded-2xl border border-borde bg-slate-900"
                onPointerEnter={(evento) => {
                    if (evento.pointerType !== "touch") setLupaActiva(true);
                }}
                onPointerMove={moverLupa}
                onPointerUp={(evento) => {
                    if (evento.pointerType === "touch") {
                        // En pantallas táctiles, toca para mostrar u ocultar la lupa centrada.
                        setLupaActiva((activa) => !activa);
                        setPosicion({
                            x: 50,
                            y: 50,
                            left: evento.currentTarget.clientWidth / 2,
                            top: evento.currentTarget.clientHeight / 2,
                            ancho: evento.currentTarget.clientWidth,
                            alto: evento.currentTarget.clientHeight,
                        });
                    }
                }}
                onPointerLeave={(evento) => {
                    // En escritorio se oculta al sacar el cursor; en móvil queda hasta el siguiente toque.
                    if (evento.pointerType !== "touch") setLupaActiva(false);
                }}
            >
                <ImagenProducto url={imagen.url} alt={`${nombre}, foto ${seleccionada + 1}`} contener className="size-full" />
                    {/* Las flechas recorren las fotos sin depender de las miniaturas inferiores. */}
                    {imagenes.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={() => elegirFoto(seleccionada - 1)}
                                aria-label="Ver foto anterior"
                                className="absolute top-1/2 left-3 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/65 text-white shadow-lg transition hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                <ChevronLeft size={24} aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                onClick={() => elegirFoto(seleccionada + 1)}
                                aria-label="Ver foto siguiente"
                                className="absolute top-1/2 right-3 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/65 text-white shadow-lg transition hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                <ChevronRight size={24} aria-hidden="true" />
                            </button>
                        </>
                    )}
                {imagen.url && lupaActiva && (
                    // El círculo recorta otra copia de la foto, renderizada a escala respecto a la imagen completa.
                    <div
                        className="pointer-events-none absolute z-10 overflow-hidden rounded-full border-2 border-white shadow-[0_2px_16px_rgba(0,0,0,0.55)]"
                        role="img"
                        aria-label={`Ampliación de ${nombre}`}
                        style={{
                            width: LENTE,
                            height: LENTE,
                            left: posicion.left,
                            top: posicion.top,
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <img
                            src={imagen.url}
                            alt=""
                            className="absolute max-w-none object-contain"
                            style={{
                                // El tamaño en píxeles hace que el aumento dependa de la foto, no del diámetro del círculo.
                                width: `${posicion.ancho * AUMENTO}px`,
                                height: `${posicion.alto * AUMENTO}px`,
                                left: `${LENTE / 2 - (posicion.x / 100) * posicion.ancho * AUMENTO}px`,
                                top: `${LENTE / 2 - (posicion.y / 100) * posicion.alto * AUMENTO}px`,
                            }}
                        />
                    </div>
                )}
                {imagen.url && (
                    // Esta indicación explica cómo activar el acercamiento con mouse o pantalla táctil.
                    <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white">
                        <Search size={14} aria-hidden="true" /> Pasa el cursor o toca para acercar
                    </span>
                )}
            </div>

            {/* Las miniaturas permiten alternar entre todas las fotos guardadas del producto. */}
            {imagenes.length > 1 && (
                <ul className="mt-3 flex flex-wrap gap-3" aria-label="Elegir foto del producto">
                    {imagenes.map((foto, indice) => (
                        <li key={`${foto.ruta ?? foto.url}-${indice}`}>
                            <button
                                type="button"
                                onClick={() => elegirFoto(indice)}
                                aria-label={`Ver foto ${indice + 1} de ${nombre}`}
                                aria-pressed={seleccionada === indice}
                                className={`overflow-hidden rounded-lg border-2 transition ${seleccionada === indice ? "border-marca" : "border-borde hover:border-slate-400"}`}
                            >
                                <ImagenProducto url={foto.url} alt="" contener className="size-16 bg-slate-900" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default GaleriaProducto;
