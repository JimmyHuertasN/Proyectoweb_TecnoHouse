import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import MenuLateral from "./MenuLateral.jsx";

/*
    Estructura común de todas las páginas del panel: menú lateral + contenido.
    <Outlet /> es el lugar donde React Router dibuja la página hija que
    corresponde a la URL (Resumen, Mis dispositivos, Solicitudes o Perfil).
*/
const DisenoPanel = () => {
    const [menuAbierto, setMenuAbierto] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white lg:flex">
            <MenuLateral abierto={menuAbierto} alCerrar={() => setMenuAbierto(false)} />

            <div className="min-w-0 flex-1">
                {/* Barra superior solo para celulares y tabletas. */}
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-borde bg-fondo/95 px-4 backdrop-blur lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMenuAbierto(true)}
                        className="cursor-pointer rounded-lg p-2 text-2xl leading-none text-slate-300 hover:bg-white/5"
                        aria-label="Abrir menú"
                    >
                        ☰
                    </button>
                    <Link to="/panel" className="text-lg font-bold">
                        TECNO<span className="text-marca">HOUSE</span>
                    </Link>
                    <span className="w-10" />
                </header>

                <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DisenoPanel;
