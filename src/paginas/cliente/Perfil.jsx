import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import FormularioDatosPersonales from "../../componentes/panel/FormularioDatosPersonales.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { useDispositivos } from "../../hooks/useDispositivos.js";
import { useSolicitudes } from "../../hooks/useSolicitudes.js";
import { formatearFecha, iniciales } from "../../utilidades/formato.js";

const Perfil = () => {
    const { usuario } = useSesion();
    const { dispositivos } = useDispositivos();
    const { solicitudes } = useSolicitudes();

    return (
        <>
            <EncabezadoPagina titulo="Mi perfil" descripcion="Revisa y actualiza tu información de contacto." />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* TARJETA DE PRESENTACIÓN */}
                <section className="tarjeta text-center">
                    <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-marca/15 text-2xl font-bold text-marca">
                        {iniciales(usuario.nombre)}
                    </span>
                    <h2 className="mt-4 text-xl font-semibold">{usuario.nombre}</h2>
                    <p className="text-sm text-slate-400">{usuario.correo}</p>
                    {usuario.creadoEn && <p className="mt-1 text-xs text-slate-500">Cliente desde {formatearFecha(usuario.creadoEn)}</p>}

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

                <FormularioDatosPersonales className="lg:col-span-2" />
            </div>
        </>
    );
};

export default Perfil;
