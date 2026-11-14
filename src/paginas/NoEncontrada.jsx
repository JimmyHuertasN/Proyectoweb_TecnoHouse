import { Link } from "react-router-dom";
import EncabezadoSitio from "../componentes/EncabezadoSitio.jsx";

const NoEncontrada = () => (
    <div className="flex min-h-screen flex-col bg-fondo">
        <EncabezadoSitio />
        <main className="contenedor flex flex-1 flex-col items-center justify-center py-20 text-center">
            <p className="antetitulo">Error 404</p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">No encontramos esa página</h1>
            <p className="mt-4 max-w-lg text-slate-400">El enlace puede estar vencido o la dirección puede tener un error.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/" className="boton-primario">Volver al inicio</Link>
                <Link to="/tienda" className="boton-secundario">Ir a la tienda</Link>
            </div>
        </main>
    </div>
);

export default NoEncontrada;
