import { useRef, useState } from "react";
import { CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { iniciarPago } from "../../api/pagos.js";
import { cargarWidgetWompi } from "../../api/wompiWidget.js";
import Aviso from "../Aviso.jsx";

const BotonPagarWompi = ({ idPedido, alAbrirWidget, alCerrarWidget, alFallarWidget }) => {
    const navigate = useNavigate();
    const [preparando, setPreparando] = useState(false);
    const [error, setError] = useState("");
    const bloqueado = useRef(false);
    const navegando = useRef(false);

    const pagar = async () => {
        if (bloqueado.current) return;
        bloqueado.current = true;
        setPreparando(true);
        setError("");

        try {
            await cargarWidgetWompi();
            const pago = await iniciarPago(idPedido);
            if (typeof window.WidgetCheckout !== "function") {
                throw new Error("El widget de Wompi no está disponible. Recarga la página e inténtalo de nuevo.");
            }

            const configuracion = {
                currency: pago.currency,
                amountInCents: pago.amountInCents,
                reference: pago.reference,
                publicKey: pago.publicKey,
                redirectUrl: pago.redirectUrl,
                signature: { integrity: pago.integritySignature },
                customerData: {
                    fullName: pago.customerData.fullName,
                    phoneNumber: pago.customerData.phoneNumber,
                    phoneNumberPrefix: pago.customerData.phoneNumberPrefix,
                    ...(pago.customerData.email ? { email: pago.customerData.email } : {}),
                },
                shippingAddress: {
                    addressLine1: pago.shippingAddress.addressLine1,
                    city: pago.shippingAddress.city,
                    region: pago.shippingAddress.region,
                    country: pago.shippingAddress.country,
                    phoneNumber: pago.shippingAddress.phoneNumber,
                    name: pago.shippingAddress.name,
                },
            };
            if (pago.expirationTime) configuracion.expirationTime = pago.expirationTime;

            const checkout = new window.WidgetCheckout(configuracion);
            alAbrirWidget?.();
            checkout.open(() => {
                // El resultado del widget es informativo; el backend confirma el estado del pago.
                if (navegando.current) return;
                navegando.current = true;
                bloqueado.current = false;
                alCerrarWidget?.();
                navigate(`/pago/resultado/${encodeURIComponent(idPedido)}`);
            });
        } catch (errorPago) {
            bloqueado.current = false;
            setPreparando(false);
            alFallarWidget?.();
            setError(errorPago.message || "No se pudo preparar el pago con Wompi.");
        }
    };

    return (
        <div className="w-full">
            <Aviso texto={error} tipo="error" />
            <button
                type="button"
                onClick={pagar}
                disabled={preparando}
                className="boton-primario flex w-full justify-center py-3 text-base disabled:cursor-wait disabled:opacity-60"
            >
                <CreditCard size={18} aria-hidden="true" />
                {preparando ? "Preparando pago…" : "Pagar con Wompi"}
            </button>
            {preparando && <p role="status" className="mt-2 text-center text-xs text-slate-400">Estamos preparando el checkout seguro de Wompi…</p>}
        </div>
    );
};

export default BotonPagarWompi;
