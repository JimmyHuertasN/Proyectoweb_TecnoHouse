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
        <p className={`mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed ${estilo}`} role={tipo === "error" ? "alert" : "status"}>
            <Icono size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{texto}</span>
        </p>
    );
};

export default Aviso;
