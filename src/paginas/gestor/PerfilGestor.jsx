import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import FormularioDatosPersonales from "../../componentes/panel/FormularioDatosPersonales.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { formatearFecha, iniciales } from "../../utilidades/formato.js";

/* Perfil del gestor de tienda. No consulta dispositivos ni reparaciones: el gestor no tiene acceso a ellos. */
const PerfilGestor = () => {
    const { usuario } = useSesion();

    return (
        <>
            <EncabezadoPagina titulo="Mi perfil" descripcion="Tus datos de contacto dentro del equipo de TecnoHouse." />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="tarjeta text-center">
                    <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-marca/15 text-2xl font-bold text-marca">
                        {iniciales(usuario.nombre)}
                    </span>
                    <h2 className="mt-4 text-xl font-semibold break-words">{usuario.nombre}</h2>
                    <p className="text-sm break-all text-slate-400">{usuario.correo}</p>
                    <p className="mt-4 inline-flex rounded-full bg-marca/15 px-3 py-1 text-xs font-semibold text-marca">Gestor de tienda</p>
                    {usuario.creadoEn && <p className="mt-3 text-xs text-slate-500">Cuenta creada el {formatearFecha(usuario.creadoEn)}</p>}
                    <p className="mt-6 border-t border-borde pt-6 text-left text-sm leading-relaxed text-slate-400">
                        Tu rol lo asigna el equipo de administración. Si necesitas cambiar tu correo o tus permisos, solicítalo allí.
                    </p>
                </section>

                <FormularioDatosPersonales className="lg:col-span-2" />
            </div>
        </>
    );
};

export default PerfilGestor;
