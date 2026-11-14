import { ChevronDown } from "lucide-react";

const PREGUNTAS = [
    { pregunta: "¿Qué equipos reciben?", respuesta: "Atendemos computadores y portátiles, celulares, consolas de videojuegos y sistemas de cámaras de seguridad." },
    { pregunta: "¿Debo aprobar el costo antes de la reparación?", respuesta: "Sí. Primero registramos el diagnóstico y la cotización. La reparación continúa cuando apruebas el costo propuesto." },
    { pregunta: "¿Cómo puedo seguir el estado de mi servicio?", respuesta: "Inicia sesión en tu cuenta para consultar el avance, el diagnóstico y la cotización de cada solicitud." },
    { pregunta: "¿Qué pasa si no apruebo la cotización?", respuesta: "No se inicia la reparación. Puedes revisar la solicitud en tu cuenta y comunicarte con nosotros si tienes preguntas." },
];

const PreguntasFrecuentes = () => (
    <section id="preguntas-frecuentes" data-animacion-entrada aria-labelledby="titulo-preguntas" className="seccion">
        <div className="contenedor grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
                <p className="antetitulo">Preguntas frecuentes</p>
                <h2 id="titulo-preguntas" className="titulo-seccion">Lo que más nos preguntan</h2>
                <p className="texto-seccion">
                    ¿No encuentras tu duda? <a href="#contacto" className="enlace">Escríbenos</a>.
                </p>
            </div>

            <div className="border-b border-white/10">
                {PREGUNTAS.map(({ pregunta, respuesta }) => (
                    <details key={pregunta} className="group border-t border-white/10">
                        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-white marker:hidden [&::-webkit-details-marker]:hidden">
                            {pregunta}
                            <ChevronDown size={20} className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                        </summary>
                        <p className="max-w-2xl pb-5 leading-relaxed text-slate-400">{respuesta}</p>
                    </details>
                ))}
            </div>
        </div>
    </section>
);

export default PreguntasFrecuentes;
