import { useRef } from "react";
import { SearchX } from "lucide-react";
import EstadoVacio from "./EstadoVacio.jsx";
import Paginacion from "./Paginacion.jsx";

const describirRango = ({ primero, ultimo, total }) =>
    `Mostrando ${primero}–${ultimo} de ${total} ${total === 1 ? "resultado" : "resultados"}`;

/*
    Envuelve la lista de una página: cuántos resultados hay, el estado vacío cuando los
    filtros no encuentran nada y la paginación. "paginado" es lo que devuelve useFiltroPaginado
    e "id" el mismo de BarraFiltros (para devolver el foco al buscador al limpiar).
*/
const ResultadosPaginados = ({ id, paginado, children }) => {
    const inicio = useRef(null);
    const sinResultados = paginado.total === 0;

    const cambiarPagina = (numero) => {
        paginado.irAPagina(numero);
        // Si el usuario bajó hasta la paginación, vuelve al comienzo de la lista.
        if (inicio.current && inicio.current.getBoundingClientRect().top < 0) {
            inicio.current.scrollIntoView({ block: "start", behavior: "smooth" });
        }
    };

    const limpiar = () => {
        paginado.limpiarFiltros();
        document.getElementById(`${id}-texto`)?.focus();
    };

    return (
        <>
            {/* Siempre está en la página para que los lectores de pantalla anuncien cada cambio de resultados. */}
            <p ref={inicio} aria-live="polite" className={sinResultados ? "sr-only" : "mb-3 scroll-mt-6 text-sm text-slate-400"}>
                {sinResultados ? "No se encontraron resultados con estos filtros." : describirRango(paginado)}
            </p>

            {sinResultados ? (
                <EstadoVacio
                    icono={SearchX}
                    titulo="No se encontraron resultados con estos filtros"
                    descripcion="Prueba con otras palabras, otro estado o un rango de fechas más amplio."
                >
                    <button type="button" onClick={limpiar} className="boton-secundario">
                        Limpiar filtros
                    </button>
                </EstadoVacio>
            ) : (
                <>
                    {children}
                    <Paginacion pagina={paginado.pagina} totalPaginas={paginado.totalPaginas} alCambiar={cambiarPagina} />
                </>
            )}
        </>
    );
};

export default ResultadosPaginados;
