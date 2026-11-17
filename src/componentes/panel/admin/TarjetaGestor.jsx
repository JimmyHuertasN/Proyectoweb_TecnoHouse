import { useState } from "react";
import { formatearFecha, iniciales } from "../../../utilidades/formato.js";
import { validarNombreYTelefono } from "../../../utilidades/validaciones.js";
import useConfirmar from "../../../hooks/useConfirmar.js";
import Aviso from "../../Aviso.jsx";

/*
    Un gestor de tienda en la lista del administrador: editar su nombre y teléfono o retirarle el acceso.
    "alGuardar" y "alRetirar" los recibe del padre, que llama a la base; si fallan, el error se muestra aquí.
*/
const TarjetaGestor = ({ gestor, alGuardar, alRetirar }) => {
    const confirmar = useConfirmar();
    const [editando, setEditando] = useState(false);
    const [valores, setValores] = useState({ nombre: gestor.nombre, telefono: gestor.telefono });
    const [error, setError] = useState("");
    const [ocupado, setOcupado] = useState(false);

    const manejarCambio = (evento) => {
        const { name, value } = evento.target;
        setValores((anteriores) => ({ ...anteriores, [name]: value }));
    };

    const ejecutar = async (accion) => {
        setError("");
        setOcupado(true);
        try {
            await accion();
            setEditando(false);
        } catch (errorApi) {
            setError(errorApi.message);
        } finally {
            setOcupado(false);
        }
    };

    const guardar = (evento) => {
        evento.preventDefault();
        const datos = { nombre: valores.nombre.trim(), telefono: valores.telefono.trim() };
        const errorValidacion = validarNombreYTelefono(datos);
        if (errorValidacion) {
            setError(errorValidacion);
            return;
        }
        ejecutar(() => alGuardar(gestor, datos));
    };

    const retirar = async () => {
        const aceptado = await confirmar({
            titulo: "Retirar acceso de gestor",
            mensaje: `${gestor.nombre} volverá a ser cliente: deja de ver el panel de la tienda y, aunque tenga la sesión abierta, su siguiente operación en la tienda será rechazada. Su cuenta no se borra.`,
        });
        if (aceptado) ejecutar(() => alRetirar(gestor));
    };

    return (
        <article className="tarjeta flex flex-col">
            <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-marca/15 font-bold text-marca" aria-hidden="true">
                    {iniciales(gestor.nombre)}
                </span>
                <div className="min-w-0">
                    <h3 className="font-semibold break-words">{gestor.nombre}</h3>
                    <p className="text-sm break-all text-slate-400">{gestor.correo}</p>
                </div>
            </div>

            <Aviso texto={error} tipo="error" />

            {editando ? (
                <form onSubmit={guardar} noValidate className="mt-4 space-y-4">
                    <div>
                        <label htmlFor={`gestor-nombre-${gestor.id}`} className="etiqueta">Nombre completo</label>
                        <input id={`gestor-nombre-${gestor.id}`} name="nombre" className="campo" maxLength={80} value={valores.nombre} onChange={manejarCambio} />
                    </div>
                    <div>
                        <label htmlFor={`gestor-telefono-${gestor.id}`} className="etiqueta">Teléfono</label>
                        <input id={`gestor-telefono-${gestor.id}`} name="telefono" type="tel" className="campo" maxLength={20} value={valores.telefono} onChange={manejarCambio} />
                    </div>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button type="button" onClick={() => setEditando(false)} className="boton-secundario">Cancelar</button>
                        <button type="submit" disabled={ocupado} className="boton-primario">{ocupado ? "Guardando..." : "Guardar"}</button>
                    </div>
                </form>
            ) : (
                <>
                    <dl className="mt-4 flex-1 space-y-1 text-sm">
                        <div className="flex gap-2">
                            <dt className="text-slate-400">Teléfono:</dt>
                            <dd>{gestor.telefono || "No registrado"}</dd>
                        </div>
                        <div className="flex gap-2">
                            <dt className="text-slate-400">Cuenta desde:</dt>
                            <dd>{formatearFecha(gestor.creadoEn)}</dd>
                        </div>
                    </dl>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <button type="button" disabled={ocupado} onClick={() => setEditando(true)} className="boton-secundario px-3">Editar</button>
                        <button type="button" disabled={ocupado} onClick={retirar} className="boton-peligro px-3">
                            {ocupado ? "Retirando..." : "Retirar acceso"}
                        </button>
                    </div>
                </>
            )}
        </article>
    );
};

export default TarjetaGestor;
