import { Check, Info, X, XCircle } from "lucide-react";

const CONFIGURACION = {
    exito: { icono: Check, estilo: "border-emerald-500/40 bg-[#0b211c] text-emerald-100", vivo: "polite" },
    error: { icono: XCircle, estilo: "border-red-500/40 bg-[#271416] text-red-100", vivo: "assertive" },
    informacion: { icono: Info, estilo: "border-marca/40 bg-[#10202d] text-sky-100", vivo: "polite" },
};

const Toast = ({ notificaciones, alCerrar }) => (
    // Aparecen debajo del encabezado: así no tapan el menú, el carrito ni los botones de abajo.
    <div className="pointer-events-none fixed inset-x-4 top-20 z-[110] flex flex-col gap-3 sm:left-auto sm:w-96" aria-label="Notificaciones">
        {notificaciones.map((notificacion) => {
            const configuracion = CONFIGURACION[notificacion.tipo] ?? CONFIGURACION.informacion;
            const Icono = configuracion.icono;
            return (
                <div key={notificacion.id} role={notificacion.tipo === "error" ? "alert" : "status"} aria-live={configuracion.vivo}
                    className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl shadow-black/30 ${configuracion.estilo}`}>
                    <Icono className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    <p className="flex-1 text-sm leading-relaxed">{notificacion.mensaje}</p>
                    <button type="button" className="-m-1.5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-white/10" onClick={() => alCerrar(notificacion.id)} aria-label="Cerrar notificación">
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>
            );
        })}
    </div>
);

export default Toast;
