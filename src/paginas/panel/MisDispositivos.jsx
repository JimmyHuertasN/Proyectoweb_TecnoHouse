import { useState } from "react";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FormularioDispositivo from "../../componentes/panel/FormularioDispositivo.jsx";
import TarjetaDispositivo from "../../componentes/panel/TarjetaDispositivo.jsx";
import { useDispositivos } from "../../hooks/useDispositivos.js";

/*
    "formulario" indica qué se está mostrando:
      null              -> no hay formulario abierto
      { modo: "nuevo" } -> registrar un dispositivo
      { modo: "editar", dispositivo } -> editar el dispositivo indicado
*/
const MisDispositivos = () => {
    const { dispositivos, cargando, error, crearDispositivo, actualizarDispositivo, eliminarDispositivo } = useDispositivos();
    const [formulario, setFormulario] = useState(null);
    const [aviso, setAviso] = useState({ texto: "", tipo: "" });

    const abrirFormulario = (estado) => {
        setAviso({ texto: "", tipo: "" });
        setFormulario(estado);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const guardar = async (datos) => {
        if (formulario.modo === "editar") {
            await actualizarDispositivo(formulario.dispositivo.id, datos);
            setAviso({ texto: "Los cambios se guardaron correctamente.", tipo: "exito" });
        } else {
            await crearDispositivo(datos);
            setAviso({ texto: "¡Dispositivo registrado!", tipo: "exito" });
        }
        setFormulario(null);
    };

    const eliminar = async (dispositivo) => {
        const confirmado = window.confirm(`¿Eliminar "${dispositivo.marca} ${dispositivo.modelo}"? Esta acción no se puede deshacer.`);
        if (!confirmado) return;

        try {
            await eliminarDispositivo(dispositivo.id);
            setAviso({ texto: "Dispositivo eliminado.", tipo: "exito" });
            if (formulario?.dispositivo?.id === dispositivo.id) setFormulario(null);
        } catch (errorApi) {
            setAviso({ texto: errorApi.message, tipo: "error" });
        }
    };

    return (
        <>
            <EncabezadoPagina titulo="Mis dispositivos" descripcion="Registra tus equipos una sola vez y úsalos en cada solicitud de servicio.">
                {!formulario && (
                    <button type="button" onClick={() => abrirFormulario({ modo: "nuevo" })} className="boton-primario">
                        + Agregar dispositivo
                    </button>
                )}
            </EncabezadoPagina>

            <Aviso texto={aviso.texto} tipo={aviso.tipo} />
            <Aviso texto={error} tipo="error" />

            {formulario && (
                <FormularioDispositivo
                    // La key reinicia el formulario al pasar de editar un equipo a otro.
                    key={formulario.dispositivo?.id ?? "nuevo"}
                    dispositivo={formulario.dispositivo}
                    alGuardar={guardar}
                    alCancelar={() => setFormulario(null)}
                />
            )}

            {cargando && <p className="text-slate-400">Cargando dispositivos...</p>}

            {!cargando && !error && dispositivos.length === 0 && !formulario && (
                <EstadoVacio
                    icono="💻"
                    titulo="Todavía no registras dispositivos"
                    descripcion="Agrega tu computador, celular o consola. Así, cuando algo falle, solicitar el servicio te tomará segundos."
                >
                    <button type="button" onClick={() => abrirFormulario({ modo: "nuevo" })} className="boton-primario">
                        Registrar mi primer dispositivo
                    </button>
                </EstadoVacio>
            )}

            {dispositivos.length > 0 && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {dispositivos.map((dispositivo) => (
                        <TarjetaDispositivo
                            key={dispositivo.id}
                            dispositivo={dispositivo}
                            alEditar={(elegido) => abrirFormulario({ modo: "editar", dispositivo: elegido })}
                            alEliminar={eliminar}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

export default MisDispositivos;
