import { useState } from "react";
import { validarNombreYTelefono } from "../../utilidades/validaciones.js";
import Aviso from "../Aviso.jsx";

/* "alGuardar" la recibe del padre, que llama a la API. Si falla, el error se muestra en el formulario. */
const FormularioDatosCliente = ({ cliente, alGuardar }) => {
    const [valores, setValores] = useState({ nombre: cliente.nombre, telefono: cliente.telefono });
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);
    const sinCambios = valores.nombre === cliente.nombre && valores.telefono === cliente.telefono;

    const manejarCambio = (evento) => {
        const { name, value } = evento.target;
        setValores((anteriores) => ({ ...anteriores, [name]: value }));
    };

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        const datos = { nombre: valores.nombre.trim(), telefono: valores.telefono.trim() };
        const errorValidacion = validarNombreYTelefono(datos);
        if (errorValidacion) {
            setError(errorValidacion);
            return;
        }

        setError("");
        setGuardando(true);

        try {
            await alGuardar(datos);
        } catch (errorApi) {
            setError(errorApi.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <form onSubmit={manejarEnvio} noValidate className="space-y-4">
            <Aviso texto={error} tipo="error" />

            <div>
                <label htmlFor="cliente-nombre" className="etiqueta">Nombre</label>
                <input id="cliente-nombre" name="nombre" className="campo" maxLength={80} value={valores.nombre} onChange={manejarCambio} />
            </div>
            <div>
                <label htmlFor="cliente-telefono" className="etiqueta">Teléfono</label>
                <input id="cliente-telefono" name="telefono" type="tel" className="campo" maxLength={20} value={valores.telefono} onChange={manejarCambio} />
            </div>

            <button type="submit" disabled={guardando || sinCambios} className="boton-primario w-full disabled:opacity-50">
                {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
        </form>
    );
};

export default FormularioDatosCliente;
