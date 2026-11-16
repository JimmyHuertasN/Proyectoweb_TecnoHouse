import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { obtenerEstadoPago } from "../api/pagos.js";
import Aviso from "../componentes/Aviso.jsx";
import EncabezadoPagina from "../componentes/panel/EncabezadoPagina.jsx";
import { formatearPesos } from "../utilidades/formato.js";

const ESTADOS_PAGO = {
    PENDING: { texto: "Pendiente de confirmación", estilo: "text-amber-300" },
    APPROVED: { texto: "Aprobado", estilo: "text-emerald-300" },
    DECLINED: { texto: "Rechazado", estilo: "text-red-300" },
    VOIDED: { texto: "Anulado", estilo: "text-slate-300" },
    ERROR: { texto: "Error", estilo: "text-red-300" },
};

const ResultadoPago = () => {
    const { idPedido } = useParams();
    const [resultado, setResultado] = useState({ id: "", pago: null, error: "" });
    const [actualizando, setActualizando] = useState(false);
    const cargando = resultado.id !== idPedido || actualizando;
    const pago = resultado.id === idPedido ? resultado.pago : null;
    const error = resultado.id === idPedido ? resultado.error : "";

    const consultar = useCallback(async (actualizacionManual = false) => {
        if (actualizacionManual) setActualizando(true);
        try {
            setResultado({ id: idPedido, pago: await obtenerEstadoPago(idPedido), error: "" });
        } catch (errorApi) {
            setResultado({ id: idPedido, pago: null, error: errorApi.message || "No se pudo consultar el estado confirmado por TecnoHouse." });
        } finally {
            if (actualizacionManual) setActualizando(false);
        }
    }, [idPedido]);

    useEffect(() => {
        let vigente = true;
        obtenerEstadoPago(idPedido)
            .then((pagoRespuesta) => vigente && setResultado({ id: idPedido, pago: pagoRespuesta, error: "" }))
            .catch((errorApi) => vigente && setResultado({ id: idPedido, pago: null, error: errorApi.message || "No se pudo consultar el estado confirmado por TecnoHouse." }));
        return () => { vigente = false; };
    }, [idPedido]);
    const estado = ESTADOS_PAGO[pago?.estadoPago];

    return (
        <>
            <EncabezadoPagina titulo="Resultado del pago" descripcion={`Pedido ${idPedido}`}>
                <button type="button" onClick={() => consultar(true)} disabled={cargando} className="boton-secundario disabled:opacity-50">
                    <RefreshCw size={16} aria-hidden="true" className={cargando ? "animate-spin" : ""} /> Actualizar
                </button>
            </EncabezadoPagina>
            <Aviso texto="El resultado del widget solo informa que se cerró. El estado que mostramos se consulta en TecnoHouse." tipo="info" />
            <Aviso texto={error} tipo="error" />
            {cargando && <p role="status" className="rounded-xl border border-borde bg-tarjeta p-5 text-slate-300">Consultando el estado del pago…</p>}
            {!cargando && pago && (
                <section className="rounded-xl border border-borde bg-tarjeta p-6">
                    <h2 className={`text-xl font-semibold ${estado?.estilo ?? "text-white"}`}>{estado?.texto ?? pago.estadoPago}</h2>
                    <p className="mt-2 text-sm text-slate-300">Monto registrado: {formatearPesos(pago.montoCentavos / 100)}</p>
                    {pago.metodoPago && <p className="mt-1 text-sm text-slate-400">Método: {pago.metodoPago}</p>}
                    {pago.estadoPago === "PENDING" && <p className="mt-3 text-sm text-slate-400">Si cerraste Wompi sin pagar, puedes volver al pedido e iniciar otro intento.</p>}
                    <Link to={`/cliente/pedidos/${encodeURIComponent(idPedido)}`} className="boton-secundario mt-5">Volver al pedido</Link>
                </section>
            )}
            {!cargando && !pago && (
                <Link to={`/cliente/pedidos/${encodeURIComponent(idPedido)}`} className="boton-secundario">Volver al pedido</Link>
            )}
        </>
    );
};

export default ResultadoPago;
