import { useState } from "react";
import { ChartArea, ChartColumnBig, ChartPie, LayoutDashboard } from "lucide-react";
import GraficoArea from "./GraficoArea.jsx";
import GraficoBarrasIngresos from "./GraficoBarrasIngresos.jsx";
import GraficoCircular from "./GraficoCircular.jsx";
import { SinDatosGrafico } from "./piezas.jsx";

const VISTAS = [
    { valor: "actual", etiqueta: "Actual", Icono: LayoutDashboard },
    { valor: "area", etiqueta: "Área", Icono: ChartArea },
    { valor: "barras", etiqueta: "Barras", Icono: ChartColumnBig },
    { valor: "circular", etiqueta: "Circular", Icono: ChartPie },
];

const claveGuardada = (id) => `tecnohouse:vista-ingresos:${id}`;

/* La vista elegida se recuerda por gráfico en este navegador. */
const leerVista = (id) => {
    try {
        const guardada = localStorage.getItem(claveGuardada(id));
        return VISTAS.some((vista) => vista.valor === guardada) ? guardada : "actual";
    } catch {
        return "actual";
    }
};

/*
    Selector de vista para los ingresos: la presentación actual (que pasa quien usa el visor) o un
    gráfico de área, de barras o circular, cada uno con una frase que explica qué muestra.
    - id: identifica el gráfico para recordar la vista elegida.
    - titulo: nombre del gráfico para lectores de pantalla.
    - encabezado: título y descripción de la tarjeta; el selector queda a su derecha (o debajo, si no cabe).
    - actual: lo que se muestra hoy.
    - descripciones: { actual, area, barras, circular }.
    - categorias y series: datos por mes para área y barras (ver GraficoArea).
    - partes: datos para el circular (ver GraficoCircular).
*/
const VisorIngresos = ({ id, titulo, encabezado, actual, descripciones, categorias, series, partes }) => {
    const [vista, setVista] = useState(() => leerVista(id));
    const indice = VISTAS.findIndex((opcion) => opcion.valor === vista);

    const elegir = (valor) => {
        setVista(valor);
        try {
            localStorage.setItem(claveGuardada(id), valor);
        } catch {
            // Sin almacenamiento (modo privado estricto) la vista simplemente no se recuerda.
        }
    };

    // Como en todo grupo de opciones: solo la elegida recibe Tab y las flechas cambian de vista.
    const alPresionarTecla = (evento) => {
        const mover = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[evento.key];
        if (!mover) return;
        evento.preventDefault();
        const siguiente = (indice + mover + VISTAS.length) % VISTAS.length;
        elegir(VISTAS[siguiente].valor);
        evento.currentTarget.querySelectorAll('[role="radio"]')[siguiente]?.focus();
    };

    const hayMeses = series.some((serie) => serie.valores.some((valor) => valor > 0));
    const hayPartes = partes.some((parte) => parte.valor > 0);

    let contenido = actual;
    if (vista === "area") contenido = hayMeses ? <GraficoArea titulo={titulo} categorias={categorias} series={series} /> : <SinDatosGrafico />;
    if (vista === "barras") contenido = hayMeses ? <GraficoBarrasIngresos titulo={titulo} categorias={categorias} series={series} /> : <SinDatosGrafico />;
    if (vista === "circular") contenido = hayPartes ? <GraficoCircular titulo={titulo} partes={partes} /> : <SinDatosGrafico />;

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                {encabezado && <div className="min-w-0">{encabezado}</div>}

                {/* Las cuatro opciones miden lo mismo: la pastilla de la elegida se desliza con translate. */}
                <div role="radiogroup" aria-label={`Vista de ${titulo}`} onKeyDown={alPresionarTecla} className="relative grid w-full max-w-sm shrink-0 grid-cols-4 rounded-lg border border-borde bg-fondo/60 p-1 sm:w-auto">
                    <span
                        aria-hidden="true"
                        className="absolute inset-y-1 left-1 rounded-md bg-slate-800 shadow-sm transition-transform duration-200 ease-fuerte"
                        style={{ width: "calc((100% - 0.5rem) / 4)", transform: `translateX(${indice * 100}%)` }}
                    />
                    {VISTAS.map(({ valor, etiqueta, Icono }) => (
                        <button
                            key={valor}
                            type="button"
                            role="radio"
                            aria-checked={vista === valor}
                            tabIndex={vista === valor ? 0 : -1}
                            onClick={() => elegir(valor)}
                            className={`relative flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-marca ${vista === valor ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
                        >
                            <Icono size={14} aria-hidden="true" /> {etiqueta}
                        </button>
                    ))}
                </div>
            </div>

            <p aria-live="polite" className="mt-3 mb-5 text-xs text-slate-400">
                {descripciones[vista]}
            </p>

            {/* key: al cambiar de vista el contenido se monta de nuevo y entra con un fundido corto. */}
            <div key={vista} className="vista-grafico-entrada">
                {contenido}
            </div>
        </div>
    );
};

export default VisorIngresos;
