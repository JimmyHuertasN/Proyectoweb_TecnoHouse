import { useState } from "react";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useDispositivos } from "../../hooks/useDispositivos.js";
import { useSolicitudes } from "../../hooks/useSolicitudes.js";
import { formatearFecha, iniciales } from "../../utilidades/formato.js";
import { validarDatosPersonales } from "../../utilidades/validaciones.js";

/* El correo es la cuenta de Supabase: cambiarlo exige confirmación por email, por eso no se edita aquí. */
const CAMPOS = [
    { nombre: "nombre", etiqueta: "Nombre completo", tipo: "text", autoComplete: "name", editable: true },
    { nombre: "correo", etiqueta: "Correo electrónico", tipo: "email", autoComplete: "email", editable: false },
    { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel", autoComplete: "tel", editable: true },
];

const Perfil = () => {
    const { perfil, actualizarPerfil } = useAuth();
    const { dispositivos } = useDispositivos();
    const { solicitudes } = useSolicitudes();

    const [editando, setEditando] = useState(false);
    const [valores, setValores] = useState({ nombre: perfil.nombre, telefono: perfil.telefono });
    const [aviso, setAviso] = useState({ texto: "", tipo: "" });
    const [guardando, setGuardando] = useState(false);

    const manejarCambio = (evento) => {
        const { name, value } = evento.target;
        setValores((anteriores) => ({ ...anteriores, [name]: value }));
    };

    const empezarEdicion = () => {
        setAviso({ texto: "", tipo: "" });
        setEditando(true);
    };

    const cancelarEdicion = () => {
        setValores({ nombre: perfil.nombre, telefono: perfil.telefono });
        setAviso({ texto: "", tipo: "" });
        setEditando(false);
    };

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        const datos = {
            nombre: valores.nombre.trim(),
            telefono: valores.telefono.trim(),
        };

        const errorValidacion = validarDatosPersonales({ ...datos, correo: perfil.correo });
        if (errorValidacion) {
            setAviso({ texto: errorValidacion, tipo: "error" });
            return;
        }

        setGuardando(true);
        try {
            await actualizarPerfil(datos);
            setAviso({ texto: "Tus datos se actualizaron correctamente.", tipo: "exito" });
            setEditando(false);
        } catch (errorApi) {
            setAviso({ texto: errorApi.message, tipo: "error" });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <>
            <EncabezadoPagina titulo="Mi perfil" descripcion="Revisa y actualiza tu información de contacto." />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* TARJETA DE PRESENTACIÓN */}
                <section className="tarjeta text-center">
                    <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-marca/15 text-2xl font-bold text-marca">
                        {iniciales(perfil.nombre)}
                    </span>
                    <h2 className="mt-4 text-xl font-semibold">{perfil.nombre}</h2>
                    <p className="text-sm text-slate-400">{perfil.correo}</p>
                    {perfil.creadoEn && <p className="mt-1 text-xs text-slate-500">Cliente desde {formatearFecha(perfil.creadoEn)}</p>}

                    <div className="mt-6 grid grid-cols-2 gap-3 border-t border-borde pt-6">
                        <p>
                            <span className="block text-2xl font-bold">{dispositivos.length}</span>
                            <span className="text-xs text-slate-400">Dispositivos</span>
                        </p>
                        <p>
                            <span className="block text-2xl font-bold">{solicitudes.length}</span>
                            <span className="text-xs text-slate-400">Solicitudes</span>
                        </p>
                    </div>
                </section>

                {/* DATOS PERSONALES */}
                <form onSubmit={manejarEnvio} noValidate className="tarjeta lg:col-span-2">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Información personal</h2>
                        {!editando && (
                            <button type="button" onClick={empezarEdicion} className="boton-secundario px-3 py-2">
                                Editar
                            </button>
                        )}
                    </div>

                    <Aviso texto={aviso.texto} tipo={aviso.tipo} />

                    <div className="grid gap-5 sm:grid-cols-2">
                        {CAMPOS.map((campo) => (
                            <div key={campo.nombre} className={campo.nombre === "nombre" ? "sm:col-span-2" : ""}>
                                {editando && campo.editable ? (
                                    <>
                                        <label htmlFor={`perfil-${campo.nombre}`} className="etiqueta">{campo.etiqueta}</label>
                                        <input
                                            id={`perfil-${campo.nombre}`}
                                            name={campo.nombre}
                                            type={campo.tipo}
                                            autoComplete={campo.autoComplete}
                                            className="campo"
                                            value={valores[campo.nombre]}
                                            onChange={manejarCambio}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <p className="etiqueta">{campo.etiqueta}</p>
                                        <p className="border border-transparent py-2.5">
                                            {perfil[campo.nombre] || <span className="text-slate-500">Sin registrar</span>}
                                        </p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {editando && (
                        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-borde pt-6 sm:flex-row sm:justify-end">
                            <button type="button" onClick={cancelarEdicion} className="boton-secundario">Cancelar</button>
                            <button type="submit" disabled={guardando} className="boton-primario">
                                {guardando ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
};

export default Perfil;
