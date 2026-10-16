import { useState } from "react";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import TarjetaPendiente from "../../componentes/panel/TarjetaPendiente.jsx";
import { usePendientes } from "../../hooks/usePendientes.js";

const SolicitudesPendientes = () => {
    const { pendientes, cargando, error, recargar, tomarServicio } = usePendientes();
    const [aviso, setAviso] = useState("");

    const manejarToma = async (solicitud) => {
        await tomarServicio(solicitud.id);
        setAviso(`Tomaste el servicio ${solicitud.codigo}. Lo encuentras en "Mis servicios".`);
    };

    const actualizar = () => {
        setAviso("");
        recargar();
    };

    return (
        <>
            <EncabezadoPagina titulo="Solicitudes pendientes" descripcion="Servicios que todavía no tienen técnico. Toma los que puedas atender.">
                <button type="button" onClick={actualizar} className="boton-secundario">
                    ↻ Actualizar
                </button>
            </EncabezadoPagina>

            <Aviso texto={aviso} tipo="exito" />
            <Aviso texto={error} tipo="error" />

            {cargando && <p className="text-slate-400">Cargando solicitudes...</p>}

            {!cargando && !error && pendientes.length === 0 && (
                <EstadoVacio
                    icono="✅"
                    titulo="No hay solicitudes pendientes"
                    descripcion="Cuando un cliente pida un servicio, aparecerá aquí. Usa “Actualizar” para revisar de nuevo."
                />
            )}

            {pendientes.length > 0 && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {pendientes.map((solicitud) => (
                        <TarjetaPendiente key={solicitud.id} solicitud={solicitud} alTomar={manejarToma} />
                    ))}
                </div>
            )}
        </>
    );
};

export default SolicitudesPendientes;
