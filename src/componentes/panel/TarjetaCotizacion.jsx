import { useState } from "react";
import { formatearFecha, formatearPesos } from "../../utilidades/formato.js";
import Aviso from "../Aviso.jsx";
import { EtiquetaCotizacion } from "./Etiquetas.jsx";
import useConfirmar from "../../hooks/useConfirmar.js";

const preguntaConfirmacion = (aprobar, total) =>
    aprobar
        ? `¿Aprobar la cotización por ${formatearPesos(total)}? El técnico empezará la reparación.`
        : "¿Rechazar la cotización? El técnico no hará la reparación.";

const TablaItems = ({ items }) => {
    if (items.length === 0) {
        return <p className="text-sm text-slate-400">El técnico no detalló los ítems de esta cotización.</p>;
    }

    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-borde text-left text-slate-400">
                    <th className="pb-2 font-medium">Concepto</th>
                    <th className="pb-2 text-right font-medium">Precio</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item) => (
                    <tr key={item.id} className="border-b border-borde/60">
                        <td className="py-2 pr-4">{item.concepto}</td>
                        <td className="py-2 text-right whitespace-nowrap">{formatearPesos(item.precio)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

/*
    "alResponder" la recibe del padre, que llama a la API. Si falla, el error se muestra en la tarjeta.
    Sin "alResponder" (panel del técnico) la cotización solo se muestra.
*/
const TarjetaCotizacion = ({ cotizacion, alResponder }) => {
    const [error, setError] = useState("");
    const [respondiendo, setRespondiendo] = useState(false);
    const pendiente = cotizacion.estado === "pendiente" && Boolean(alResponder);
    const confirmar = useConfirmar();

    const responder = async (aprobar) => {
        if (!await confirmar({ titulo: aprobar ? "Aprobar cotización" : "Rechazar cotización", mensaje: preguntaConfirmacion(aprobar, cotizacion.total) })) return;

        setError("");
        setRespondiendo(true);

        try {
            await alResponder(cotizacion, aprobar);
        } catch (errorApi) {
            setError(errorApi.message);
        } finally {
            setRespondiendo(false);
        }
    };

    return (
        <section className={`tarjeta mb-6 ${pendiente ? "border-orange-500/50" : ""}`}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Cotización</h2>
                    <p className="text-sm text-slate-400">Enviada el {formatearFecha(cotizacion.creadaEn)}</p>
                </div>
                <EtiquetaCotizacion estado={cotizacion.estado} />
            </div>

            <Aviso texto={error} tipo="error" />
            <TablaItems items={cotizacion.items} />

            <p className="mt-4 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatearPesos(cotizacion.total)}</span>
            </p>

            {pendiente && (
                <div className="mt-6 flex flex-col gap-3 border-t border-borde pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-300">Revisa el detalle y dinos si quieres hacer la reparación.</p>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <button type="button" onClick={() => responder(false)} disabled={respondiendo} className="boton-peligro">
                            Rechazar
                        </button>
                        <button type="button" onClick={() => responder(true)} disabled={respondiendo} className="boton-primario">
                            {respondiendo ? "Enviando..." : "Aprobar cotización"}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default TarjetaCotizacion;
