import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { rutaSolicitarReparacion } from "../../utilidades/rutas.js";

/* Toda la tarjeta es un enlace para solicitar ese servicio. */
const TarjetaServicio = ({ icono: Icono, titulo, descripcion }) => {
    const { usuario } = useSesion();

    return (
        <li>
            <Link to={rutaSolicitarReparacion(usuario)} className="tarjeta-elevable group flex h-full flex-col p-6" aria-label={`Solicitar servicio de ${titulo}`}>
                <Icono size={26} strokeWidth={1.7} className="text-marca" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-semibold text-white">{titulo}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{descripcion}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 group-hover:text-white">
                    Solicitar <ArrowRight size={15} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
            </Link>
        </li>
    );
};

export default TarjetaServicio;
