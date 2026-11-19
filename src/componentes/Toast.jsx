import { Check, Info, X, XCircle } from "lucide-react";

const CONFIGURACION = {
    exito: { icono: Check, estilo: "border-emerald-500/40 bg-aviso-exito text-emerald-100", vivo: "polite" },
    error: { icono: XCircle, estilo: "border-red-500/40 bg-aviso-error text-red-100", vivo: "assertive" },
    informacion: { icono: Info, estilo: "border-marca/40 bg-aviso-informacion text-sky-100", vivo: "polite" },
};

const Toast = ({ notificaciones, alCerrar }) => (
    // Aparecen debajo del encabezado: así no tapan el menú, el carrito ni los botones de abajo.
    <div className="pointer-events-none fixed inset-x-4 top-20 z-[110] flex flex-col gap-3 sm:left-auto sm:w-96" aria-label="Notificaciones">
        {notificaciones.map((notificacion) => {
            const configuracion = CONFIGURACION[notificacion.tipo] ?? CONFIGURACION.informacion;
            const Icono = configuracion.icono;
            return (
                <div key={notificacion.id} role={notificacion.tipo === "error" ? "alert" : "status"} aria-live={configuracion.vivo}
                    className={`notificacion-entrada pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg shadow-black/25 ring-1 ring-white/5 backdrop-blur-xl sm:p-4 ${configuracion.estilo}`}>
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07]">
                        <Icono className="size-[18px]" aria-hidden="true" />
                    </span>
                    <p className="flex-1 pt-1 text-sm leading-relaxed">{notificacion.mensaje}</p>
                    <button type="button" className="-m-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-current/70 transition hover:bg-white/10 hover:text-current" onClick={() => alCerrar(notificacion.id)} aria-label="Cerrar notificación">
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>
            );
        })}
    </div>
);

export default Toast;
