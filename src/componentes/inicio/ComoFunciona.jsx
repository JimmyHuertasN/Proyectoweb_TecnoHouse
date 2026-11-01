import { ClipboardCheck, PackageCheck, Stethoscope, UserRoundPlus } from "lucide-react";

const PASOS = [
    { titulo: "Registra tu equipo", descripcion: "Cuéntanos qué dispositivo tienes y qué problema presenta.", Icono: UserRoundPlus },
    { titulo: "Un técnico lo diagnostica", descripcion: "Nuestro equipo revisa el equipo y registra los hallazgos.", Icono: Stethoscope },
    { titulo: "Apruebas la cotización", descripcion: "Revisa el costo y el trabajo propuesto antes de autorizar la reparación.", Icono: ClipboardCheck },
    { titulo: "Recibes tu equipo reparado", descripcion: "Te avisamos cuando esté listo para que vuelvas a disfrutarlo.", Icono: PackageCheck },
];

const ComoFunciona = () => (
    <section id="como-funciona" data-animacion-entrada aria-labelledby="titulo-como-funciona" aria-describedby="descripcion-como-funciona" className="scroll-mt-20 border-t border-borde bg-[#080d16] px-6 py-20 sm:px-[8%] sm:py-24">
        <div className="mx-auto max-w-6xl">
            <p className="antetitulo text-center">Simple y transparente</p>
            <h2 id="titulo-como-funciona" className="mb-4 text-center text-3xl font-bold sm:text-4xl">CÓMO FUNCIONA</h2>
            <p id="descripcion-como-funciona" className="mx-auto mb-12 max-w-2xl text-center text-slate-400">Te acompañamos en cada paso, desde el diagnóstico hasta la entrega.</p>
            <ol className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {PASOS.map(({ titulo, descripcion, Icono }, indice) => (
                    <li key={titulo} className="tarjeta relative flex h-full flex-col border-t-2 border-t-marca/60">
                        <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-marca/10 text-marca" aria-hidden="true">
                            <Icono size={24} strokeWidth={1.8} />
                        </span>
                        <p className="mb-2 text-xs font-bold tracking-widest text-marca uppercase">Paso {indice + 1}</p>
                        <h3 className="mb-2 text-lg font-semibold">{titulo}</h3>
                        <p className="text-sm leading-relaxed text-slate-400">{descripcion}</p>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);

export default ComoFunciona;
