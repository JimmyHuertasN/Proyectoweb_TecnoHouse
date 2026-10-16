import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSesion } from "../contexto/ContextoSesion.js";

const TarjetaServicio = ({ icono: Icono, titulo, descripcion }) => {
    const { usuario } = useSesion();
    const destino = usuario ? "/cliente/solicitudes/nueva" : "/registro";

    return (
        <Link
            to={destino}
            data-animacion-entrada
            className="tarjeta-elevable group block h-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marca"
            aria-label={`Solicitar servicio de ${titulo}`}
        >
            <article className="flex h-full flex-col">
                <span className="mb-5 flex size-14 items-center justify-center rounded-xl bg-marca/10 text-marca transition group-hover:bg-marca/20" aria-hidden="true">
                    <Icono size={28} strokeWidth={1.8} />
                </span>
                <h3 className="mb-3 text-xl font-bold text-white">{titulo}</h3>
                <p className="mb-6 flex-1 leading-relaxed text-slate-400">{descripcion}</p>
                <span className="inline-flex items-center gap-2 font-bold text-marca">
                    Solicitar servicio <ArrowUpRight size={18} aria-hidden="true" />
                </span>
            </article>
        </Link>
    );
};

export default TarjetaServicio;
