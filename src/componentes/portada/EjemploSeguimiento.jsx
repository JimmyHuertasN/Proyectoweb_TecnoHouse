import { Check, MessageCircle } from "lucide-react";

// Datos inventados solo para la ilustración: no corresponden a ningún servicio real.
const PASOS_EJEMPLO = [
    { texto: "Solicitud recibida", estado: "hecho" },
    { texto: "Diagnóstico registrado", estado: "hecho" },
    { texto: "Cotización aprobada", estado: "hecho" },
    { texto: "En reparación", estado: "actual" },
    { texto: "Listo para entregar", estado: "pendiente" },
];

const ESTILO_PUNTO = {
    hecho: "border-marca bg-marca text-slate-950",
    actual: "border-marca bg-marca/20 text-marca",
    pendiente: "border-slate-600 text-transparent",
};

const ESTILO_TEXTO = {
    hecho: "text-slate-400",
    actual: "font-semibold text-white",
    pendiente: "text-slate-500",
};

/*
    Ilustración de la portada: un portátil y un celular con un seguimiento de ejemplo.
    Es decorativa (role="img"), por eso los lectores de pantalla solo anuncian su descripción.
*/
const EjemploSeguimiento = () => (
    <div role="img" aria-label="Ilustración de ejemplo: el seguimiento de una reparación visto en un portátil y en un celular" className="relative mx-auto w-full max-w-lg px-4 pb-16">
        <div aria-hidden="true" className="absolute inset-0 -z-10 rounded-full bg-marca/15 blur-3xl" />

        {/* Portátil */}
        <div className="rounded-t-2xl border border-slate-700 bg-slate-900 p-2.5">
            <div className="rounded-lg bg-fondo p-5 sm:p-7">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Portátil · no enciende</p>
                    <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[11px] font-medium text-slate-300">Ejemplo</span>
                </div>

                <ol className="space-y-3.5">
                    {PASOS_EJEMPLO.map((paso) => (
                        <li key={paso.texto} className="flex items-center gap-3 text-sm">
                            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${ESTILO_PUNTO[paso.estado]}`}>
                                {paso.estado === "actual" ? <span className="size-1.5 rounded-full bg-marca" /> : <Check size={12} strokeWidth={3} />}
                            </span>
                            <span className={ESTILO_TEXTO[paso.estado]}>{paso.texto}</span>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
        <div className="-mx-3 h-3 rounded-b-xl bg-slate-700" />

        {/* Celular */}
        <div className="absolute right-0 bottom-0 w-44 rounded-3xl border border-slate-600 bg-slate-900 p-1.5 shadow-2xl shadow-black/60">
            <div className="rounded-[1.1rem] bg-fondo px-3 pt-4 pb-5">
                <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-slate-700" />
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <MessageCircle size={12} /> Mensaje del técnico
                </p>
                <p className="rounded-xl rounded-tl-sm bg-slate-800 px-2.5 py-2 text-xs leading-snug text-slate-200">
                    Ya cambiamos la pieza. Estamos haciendo pruebas.
                </p>
            </div>
        </div>
    </div>
);

export default EjemploSeguimiento;
