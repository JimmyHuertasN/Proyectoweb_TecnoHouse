import { useState } from "react";
import { Menu } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import CampanaNotificaciones from "./CampanaNotificaciones.jsx";
import MenuLateral from "./MenuLateral.jsx";

/*
    Estructura común de los paneles de cada rol: menú lateral + contenido.
    <Outlet /> es el lugar donde React Router dibuja la página hija que corresponde a la URL.
*/
const DisenoPanel = ({ menu }) => {
    const [menuAbierto, setMenuAbierto] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white lg:flex">
            <MenuLateral menu={menu} abierto={menuAbierto} alCerrar={() => setMenuAbierto(false)} />

            <div className="min-w-0 flex-1">
                {/* Barra superior solo para celulares y tabletas. */}
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-borde bg-fondo/95 px-4 backdrop-blur lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMenuAbierto(true)}
                        className="cursor-pointer rounded-lg p-2 text-2xl leading-none text-slate-300 hover:bg-white/5"
                        aria-label="Abrir menú"
                    >
                        <Menu size={24} aria-hidden="true" />
                    </button>
                    <Link to={menu.inicio} className="text-lg font-bold">
                        TECNO<span className="text-marca">HOUSE</span>
                    </Link>
                    {/* Campana visible en el encabezado móvil del panel. */}
                    <CampanaNotificaciones />
                </header>

                <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DisenoPanel;
