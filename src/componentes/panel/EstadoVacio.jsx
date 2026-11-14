/* Mensaje amigable para cuando una lista todavía no tiene elementos. */
const EstadoVacio = ({ icono, titulo, descripcion, children }) => {
    const Icono = icono;
    return (
        <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-14 text-center">
            {Icono && <Icono className="mx-auto size-10 text-slate-500" strokeWidth={1.5} aria-hidden="true" />}
            <h2 className="mt-4 text-lg font-semibold text-white">{titulo}</h2>
            {descripcion && <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-400">{descripcion}</p>}
            {children && <div className="mt-6 flex justify-center">{children}</div>}
        </div>
    );
};

export default EstadoVacio;
