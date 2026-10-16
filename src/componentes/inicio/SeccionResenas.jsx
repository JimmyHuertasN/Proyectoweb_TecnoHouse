import { useEffect, useState } from "react";
import { MessageSquareQuote } from "lucide-react";
import { listarResenasPublicas } from "../../api/resenas.js";
import Estrellas from "../panel/Estrellas.jsx";

const fechaLegible = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" });

const SeccionResenas = () => {
    const [resenas, setResenas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let vigente = true;

        listarResenasPublicas()
            .then((lista) => vigente && setResenas(lista))
            .catch(() => vigente && setError("No pudimos cargar las reseñas en este momento."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, []);

    return (
        <section id="resenas" data-animacion-entrada aria-labelledby="titulo-resenas" className="scroll-mt-20 bg-fondo px-6 py-20 sm:px-[8%] sm:py-24">
            <div className="mx-auto max-w-6xl">
                <p className="antetitulo text-center">Experiencias reales</p>
                <h2 id="titulo-resenas" className="mb-4 text-center text-3xl font-bold sm:text-4xl">LO QUE DICEN NUESTROS CLIENTES</h2>
                <p className="mx-auto mb-12 max-w-2xl text-center text-slate-400">La confianza se construye con cada equipo que vuelve a funcionar.</p>

                {cargando && <p className="text-center text-slate-400" role="status">Cargando reseñas...</p>}
                {!cargando && error && <p className="text-center text-slate-400" role="status">{error}</p>}
                {!cargando && !error && resenas.length === 0 && (
                    <div className="tarjeta mx-auto max-w-xl text-center">
                        <MessageSquareQuote className="mx-auto mb-3 size-8 text-marca" aria-hidden="true" />
                        <p className="font-medium">Aún no tenemos reseñas para mostrar.</p>
                        <p className="mt-1 text-sm text-slate-400">Cuando nuestros clientes compartan su experiencia, la encontrarás aquí.</p>
                    </div>
                )}
                {!cargando && !error && resenas.length > 0 && (
                    <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {resenas.map((resena, indice) => (
                            <li key={`${resena.fecha}-${indice}`} className="tarjeta flex h-full flex-col">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <Estrellas puntuacion={resena.puntuacion} />
                                    <MessageSquareQuote size={20} className="shrink-0 text-marca/70" aria-hidden="true" />
                                </div>
                                <blockquote className="flex-1 leading-relaxed text-slate-200">“{resena.comentario}”</blockquote>
                                <footer className="mt-6 flex items-center justify-between gap-3 border-t border-borde pt-4 text-sm">
                                    <span className="font-semibold">{resena.nombre}</span>
                                    <time className="text-xs text-slate-500" dateTime={resena.fecha}>{fechaLegible.format(new Date(resena.fecha))}</time>
                                </footer>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
};

export default SeccionResenas;
