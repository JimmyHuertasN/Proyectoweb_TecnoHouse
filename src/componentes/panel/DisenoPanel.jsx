import { useCallback, useState } from "react";
import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import Logotipo from "../Logotipo.jsx";
import CampanaNotificaciones from "./CampanaNotificaciones.jsx";
import MenuLateral from "./MenuLateral.jsx";

/*
    Estructura común de los paneles de cada rol: menú lateral + contenido.
    <Outlet /> es el lugar donde React Router dibuja la página hija que corresponde a la URL.
*/
const DisenoPanel = ({ menu }) => {
    const [menuAbierto, setMenuAbierto] = useState(false);
    // Función fija: el menú lateral la usa dentro de un useEffect.
    const cerrarMenu = useCallback(() => setMenuAbierto(false), []);

    return (
        <div className="min-h-screen bg-fondo lg:flex">
            <MenuLateral menu={menu} abierto={menuAbierto} alCerrar={cerrarMenu} />

            <div className="min-w-0 flex-1">
                {/* Barra superior solo para celulares y tabletas. */}
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-fondo/90 px-4 backdrop-blur lg:hidden">
                    <button type="button" onClick={() => setMenuAbierto(true)} className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-slate-300 hover:bg-white/5" aria-label="Abrir menú">
                        <Menu size={24} aria-hidden="true" />
                    </button>
                    <Logotipo destino={menu.inicio} className="text-lg" />
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
