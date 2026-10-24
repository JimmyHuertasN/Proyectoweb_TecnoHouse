/*
    Buscador, selector de estado y rango de fechas de las listas del panel.
    "paginado" es lo que devuelve useFiltroPaginado. "opcionesEstado" es una lista de
    { valor, etiqueta } o de grupos { grupo, opciones }; si no se pasa, no hay selector de estado.
*/
const CLASE_CONTROL = "sm:min-w-40 sm:flex-[1_1_10rem]";

const OpcionesEstado = ({ opciones }) =>
    opciones.map((elemento) =>
        elemento.grupo ? (
            <optgroup key={elemento.grupo} label={elemento.grupo}>
                <OpcionesEstado opciones={elemento.opciones} />
            </optgroup>
        ) : (
            <option key={elemento.valor} value={elemento.valor}>
                {elemento.etiqueta}
            </option>
        )
    );

const BarraFiltros = ({ id, etiqueta, placeholder, paginado, opcionesEstado, conFechas = false }) => {
    const { filtros, cambiarFiltro, limpiarFiltros, hayFiltrosActivos } = paginado;
    const alCambiar = (evento) => cambiarFiltro(evento.target.name, evento.target.value);

    // El botón queda deshabilitado al limpiar: el foco pasa al buscador para no perderse.
    const limpiar = () => {
        limpiarFiltros();
        document.getElementById(`${id}-texto`)?.focus();
    };

    return (
        <div role="search" aria-label={etiqueta} className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="sm:min-w-56 sm:flex-[2_1_16rem]">
                <label htmlFor={`${id}-texto`} className="etiqueta">Buscar</label>
                <input
                    id={`${id}-texto`}
                    name="texto"
                    type="search"
                    className="campo"
                    placeholder={placeholder}
                    autoComplete="off"
                    value={filtros.texto}
                    onChange={alCambiar}
                />
            </div>

            {opcionesEstado && (
                <div className={CLASE_CONTROL}>
                    <label htmlFor={`${id}-estado`} className="etiqueta">Estado</label>
                    <select id={`${id}-estado`} name="estado" className="campo" value={filtros.estado} onChange={alCambiar}>
                        <OpcionesEstado opciones={opcionesEstado} />
                    </select>
                </div>
            )}

            {conFechas && (
                <>
                    <div className={CLASE_CONTROL}>
                        <label htmlFor={`${id}-desde`} className="etiqueta">Desde</label>
                        <input
                            id={`${id}-desde`}
                            name="desde"
                            type="date"
                            className="campo [color-scheme:dark]"
                            max={filtros.hasta || undefined}
                            value={filtros.desde}
                            onChange={alCambiar}
                        />
                    </div>
                    <div className={CLASE_CONTROL}>
                        <label htmlFor={`${id}-hasta`} className="etiqueta">Hasta</label>
                        <input
                            id={`${id}-hasta`}
                            name="hasta"
                            type="date"
                            className="campo [color-scheme:dark]"
                            min={filtros.desde || undefined}
                            value={filtros.hasta}
                            onChange={alCambiar}
                        />
                    </div>
                </>
            )}

            <button
                type="button"
                onClick={limpiar}
                disabled={!hayFiltrosActivos}
                className="boton-secundario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-600 disabled:hover:text-slate-200"
            >
                Limpiar filtros
            </button>
        </div>
    );
};

export default BarraFiltros;
