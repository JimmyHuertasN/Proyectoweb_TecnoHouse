/* Mensaje amigable para cuando una lista todavía no tiene elementos. */
const EstadoVacio = ({ icono, titulo, descripcion, children }) => {
    return (
        <div className="rounded-xl border border-dashed border-slate-700 px-6 py-12 text-center">
            <p className="text-4xl" aria-hidden="true">{icono}</p>
            <h2 className="mt-4 text-lg font-semibold">{titulo}</h2>
            {descripcion && <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{descripcion}</p>}
            {children && <div className="mt-6 flex justify-center">{children}</div>}
        </div>
    );
};

export default EstadoVacio;
