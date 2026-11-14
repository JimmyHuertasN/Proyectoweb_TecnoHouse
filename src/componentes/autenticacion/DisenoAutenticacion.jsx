import { useId } from "react";
import { Camera, ClipboardCheck, ListChecks, MessagesSquare } from "lucide-react";
import EncabezadoSitio from "../EncabezadoSitio.jsx";

const VENTAJAS_CUENTA = [
    { icono: Camera, texto: "Solicitar una reparación y adjuntar fotos de la falla." },
    { icono: ListChecks, texto: "Seguir el estado de cada equipo, paso a paso." },
    { icono: ClipboardCheck, texto: "Aprobar o rechazar la cotización antes de reparar." },
    { icono: MessagesSquare, texto: "Conversar con el técnico que atiende tu servicio." },
];

/*
    Estructura compartida por las pantallas de acceso: el encabezado del sitio, un resumen
    de lo que permite la cuenta (solo en pantallas grandes) y la tarjeta con el formulario.
*/
const DisenoAutenticacion = ({ antetitulo, titulo, descripcion, children }) => {
    const idTitulo = useId();

    return (
        <div className="flex min-h-screen flex-col bg-fondo">
            <EncabezadoSitio />

            <main className="flex flex-1 items-center bg-gradient-to-b from-superficie to-fondo">
                <div className="contenedor grid items-center gap-12 py-10 sm:py-16 lg:grid-cols-[1fr_30rem] lg:gap-16">
                    <aside className="hidden lg:block" aria-label="Qué puedes hacer con tu cuenta">
                        <p className="antetitulo">Tu cuenta de TecnoHouse</p>
                        <p className="max-w-md text-3xl leading-tight font-bold tracking-tight text-white">Todo lo de tu reparación, en un solo lugar.</p>
                        <ul className="mt-8 space-y-5">
                            {VENTAJAS_CUENTA.map(({ icono: Icono, texto }) => (
                                <li key={texto} className="flex items-start gap-3.5 text-slate-300">
                                    <Icono size={20} strokeWidth={1.8} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />
                                    {texto}
                                </li>
                            ))}
                        </ul>
                    </aside>

                    <section className="mx-auto w-full max-w-[30rem] rounded-2xl border border-borde bg-tarjeta p-6 shadow-2xl shadow-black/40 sm:p-9" aria-labelledby={idTitulo}>
                        <p className="antetitulo">{antetitulo}</p>
                        <h1 id={idTitulo} className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{titulo}</h1>
                        <p className="mt-2 mb-7 leading-relaxed text-slate-400">{descripcion}</p>

                        {children}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default DisenoAutenticacion;
