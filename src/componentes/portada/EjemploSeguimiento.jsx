import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, ChevronLeft, Wrench } from "lucide-react";

// Datos inventados solo para la ilustración: no corresponden a ningún servicio real.
const PASOS_EJEMPLO = [
    "Solicitud recibida",
    "Diagnóstico registrado",
    "Cotización aprobada",
    "En reparación",
    "Listo para entregar",
];

// Mensaje del técnico que muestra el celular en cada paso (mismo orden que PASOS_EJEMPLO).
const MENSAJES_TECNICO = [
    "Recibimos tu solicitud. Hoy revisamos el equipo.",
    "Encontramos la falla: el cargador interno.",
    "Gracias por aprobar. Ya pedimos la pieza.",
    "Ya cambiamos la pieza. Estamos haciendo pruebas.",
    "¡Tu portátil está listo! Puedes recogerlo.",
];

// Paso actual de la ilustración estática (la que se ve sin animaciones).
const PASO_ESTATICO = 3;
// Índice especial: todos los pasos completados, antes de reiniciar el ciclo.
const RECORRIDO_COMPLETO = PASOS_EJEMPLO.length;
const MS_POR_PASO = 2400;
const MS_PAUSA_FINAL = 2800;

const ESTILO_PUNTO = {
    hecho: "border-marca bg-marca text-sobre-marca",
    actual: "border-marca bg-marca/20 text-marca",
    pendiente: "border-slate-600 text-transparent",
};

const ESTILO_TEXTO = {
    hecho: "text-slate-400",
    actual: "font-semibold text-white",
    pendiente: "text-slate-500",
};

/*
    Iconos de la barra de estado del celular. El viewBox coincide con el tamaño en píxeles
    y las figuras son rellenas, así quedan nítidas aun midiendo 7–11 px.
*/
const IconoSenal = () => (
    <svg width="10" height="7" viewBox="0 0 10 7" fill="currentColor" aria-hidden="true">
        <rect x="0" y="5" width="1.75" height="2" rx="0.5" />
        <rect x="2.75" y="3.5" width="1.75" height="3.5" rx="0.5" />
        <rect x="5.5" y="2" width="1.75" height="5" rx="0.5" />
        <rect x="8.25" y="0" width="1.75" height="7" rx="0.5" />
    </svg>
);

const IconoWifi = () => (
    <svg width="9" height="7" viewBox="0 0 9 7" fill="currentColor" aria-hidden="true">
        <path d="M4.5 0C6.2 0 7.8.65 9 1.75L7.95 2.85A5 5 0 0 0 4.5 1.5a5 5 0 0 0-3.45 1.35L0 1.75A6.5 6.5 0 0 1 4.5 0Z" />
        <path d="M4.5 3c.95 0 1.8.35 2.45.95L5.9 5.05a2 2 0 0 0-2.8 0L2.05 3.95A3.5 3.5 0 0 1 4.5 3Z" />
        <circle cx="4.5" cy="6.1" r="0.9" />
    </svg>
);

const IconoBateria = () => (
    <svg width="14" height="7" viewBox="0 0 14 7" aria-hidden="true">
        <rect x="0.5" y="0.5" width="11.5" height="6" rx="1.75" fill="none" stroke="currentColor" strokeOpacity="0.45" />
        <rect x="2" y="2" width="8.5" height="3" rx="0.75" fill="currentColor" />
        <rect x="12.75" y="2.25" width="1.25" height="2.5" rx="0.6" fill="currentColor" fillOpacity="0.45" />
    </svg>
);

const prefiereMenosMovimiento = () =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const estadoDelPaso = (indice, pasoActual) => {
    if (indice < pasoActual) return "hecho";
    if (indice === pasoActual) return "actual";
    return "pendiente";
};

