import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const SELECTOR_ENFOCABLE = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

const ModalConfirmacion = ({ abierto, titulo, mensaje, alConfirmar, alCancelar }) => {
    const dialogo = useRef(null);
    const botonCancelar = useRef(null);

    useEffect(() => {
        if (!abierto) return undefined;
        const focoAnterior = document.activeElement;
        const temporizador = window.setTimeout(() => botonCancelar.current?.focus(), 0);

        const manejarTecla = (evento) => {
            if (evento.key === "Escape") {
                evento.preventDefault();
                alCancelar();
                return;
            }
            if (evento.key !== "Tab") return;
            const enfocables = [...(dialogo.current?.querySelectorAll(SELECTOR_ENFOCABLE) ?? [])];
            if (enfocables.length === 0) {
                evento.preventDefault();
                dialogo.current?.focus();
                return;
            }
            const primero = enfocables[0];
            const ultimo = enfocables[enfocables.length - 1];
            if (evento.shiftKey && (document.activeElement === primero || !dialogo.current?.contains(document.activeElement))) {
                evento.preventDefault();
                ultimo.focus();
            } else if (!evento.shiftKey && (document.activeElement === ultimo || !dialogo.current?.contains(document.activeElement))) {
                evento.preventDefault();
                primero.focus();
            }
        };

        document.addEventListener("keydown", manejarTecla);
        return () => {
            window.clearTimeout(temporizador);
            document.removeEventListener("keydown", manejarTecla);
            if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) focoAnterior.focus();
        };
    }, [abierto, alCancelar]);

    if (!abierto) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4" onMouseDown={(evento) => evento.target === evento.currentTarget && alCancelar()}>
            <section
                ref={dialogo}
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-confirmacion"
                aria-describedby="mensaje-confirmacion"
                tabIndex={-1}
                className="w-full max-w-md rounded-2xl border border-borde bg-tarjeta p-6 shadow-2xl shadow-black/50 outline-none"
            >
                <h2 id="titulo-confirmacion" className="text-xl font-bold">{titulo}</h2>
                <p id="mensaje-confirmacion" className="mt-3 leading-relaxed text-slate-300">{mensaje}</p>
                <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                    <button ref={botonCancelar} type="button" onClick={alCancelar} className="boton-secundario">Cancelar</button>
                    <button type="button" onClick={alConfirmar} className="boton-primario">Confirmar</button>
                </div>
            </section>
        </div>,
        document.body,
    );
};

export default ModalConfirmacion;
