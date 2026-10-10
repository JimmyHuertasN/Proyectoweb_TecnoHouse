import { buscarOpcion, ESTADOS_SOLICITUD, GRAVEDADES } from "../../datos/opciones.js";

const COLORES_ESTADO = {
    pendiente: "bg-amber-500/15 text-amber-300",
    en_revision: "bg-sky-500/15 text-sky-300",
    en_reparacion: "bg-violet-500/15 text-violet-300",
    lista: "bg-emerald-500/15 text-emerald-300",
    entregada: "bg-slate-500/20 text-slate-300",
    cancelada: "bg-red-500/15 text-red-300",
};

const COLORES_GRAVEDAD = {
    baja: "text-emerald-300",
    media: "text-amber-300",
    alta: "text-red-300",
};

export const EtiquetaEstado = ({ estado }) => (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${COLORES_ESTADO[estado]}`}>
        {buscarOpcion(ESTADOS_SOLICITUD, estado).etiqueta}
    </span>
);

export const EtiquetaGravedad = ({ gravedad }) => (
    <span className={`text-xs font-semibold whitespace-nowrap ${COLORES_GRAVEDAD[gravedad]}`}>
        ● Gravedad {buscarOpcion(GRAVEDADES, gravedad).etiqueta.toLowerCase()}
    </span>
);