/*
    Recorre los pasos del ejemplo en bucle: cada uno pasa a "actual" y luego a "hecho";
    al completar los cinco hay una pausa y el ciclo vuelve a empezar.
    Solo avanza mientras la ilustración está en pantalla y si el usuario no pidió
    reducir el movimiento; en ese caso se queda en el estado estático original.
*/
const usePasoAnimado = (contenedor) => {
    const [animar, setAnimar] = useState(() => !prefiereMenosMovimiento());
    // Sin IntersectionObserver no se puede saber si está en pantalla: se anima siempre.
    const [visible, setVisible] = useState(() => !("IntersectionObserver" in window));
    const [paso, setPaso] = useState(() => (prefiereMenosMovimiento() ? PASO_ESTATICO : 0));
    // Cuenta las vueltas completas; al cambiar, la lista vuelve a hacer su entrada.
    const [ciclo, setCiclo] = useState(0);

    useEffect(() => {
        const consulta = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        if (!consulta) return undefined;
        const actualizar = () => {
            setAnimar(!consulta.matches);
            if (consulta.matches) setPaso(PASO_ESTATICO);
        };
        consulta.addEventListener("change", actualizar);
        return () => consulta.removeEventListener("change", actualizar);
    }, []);

    useEffect(() => {
        const elemento = contenedor.current;
        if (!elemento || !("IntersectionObserver" in window)) return undefined;
        const observador = new IntersectionObserver(([entrada]) => setVisible(entrada.isIntersecting));
        observador.observe(elemento);
        return () => observador.disconnect();
    }, [contenedor]);

    useEffect(() => {
        if (!animar || !visible) return undefined;
        const espera = paso === RECORRIDO_COMPLETO ? MS_PAUSA_FINAL : MS_POR_PASO;
        const temporizador = setTimeout(() => {
            if (paso === RECORRIDO_COMPLETO) setCiclo((anterior) => anterior + 1);
            setPaso(paso === RECORRIDO_COMPLETO ? 0 : paso + 1);
        }, espera);
        return () => clearTimeout(temporizador);
    }, [animar, visible, paso]);

    return { paso, ciclo };
};

