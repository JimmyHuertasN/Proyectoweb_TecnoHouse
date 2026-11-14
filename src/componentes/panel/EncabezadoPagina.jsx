/* Título, descripción y (opcionalmente) las acciones de la página a la derecha. */
const EncabezadoPagina = ({ titulo, descripcion, children }) => {
    return (
        <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{titulo}</h1>
                {descripcion && <p className="mt-1.5 max-w-2xl text-slate-400">{descripcion}</p>}
            </div>
            {children && <div className="flex shrink-0 flex-wrap gap-3">{children}</div>}
        </div>
    );
};

export default EncabezadoPagina;
