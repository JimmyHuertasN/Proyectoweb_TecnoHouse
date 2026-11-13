import { ChevronDown } from "lucide-react";

const PREGUNTAS = [
    { pregunta: "¿Qué equipos reciben?", respuesta: "Atendemos computadores y portátiles, celulares, consolas de videojuegos y sistemas de cámaras de seguridad." },
    { pregunta: "¿Debo aprobar el costo antes de la reparación?", respuesta: "Sí. Primero registramos el diagnóstico y la cotización. La reparación continúa cuando apruebas el costo propuesto." },
    { pregunta: "¿Cómo puedo seguir el estado de mi servicio?", respuesta: "Inicia sesión en tu cuenta para consultar el avance, el diagnóstico y la cotización de cada solicitud." },
    { pregunta: "¿Qué pasa si no apruebo la cotización?", respuesta: "No se inicia la reparación. Puedes revisar la solicitud en tu cuenta y comunicarte con nosotros si tienes preguntas." },
];

const PreguntasFrecuentes = () => (
    <section id="preguntas-frecuentes" data-animacion-entrada aria-labelledby="titulo-preguntas" className="scroll-mt-20 border-t border-borde bg-[#080d16] px-6 py-20 sm:px-[8%] sm:py-24">
        <div className="mx-auto max-w-3xl">
            <p className="antetitulo text-center">Resolvemos tus dudas</p>
            <h2 id="titulo-preguntas" className="mb-10 text-center text-3xl font-bold sm:text-4xl">PREGUNTAS FRECUENTES</h2>
            <div className="space-y-3">
                {PREGUNTAS.map(({ pregunta, respuesta }) => (
                    <details key={pregunta} className="group rounded-xl border border-borde bg-tarjeta open:border-marca/50">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca [&::-webkit-details-marker]:hidden">
                            {pregunta}
                            <ChevronDown size={20} className="shrink-0 text-marca transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                        </summary>
                        <p className="px-5 pb-5 leading-relaxed text-slate-400">{respuesta}</p>
                    </details>
                ))}
            </div>
        </div>
    </section>
);

export default PreguntasFrecuentes;
