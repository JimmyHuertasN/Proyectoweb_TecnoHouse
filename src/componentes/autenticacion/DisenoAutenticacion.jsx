import { useId } from "react";
import BarraNavegacionAutenticacion from "./BarraNavegacionAutenticacion.jsx";

/* Estructura compartida por Iniciar sesión y Registro: barra superior y tarjeta centrada. */
const DisenoAutenticacion = ({ antetitulo, titulo, descripcion, children }) => {
    const idTitulo = useId();

    return (
        <div className="min-h-screen bg-black">
            <BarraNavegacionAutenticacion />

            <main className="flex min-h-[calc(100vh-75px)] items-center justify-center px-5 py-12">
                <section
                    className="w-full max-w-[520px] rounded-xl border border-borde bg-tarjeta px-6 py-7 shadow-[0_10px_30px_rgba(0,170,255,0.12)] sm:p-10"
                    aria-labelledby={idTitulo}
                >
                    <p className="antetitulo">{antetitulo}</p>
                    <h1 id={idTitulo} className="mb-3 text-2xl font-bold sm:text-[30px]">{titulo}</h1>
                    <p className="mb-7 leading-normal text-slate-400">{descripcion}</p>

                    {children}
                </section>
            </main>
        </div>
    );
};

export default DisenoAutenticacion;
