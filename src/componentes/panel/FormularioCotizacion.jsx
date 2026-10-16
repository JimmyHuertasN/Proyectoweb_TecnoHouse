import { useState } from "react";
import { prepararItems } from "../../api/tecnico.js";
import { formatearPesos } from "../../utilidades/formato.js";
import Aviso from "../Aviso.jsx";
import useConfirmar from "../../hooks/useConfirmar.js";

// "clave" solo sirve para que React identifique cada fila al agregar o quitar ítems.
const itemVacio = () => ({ clave: crypto.randomUUID(), concepto: "", precio: "" });

const calcularTotal = (items) => items.reduce((suma, item) => suma + (Number(item.precio) || 0), 0);

const FilaItem = ({ item, numero, puedeQuitar, alCambiar, alQuitar }) => (
    <div className="flex items-start gap-2">
        <input
            aria-label={`Concepto del ítem ${numero}`}
            className="campo flex-1"
            placeholder="Ej. Cambio de pasta térmica"
            maxLength={80}
            value={item.concepto}
            onChange={(evento) => alCambiar(item.clave, "concepto", evento.target.value)}
        />
        <input
            aria-label={`Precio del ítem ${numero}`}
            type="number"
            min="0"
            step="1000"
            className="campo w-32 sm:w-40"
            placeholder="Precio"
            value={item.precio}
            onChange={(evento) => alCambiar(item.clave, "precio", evento.target.value)}
        />
        <button
            type="button"
            onClick={() => alQuitar(item.clave)}
            disabled={!puedeQuitar}
            className="boton-secundario px-3 disabled:opacity-40"
            aria-label={`Quitar el ítem ${numero}`}
        >
            ✕
        </button>
    </div>
);

/* "alEnviar" la recibe del padre, que llama a la API. Si falla, el error se muestra en el formulario. */
const FormularioCotizacion = ({ alEnviar }) => {
    const [items, setItems] = useState(() => [itemVacio()]);
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);
    const confirmar = useConfirmar();
    const total = calcularTotal(items);

    const cambiarItem = (clave, campo, valor) => {
        setItems((actuales) => actuales.map((item) => (item.clave === clave ? { ...item, [campo]: valor } : item)));
    };

    const quitarItem = (clave) => setItems((actuales) => actuales.filter((item) => item.clave !== clave));

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        try {
            prepararItems(items);
        } catch (errorValidacion) {
            setError(errorValidacion.message);
            return;
        }

        if (!await confirmar({ titulo: "Enviar cotización", mensaje: `¿Enviar la cotización por ${formatearPesos(total)} al cliente?` })) return;

        setError("");
        setEnviando(true);

        try {
            await alEnviar(items);
        } catch (errorApi) {
            setError(errorApi.message);
            setEnviando(false);
        }
    };

    return (
        <form onSubmit={manejarEnvio} noValidate className="tarjeta">
            <h2 className="mb-4 text-lg font-semibold">2. Crear cotización</h2>
            <Aviso texto={error} tipo="error" />

            <div className="space-y-3">
                {items.map((item, indice) => (
                    <FilaItem
                        key={item.clave}
                        item={item}
                        numero={indice + 1}
                        puedeQuitar={items.length > 1}
                        alCambiar={cambiarItem}
                        alQuitar={quitarItem}
                    />
                ))}
            </div>

            <button type="button" onClick={() => setItems((actuales) => [...actuales, itemVacio()])} className="mt-3 text-sm font-semibold text-marca hover:underline">
                + Agregar ítem
            </button>

            <p className="mt-5 flex justify-between border-t border-borde pt-4 text-lg font-bold">
                <span>Total</span>
                <span>{formatearPesos(total)}</span>
            </p>

            <div className="mt-4 flex justify-end">
                <button type="submit" disabled={enviando} className="boton-primario">
                    {enviando ? "Enviando..." : "Enviar cotización al cliente"}
                </button>
            </div>
        </form>
    );
};

export default FormularioCotizacion;
