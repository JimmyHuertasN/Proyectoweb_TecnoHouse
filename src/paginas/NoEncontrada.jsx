import { Link } from "react-router-dom";

const NoEncontrada = () => (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fondo px-6 text-center">
        <p className="antetitulo">Error 404</p>
        <h1 className="mt-3 text-5xl font-bold">No encontramos esa página</h1>
        <p className="mt-4 max-w-lg text-slate-300">El enlace puede estar vencido o la dirección puede tener un error.</p>
        <Link to="/" className="boton-primario mt-8">Volver al inicio</Link>
    </main>
);

export default NoEncontrada;
