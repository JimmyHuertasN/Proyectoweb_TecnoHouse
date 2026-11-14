import { useEffect, useState } from "react";
import { MessageSquareQuote } from "lucide-react";
import { listarResenasPublicas } from "../../api/resenas.js";
import Estrellas from "../panel/Estrellas.jsx";
import Skeleton from "../panel/Skeleton.jsx";

const fechaLegible = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" });

/* Mensaje centrado para cuando no hay reseñas o no se pudieron cargar. */
const SinResenas = ({ titulo, texto }) => (
    <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-12 text-center" role="status">
        <MessageSquareQuote className="mx-auto size-8 text-slate-500" aria-hidden="true" />
        <p className="mt-4 font-medium text-white">{titulo}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{texto}</p>
    </div>
);

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
        <section id="resenas" data-animacion-entrada aria-labelledby="titulo-resenas" className="seccion border-y border-white/10 bg-superficie">
            <div className="contenedor">
                <p className="antetitulo">Reseñas</p>
                <h2 id="titulo-resenas" className="titulo-seccion">Lo que dicen nuestros clientes</h2>
                <p className="texto-seccion mb-10">Comentarios que dejan los clientes al calificar un servicio terminado.</p>

                {cargando && <Skeleton tipo="tarjeta" cantidad={3} etiqueta="Cargando reseñas" />}
                {!cargando && error && <SinResenas titulo={error} texto="Vuelve a intentarlo más tarde." />}
                {!cargando && !error && resenas.length === 0 && (
                    <SinResenas titulo="Aún no tenemos reseñas para mostrar" texto="Cuando nuestros clientes compartan su experiencia, la encontrarás aquí." />
                )}
                {!cargando && !error && resenas.length > 0 && (
                    <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {resenas.map((resena, indice) => (
                            <li key={`${resena.fecha}-${indice}`} className="flex h-full flex-col rounded-2xl border border-borde bg-tarjeta p-6">
                                <Estrellas puntuacion={resena.puntuacion} />
                                <blockquote className="mt-4 flex-1 leading-relaxed text-slate-200">“{resena.comentario}”</blockquote>
                                <footer className="mt-6 text-sm">
                                    <span className="font-semibold text-white">{resena.nombre}</span>
                                    <time className="mt-0.5 block text-xs text-slate-500" dateTime={resena.fecha}>{fechaLegible.format(new Date(resena.fecha))}</time>
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
