import { Check, Info, X, XCircle } from "lucide-react";

const CONFIGURACION = {
    exito: { icono: Check, estilo: "border-emerald-500/40 bg-[#0b211c] text-emerald-100", vivo: "polite" },
    error: { icono: XCircle, estilo: "border-red-500/40 bg-[#271416] text-red-100", vivo: "assertive" },
    informacion: { icono: Info, estilo: "border-marca/40 bg-[#10202d] text-sky-100", vivo: "polite" },
};

const Toast = ({ notificaciones, alCerrar }) => (
    <div className="pointer-events-none fixed top-4 right-4 z-[110] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3" aria-label="Notificaciones">
        {notificaciones.map((notificacion) => {
            const configuracion = CONFIGURACION[notificacion.tipo] ?? CONFIGURACION.informacion;
            const Icono = configuracion.icono;
            return (
                <div key={notificacion.id} role={notificacion.tipo === "error" ? "alert" : "status"} aria-live={configuracion.vivo}
                    className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl shadow-black/30 ${configuracion.estilo}`}>
                    <Icono className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    <p className="flex-1 text-sm leading-relaxed">{notificacion.mensaje}</p>
                    <button type="button" className="rounded p-1 hover:bg-white/10" onClick={() => alCerrar(notificacion.id)} aria-label="Cerrar notificación">
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>
            );
        })}
    </div>
);

export default Toast;
