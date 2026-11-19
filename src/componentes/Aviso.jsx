import { CircleAlert, CircleCheck, Info } from "lucide-react";

const TIPOS = {
    error: { icono: CircleAlert, estilo: "border-red-500/40 bg-red-500/10 text-red-200" },
    exito: { icono: CircleCheck, estilo: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" },
    info: { icono: Info, estilo: "border-sky-500/30 bg-sky-500/10 text-sky-100" },
};

/* Recuadro de mensajes de formularios y paneles. No se dibuja nada si no hay texto. */
const Aviso = ({ texto, tipo = "info" }) => {
    if (!texto) return null;
    const { icono: Icono, estilo } = TIPOS[tipo] ?? TIPOS.info;

    return (
        <p className={`notificacion-entrada mb-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-relaxed shadow-sm shadow-black/10 ring-1 ring-white/[0.03] ${estilo}`} role={tipo === "error" ? "alert" : "status"}>
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                <Icono size={17} aria-hidden="true" />
            </span>
            <span>{texto}</span>
        </p>
    );
};

export default Aviso;