/*
    Ilustración de la portada: un portátil y un celular con un seguimiento de ejemplo.
    Es decorativa (role="img"), por eso los lectores de pantalla solo anuncian su descripción.
*/
const EjemploSeguimiento = () => {
    const contenedor = useRef(null);
    const { paso: pasoActual, ciclo } = usePasoAnimado(contenedor);
    // Con todo completado se mantiene el último mensaje ("listo").
    const mensajeActual = Math.min(pasoActual, MENSAJES_TECNICO.length - 1);

    return (
        <div ref={contenedor} role="img" aria-label="Ilustración de ejemplo: el seguimiento de una reparación visto en un portátil y en un celular" className="relative mx-auto w-full max-w-lg px-4 pb-16">
            <div aria-hidden="true" className="absolute inset-0 -z-10 rounded-full bg-marca/15 blur-3xl" />

            {/* Portátil */}
            <div className="rounded-t-2xl border border-slate-700 bg-slate-900 p-2.5">
                <div className="rounded-lg bg-fondo p-5 sm:p-7">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">Portátil · no enciende</p>
                        <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[11px] font-medium text-slate-300">Ejemplo</span>
                    </div>

                    {/* key={ciclo}: en cada vuelta la lista se monta de nuevo y sus pasos entran escalonados. */}
                    <ol key={ciclo} className="space-y-3.5">
                        {PASOS_EJEMPLO.map((texto, indice) => {
                            const estado = estadoDelPaso(indice, pasoActual);
                            return (
                                <li key={texto} className="paso-entrada flex items-center gap-3 text-sm" style={{ animationDelay: `${indice * 90}ms` }}>
                                    {/* El check y el punto siempre existen; solo se cruzan con opacidad para no mover nada. */}
                                    <span className={`relative flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-500 ease-out ${ESTILO_PUNTO[estado]}`}>
                                        {estado === "actual" && <span key={indice} className="paso-pulso absolute inset-0 rounded-full" />}
                                        <Check size={12} strokeWidth={3} className={`absolute transition duration-500 ease-out ${estado === "hecho" ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
                                        <span className={`size-1.5 rounded-full bg-marca transition duration-500 ease-out ${estado === "actual" ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
                                    </span>
                                    <span className={`transition-colors duration-500 ease-out ${ESTILO_TEXTO[estado]}`}>{texto}</span>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>
            <div className="-mx-3 h-3 rounded-b-xl bg-slate-700" />

            {/*
                Celular: proporción de un teléfono real (9:19) con isla, barra de estado, chat con el
                técnico y barra para escribir. Es más angosto en móviles para no tapar los pasos del portátil.
                Los iconos usan trazo de grosor fijo (absoluteStrokeWidth) o figuras rellenas medidas en
                píxeles enteros: a estos tamaños tan pequeños un trazo escalado se ve borroso.
            */}
            <div className="absolute right-0 bottom-0 aspect-[9/19] w-[6.5rem] rounded-[1.4rem] border border-slate-600 bg-gradient-to-b from-slate-800 to-slate-900 p-[3px] shadow-2xl shadow-black/60 sm:w-32 sm:rounded-[1.75rem] sm:p-1">
                {/* Botones laterales */}
                <span className="absolute top-[22%] -left-[3px] h-[8%] w-[2px] rounded-l-sm bg-slate-500" />
                <span className="absolute top-[33%] -left-[3px] h-[12%] w-[2px] rounded-l-sm bg-slate-500" />
                <span className="absolute top-[28%] -right-[3px] h-[16%] w-[2px] rounded-r-sm bg-slate-500" />

                <div className="relative flex h-full flex-col overflow-hidden rounded-[1.2rem] bg-fondo ring-1 ring-black/50 sm:rounded-[1.5rem]">
                    {/* Isla */}
                    <span className="absolute inset-x-0 top-1.5 mx-auto h-2.5 w-8 rounded-full bg-black sm:top-2 sm:h-3 sm:w-10" />

                    {/* Barra de estado */}
                    <div className="flex h-4 items-center justify-between px-3 pt-1.5 text-[7px] leading-none font-semibold text-slate-100 tabular-nums sm:h-5 sm:px-3.5 sm:pt-2 sm:text-[8px]">
                        <span>9:41</span>
                        <span className="flex items-center gap-[3px] text-slate-100">
                            <IconoSenal />
                            <IconoWifi />
                            <IconoBateria />
                        </span>
                    </div>

                    {/* Encabezado del chat */}
                    <div className="mt-1.5 flex items-center gap-1 border-b border-white/10 px-1.5 pb-1.5 sm:mt-2 sm:gap-1.5 sm:px-2 sm:pb-2">
                        <ChevronLeft size={12} strokeWidth={1.75} absoluteStrokeWidth className="-ml-0.5 shrink-0 text-marca" />
                        <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-marca/20 text-marca sm:size-5">
                            <Wrench size={10} strokeWidth={1.5} absoluteStrokeWidth />
                        </span>
                        <span className="min-w-0 leading-tight">
                            <span className="block truncate text-[8px] font-semibold text-white sm:text-[9px]">Técnico TecnoHouse</span>
                            <span className="flex items-center gap-[3px] text-[7px] text-slate-400 sm:text-[8px]">
                                <span className="size-[4px] rounded-full bg-emerald-400" /> en línea
                            </span>
                        </span>
                    </div>

                    {/* Conversación */}
                    <div className="flex flex-1 flex-col justify-end gap-1.5 px-1.5 pb-1.5 sm:px-2 sm:pb-2">
                        <span className="mx-auto rounded-full bg-slate-800 px-1.5 py-0.5 text-[7px] leading-none text-slate-400 sm:text-[8px]">Hoy</span>
                        {/*
                            Todos los mensajes ocupan la misma celda de la cuadrícula: la burbuja toma el
                            tamaño del más largo y no cambia al alternarlos. Al cambiar de paso (key) la
                            burbuja se monta de nuevo: primero "escribiendo…" y luego entra el mensaje.
                        */}
                        <div key={mensajeActual} className="grid max-w-[88%] rounded-xl rounded-bl-sm bg-slate-800 px-2 py-1.5 text-[8px] leading-snug text-slate-100 sm:text-[9.5px]">
                            {MENSAJES_TECNICO.map((mensaje, indice) => (
                                <p key={mensaje} className={`col-start-1 row-start-1 ${indice === mensajeActual ? "mensaje-entrada" : "invisible"}`}>
                                    {mensaje}
                                    <span className="mt-0.5 block text-right text-[6.5px] leading-none text-slate-400 sm:text-[7.5px]">9:41</span>
                                </p>
                            ))}
                            <span className="mensaje-escribiendo col-start-1 row-start-1 flex items-center gap-[3px] self-center">
                                <span className="punto-escribiendo size-[4px] rounded-full bg-slate-400" />
                                <span className="punto-escribiendo size-[4px] rounded-full bg-slate-400 [animation-delay:150ms]" />
                                <span className="punto-escribiendo size-[4px] rounded-full bg-slate-400 [animation-delay:300ms]" />
                            </span>
                        </div>
                    </div>

                    {/* Barra para escribir e indicador de inicio */}
                    <div className="mx-1.5 flex h-[18px] items-center justify-between rounded-full border border-slate-700 pr-1 pl-2 text-[7px] text-slate-500 sm:mx-2 sm:h-5 sm:text-[8px]">
                        <span className="truncate">Escribe un mensaje</span>
                        <span className="flex size-3 shrink-0 items-center justify-center rounded-full bg-marca text-sobre-marca sm:size-3.5">
                            <ArrowUp size={8} strokeWidth={1.75} absoluteStrokeWidth />
                        </span>
                    </div>
                    <span className="mx-auto mt-1.5 mb-1 h-[3px] w-8 rounded-full bg-slate-400 sm:w-10" />
                </div>
            </div>
        </div>
    );
};

export default EjemploSeguimiento;
