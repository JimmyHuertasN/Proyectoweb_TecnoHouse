import { Link } from "react-router-dom";

const BarraNavegacionAutenticacion = () => {
    return (
        <header className="sticky top-0 z-50 flex h-[75px] w-full items-center justify-between border-b border-borde bg-black px-5 sm:px-[8%]">
            <Link to="/" className="text-xl font-bold text-white sm:text-2xl">
                TECNO<span className="text-marca">HOUSE</span>
            </Link>
            <Link to="/" className="text-sm text-slate-300 transition hover:text-marca sm:text-[15px]">
                ← Volver al inicio
            </Link>
        </header>
    );
};

export default BarraNavegacionAutenticacion;
