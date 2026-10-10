/* Título, descripción y (opcionalmente) un botón de acción en la esquina. */
const EncabezadoPagina = ({ titulo, descripcion, children }) => {
    return (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold sm:text-3xl">{titulo}</h1>
                {descripcion && <p className="mt-2 text-slate-400">{descripcion}</p>}
            </div>
            {children && <div className="flex shrink-0 gap-3">{children}</div>}
        </div>
    );
};

export default EncabezadoPagina;
