import { Link } from "react-router-dom";
import { buscarOpcion, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { formatearFecha } from "../../utilidades/formato.js";

const TarjetaDispositivo = ({ dispositivo, alEditar, alEliminar }) => {
    const tipo = buscarOpcion(TIPOS_DISPOSITIVO, dispositivo.tipo);
    const Icono = tipo.icono;

    return (
        <article className="tarjeta flex flex-col transition hover:border-marca/60">
            <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-marca/10 text-2xl" aria-hidden="true">
                    <Icono size={23} strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wider text-marca uppercase">{tipo.etiqueta}</p>
                    <h3 className="truncate text-lg font-semibold">
                        {dispositivo.marca} {dispositivo.modelo}
                    </h3>
                </div>
            </div>

            <dl className="mt-4 flex-1 space-y-1 text-sm">
                <div className="flex gap-2">
                    <dt className="text-slate-400">N.º de serie:</dt>
                    <dd className="truncate">{dispositivo.numeroSerie || "No registrado"}</dd>
                </div>
                <div className="flex gap-2">
                    <dt className="text-slate-400">Registrado:</dt>
                    <dd>{formatearFecha(dispositivo.creadoEn)}</dd>
                </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-borde pt-4">
                <Link to={`/cliente/solicitudes/nueva?dispositivo=${dispositivo.id}`} className="boton-primario flex-1 px-3 py-2">
                    Solicitar reparación
                </Link>
                <button type="button" onClick={() => alEditar(dispositivo)} className="boton-secundario px-3 py-2">
                    Editar
                </button>
                <button type="button" onClick={() => alEliminar(dispositivo)} className="boton-peligro px-3 py-2">
                    Eliminar
                </button>
            </div>
        </article>
    );
};

export default TarjetaDispositivo;
