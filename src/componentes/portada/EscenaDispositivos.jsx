import { useEffect, useId, useRef, useState } from "react";
import { BarChart3, Check, ChevronLeft, Cog, Star, TriangleAlert, TrendingUp, Wrench } from "lucide-react";

/*
    Ilustración 3D de la portada: monitor (administrador), portátil (técnico) y celular (cliente)
    en perspectiva, con etiquetas de rol flotando delante. Es decorativa (role="img").

    Todo se dibuja con CSS 3D (transform-style: preserve-3d). Las medidas usan cqw (ancho del
    contenedor) para que la escena completa escale como una imagen.

    Interacción: con un mouse, la escena gira unos grados siguiendo al cursor. Solo se mueve
    un elemento (el "escenario"); cada pieza está a otra profundidad (translateZ), así que el
    giro produce el paralaje sin animar cada pieza por separado.
*/

// Ángulo de reposo: vista desde arriba y desde la izquierda, como una foto de producto.
const GIRO_BASE = { x: -14, y: -24 };
// Grados máximos que agrega el cursor en cada eje.
const GIRO_CURSOR = { x: 4, y: 6 };
/*
    Resorte lento y sin rebote, equivalente a { duration: 1.1, bounce: 0 } (estilo Apple):
    la escena acompaña al cursor con calma para no competir con las animaciones de las pantallas.
*/
const RESORTE = { rigidez: 33, amortiguacion: 11.4 };
const REPOSO = 0.01;

const prefiereMenosMovimiento = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
const tieneMouse = () => window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;

const transformarEscenario = (giro) => `rotateX(${GIRO_BASE.x + giro.x}deg) rotateY(${GIRO_BASE.y + giro.y}deg)`;

/*
    Sigue al cursor en toda la ventana (no solo encima de la ilustración) con un resorte, así el
    giro conserva la velocidad si el cursor cambia de dirección. El bucle de animación se detiene
    cuando el resorte llega al reposo, cuando la escena sale de pantalla y en pantallas táctiles
    o con "reducir movimiento".
*/
const useGiroConCursor = (contenedor, escenario) => {
    useEffect(() => {
        const elementoContenedor = contenedor.current;
        const elementoEscenario = escenario.current;
        if (!elementoContenedor || !elementoEscenario || prefiereMenosMovimiento() || !tieneMouse()) return undefined;

        const objetivo = { x: 0, y: 0 };
        const giro = { x: 0, y: 0 };
        const velocidad = { x: 0, y: 0 };
        let cuadro = 0;
        let anterior = 0;
        let visible = true;

        const paso = (ahora) => {
            // Limitar el salto de tiempo evita un tirón al volver de otra pestaña.
            const dt = Math.min((ahora - anterior) / 1000, 1 / 30);
            anterior = ahora;

            for (const eje of ["x", "y"]) {
                const fuerza = RESORTE.rigidez * (objetivo[eje] - giro[eje]) - RESORTE.amortiguacion * velocidad[eje];
                velocidad[eje] += fuerza * dt;
                giro[eje] += velocidad[eje] * dt;
            }
            elementoEscenario.style.transform = transformarEscenario(giro);

            const enReposo = ["x", "y"].every((eje) => Math.abs(objetivo[eje] - giro[eje]) < REPOSO && Math.abs(velocidad[eje]) < REPOSO);
            cuadro = enReposo ? 0 : requestAnimationFrame(paso);
        };

        const animar = () => {
            if (cuadro || !visible) return;
            anterior = performance.now();
            cuadro = requestAnimationFrame(paso);
        };

        const alMoverCursor = (evento) => {
            const caja = elementoContenedor.getBoundingClientRect();
            // -1 a 1 respecto al centro de la escena, limitado para que el giro no se dispare lejos de ella.
            const relativoX = Math.max(-1, Math.min(1, (evento.clientX - (caja.left + caja.width / 2)) / (window.innerWidth / 2)));
            const relativoY = Math.max(-1, Math.min(1, (evento.clientY - (caja.top + caja.height / 2)) / (window.innerHeight / 2)));
            objetivo.x = -relativoY * GIRO_CURSOR.x;
            objetivo.y = relativoX * GIRO_CURSOR.y;
            animar();
        };

        const alSalirCursor = () => {
            objetivo.x = 0;
            objetivo.y = 0;
            animar();
        };

        const observador = new IntersectionObserver(([entrada]) => {
            visible = entrada.isIntersecting;
            if (visible) animar();
            else {
                cancelAnimationFrame(cuadro);
                cuadro = 0;
            }
        });
        observador.observe(elementoContenedor);

        window.addEventListener("pointermove", alMoverCursor, { passive: true });
        document.documentElement.addEventListener("pointerleave", alSalirCursor);
        return () => {
            cancelAnimationFrame(cuadro);
            observador.disconnect();
            window.removeEventListener("pointermove", alMoverCursor);
            document.documentElement.removeEventListener("pointerleave", alSalirCursor);
        };
    }, [contenedor, escenario]);
};

/*
    La escena está "activa" si se ve en pantalla y el usuario no pidió reducir el movimiento.
    Fuera de pantalla también se pausan las animaciones CSS (ver [data-escena-pausada] en principal.css).
*/
const useEscenaActiva = (contenedor) => {
    const [visible, setVisible] = useState(false);
    const [reducir, setReducir] = useState(prefiereMenosMovimiento);

    useEffect(() => {
        const consulta = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        if (!consulta) return undefined;
        const actualizar = () => setReducir(consulta.matches);
        consulta.addEventListener("change", actualizar);
        return () => consulta.removeEventListener("change", actualizar);
    }, []);

    useEffect(() => {
        const elemento = contenedor.current;
        if (!elemento || !("IntersectionObserver" in window)) return undefined;
        const observador = new IntersectionObserver(([entrada]) => {
            elemento.toggleAttribute("data-escena-pausada", !entrada.isIntersecting);
            setVisible(entrada.isIntersecting);
        });
        observador.observe(elemento);
        return () => observador.disconnect();
    }, [contenedor]);

    return visible && !reducir;
};

const azar = (minimo, maximo) => minimo + Math.random() * (maximo - minimo);

/*
    Cambia de vista tras un tiempo al azar dentro del rango de cada una; "siguiente" elige la
    próxima (puede ser al azar). "entradas" cuenta cuántas veces se entró a cada vista: sirve de
    key para que la vista empiece de cero al volver, sin reiniciarse mientras se desvanece.
*/
const useVistaAleatoria = (activa, duraciones, siguiente) => {
    const [estado, setEstado] = useState(() => ({
        vista: Object.keys(duraciones)[0],
        entradas: Object.fromEntries(Object.keys(duraciones).map((vista) => [vista, 0])),
    }));

    useEffect(() => {
        if (!activa) return undefined;
        const [minimo, maximo] = duraciones[estado.vista];
        const temporizador = setTimeout(() => {
            setEstado(({ vista, entradas }) => {
                const proxima = siguiente(vista);
                return { vista: proxima, entradas: { ...entradas, [proxima]: entradas[proxima] + 1 } };
            });
        }, azar(minimo, maximo));
        return () => clearTimeout(temporizador);
    }, [activa, estado, duraciones, siguiente]);

    return estado;
};

/* Avanza de 0 a total - 1, un paso cada "ms", mientras la escena está activa. */
const useSecuencia = (activa, total, ms) => {
    const [paso, setPaso] = useState(0);

    useEffect(() => {
        if (!activa || paso >= total - 1) return undefined;
        const temporizador = setTimeout(() => setPaso((actual) => actual + 1), ms);
        return () => clearTimeout(temporizador);
    }, [activa, paso, total, ms]);

    return paso;
};

/* Capa de una pantalla que se cruza con las demás: todas ocupan la misma celda de la cuadrícula. */
const Vista = ({ visible, className = "", children }) => (
    <div className={`col-start-1 row-start-1 min-h-0 transition-[opacity,translate] duration-500 ease-fuerte ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[0.8cqw] opacity-0"} ${className}`}>
        {children}
    </div>
);

/*
    Canto de un equipo: la cara lateral que le da grosor. Se dobla 90° desde el borde indicado
    hacia atrás de la pieza (o hacia abajo, en una pieza acostada como la base del portátil).
    Solo se dibujan los cantos que la cámara alcanza a ver: arriba, derecha y frente.
    "inset" recorta el canto en las esquinas redondeadas para que no sobresalga.
*/
const CANTOS = {
    arriba: { posicion: "bottom-full", origen: "bottom", giro: "rotateX(90deg)", medida: "height", eje: "horizontal" },
    derecha: { posicion: "left-full", origen: "left", giro: "rotateY(90deg)", medida: "width", eje: "vertical" },
    frente: { posicion: "top-full", origen: "top", giro: "rotateX(-90deg)", medida: "height", eje: "horizontal" },
};

const Canto = ({ lado, grosor, inset = 0, className = "" }) => {
    const { posicion, origen, giro, medida, eje } = CANTOS[lado];
    const recorte = eje === "horizontal"
        ? { left: `${inset}cqw`, width: `calc(100% - ${inset * 2}cqw)` }
        : { top: `${inset}cqw`, height: `calc(100% - ${inset * 2}cqw)` };
    return <span aria-hidden="true" className={`absolute ${posicion} ${className}`} style={{ [medida]: `${grosor}cqw`, transformOrigin: origen, transform: giro, ...recorte }} />;
};

/* Reflejo diagonal sobre el vidrio de la pantalla. */
const Reflejo = () => (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/9%)_0%,rgb(255_255_255/3%)_30%,transparent_45%)]" />
);

/* Pieza ubicada en la escena: posición en % y profundidad en cqw. */
const Pieza = ({ className = "", z = 0, children }) => (
    <div className={`absolute [transform-style:preserve-3d] ${className}`} style={{ transform: `translateZ(${z}cqw)` }}>
        {children}
    </div>
);

/* Etiqueta de rol. El flotado va en la propiedad "translate" para no pisar la profundidad del transform. */
const EtiquetaRol = ({ children, retraso = 0 }) => (
    <span
        className="escena-flotar block rounded-[0.8cqw] border border-sky-300/40 bg-slate-900/85 px-[1.6cqw] py-[0.8cqw] text-[1.7cqw] font-bold tracking-[0.14em] text-sky-100 uppercase shadow-[0_0_3cqw_rgb(0_170_255/35%)]"
        style={{ animationDelay: `${retraso}ms` }}
    >
        {children}
    </span>
);

/* ---------- Administrador: el gráfico de ingresos cambia al azar entre barras, área y circular. ---------- */

const GRAFICOS = ["barras", "area", "circular"];
const NOMBRE_GRAFICO = { barras: "Barras", area: "Área", circular: "Circular" };
const DURACION_GRAFICOS = { barras: [4500, 7500], area: [4500, 7500], circular: [4500, 7500] };
// Cualquiera de los otros dos, al azar.
const otroGrafico = (actual) => {
    const opciones = GRAFICOS.filter((grafico) => grafico !== actual);
    return opciones[Math.floor(Math.random() * opciones.length)];
};

const BARRAS_DASHBOARD = [38, 55, 46, 70, 62, 84, 74];
const PUNTOS_AREA = [30, 42, 36, 55, 49, 68, 62, 80];
const SECTORES = [
    { nombre: "Reparaciones", valor: 58, color: "var(--grafico-1)" },
    { nombre: "Tienda", valor: 30, color: "var(--grafico-2)" },
    { nombre: "Otros", valor: 12, color: "var(--grafico-3)" },
].map((sector, indice, lista) => ({
    ...sector,
    // Cada sector empieza donde termina el anterior.
    desplazamiento: -lista.slice(0, indice).reduce((suma, anterior) => suma + anterior.valor, 0),
}));

const GraficoBarras = () => (
    <div className="flex h-full items-end gap-[0.7cqw]">
        {BARRAS_DASHBOARD.map((altura, indice) => (
            <span key={indice} className="escena-barra flex-1 origin-bottom rounded-t-[0.3cqw] bg-marca/80" style={{ height: `${altura}%`, animationDelay: `${indice * 180}ms` }} />
        ))}
    </div>
);

const GraficoArea = () => {
    const id = useId();
    const paso = 100 / (PUNTOS_AREA.length - 1);
    const linea = PUNTOS_AREA.map((valor, indice) => `${indice === 0 ? "M" : "L"}${indice * paso},${100 - valor}`).join(" ");
    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
                <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--grafico-1)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="var(--grafico-1)" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${linea} L100,100 L0,100 Z`} fill={`url(#${id})`} className="escena-relleno" />
            <path d={linea} pathLength="1" fill="none" stroke="var(--grafico-1)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="escena-trazo" />
        </svg>
    );
};

/* Dona con circunferencia 100: el largo de cada trazo es directamente su porcentaje. */
const GraficoCircular = () => (
        <div className="flex h-full items-center gap-[1.4cqw]">
            <svg viewBox="0 0 42 42" className="h-full -rotate-90">
                <circle cx="21" cy="21" r="15.9155" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-800" />
                {SECTORES.map(({ nombre, valor, color, desplazamiento }, indice) => (
                    <circle key={nombre} cx="21" cy="21" r="15.9155" fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${valor} ${100 - valor}`} strokeDashoffset={desplazamiento} className="escena-sector" style={{ animationDelay: `${indice * 150}ms` }} />
                ))}
            </svg>
            <ul className="space-y-[0.5cqw]">
                {SECTORES.map(({ nombre, valor, color }) => (
                    <li key={nombre} className="flex items-center gap-[0.5cqw]">
                        <span className="size-[0.8cqw] rounded-full" style={{ background: color }} /> {nombre}
                        <span className="font-semibold text-white tabular-nums">{valor} %</span>
                    </li>
                ))}
            </ul>
        </div>
);

const PantallaAdministrador = ({ activa }) => {
    const { vista, entradas } = useVistaAleatoria(activa, DURACION_GRAFICOS, otroGrafico);

    return (
        <div className="flex h-full bg-fondo text-[1.05cqw] leading-tight text-slate-300">
            <div className="w-[17%] space-y-[0.9cqw] border-r border-white/10 bg-superficie p-[1cqw]">
                <p className="font-bold text-white">Tecno<span className="text-marca">House</span></p>
                {["Dashboard", "Servicios", "Técnicos", "Clientes", "Tienda", "Inventario"].map((texto, indice) => (
                    <p key={texto} className={`rounded-[0.4cqw] px-[0.6cqw] py-[0.3cqw] ${indice === 0 ? "bg-marca/15 text-marca" : "text-slate-500"}`}>{texto}</p>
                ))}
            </div>
            <div className="flex flex-1 flex-col gap-[1cqw] p-[1.5cqw]">
                <p className="flex items-center justify-between text-[1.6cqw] font-bold text-white">
                    Dashboard
                    <span className="flex items-center gap-[0.5cqw] text-[1.05cqw] font-medium text-slate-400">
                        <span className="escena-latido size-[0.7cqw] rounded-full bg-emerald-400" /> En vivo
                    </span>
                </p>
                <div className="rounded-[0.6cqw] border border-borde bg-tarjeta p-[1cqw]">
                    <p className="text-slate-400">Ingresos totales</p>
                    <p className="mt-[0.3cqw] text-[2.2cqw] font-extrabold text-white tabular-nums">$ 2.382.000</p>
                    <p className="mt-[0.2cqw] flex items-center gap-[0.4cqw] text-emerald-400"><TrendingUp className="size-[1.2cqw]" /> +18 % este mes</p>
                </div>
                <div className="grid grid-cols-3 gap-[0.8cqw]">
                    {[["Servicios", "18"], ["Técnicos", "5"], ["Calificación", "4,8"]].map(([titulo, valor]) => (
                        <div key={titulo} className="rounded-[0.6cqw] border border-borde bg-tarjeta p-[0.8cqw]">
                            <p className="text-slate-400">{titulo}</p>
                            <p className="text-[1.6cqw] font-bold text-white">{valor}</p>
                        </div>
                    ))}
                </div>
                {/* Visor de ingresos: pestañas como en el panel real y el gráfico activo encima de los otros. */}
                <div className="flex min-h-0 flex-1 flex-col rounded-[0.6cqw] border border-borde bg-tarjeta p-[0.8cqw]">
                    <div className="mb-[0.7cqw] flex items-center justify-between">
                        <p className="text-slate-400">Ingresos por mes</p>
                        <div className="flex gap-[0.3cqw]">
                            {GRAFICOS.map((grafico) => (
                                <span key={grafico} className={`rounded-[0.3cqw] px-[0.5cqw] py-[0.15cqw] transition-colors duration-300 ${grafico === vista ? "bg-marca/15 text-marca" : "text-slate-500"}`}>{NOMBRE_GRAFICO[grafico]}</span>
                            ))}
                        </div>
                    </div>
                    <div className="grid min-h-0 flex-1">
                        <Vista visible={vista === "barras"}><GraficoBarras key={entradas.barras} /></Vista>
                        <Vista visible={vista === "area"}><GraficoArea key={entradas.area} /></Vista>
                        <Vista visible={vista === "circular"}><GraficoCircular key={entradas.circular} /></Vista>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------- Técnico: lista de pendientes y, de vez en cuando, un diagnóstico en curso. ---------- */

const DURACION_TECNICO = { lista: [5000, 10000], diagnostico: [7500, 7500] };
const alternarTecnico = (actual) => (actual === "lista" ? "diagnostico" : "lista");

const SOLICITUDES_TECNICO = [
    ["Portátil HP", "No enciende"],
    ["iPhone 12", "Pantalla rota"],
    ["PS5", "Se recalienta"],
];

const ListaSolicitudes = () => (
    <div className="space-y-[0.9cqw]">
        <p className="text-[1.5cqw] font-bold text-white">Solicitudes pendientes</p>
        {SOLICITUDES_TECNICO.map(([equipo, falla], indice) => (
            <div key={equipo} className="relative flex items-center justify-between gap-[0.8cqw] rounded-[0.6cqw] border border-borde bg-tarjeta p-[0.8cqw]">
                {/* Cada fila se ilumina en su tercio del ciclo de 6 s: parece que el técnico las va revisando. */}
                <span className="escena-resaltar absolute -inset-px rounded-[0.6cqw] border border-marca/70 bg-marca/10 opacity-0" style={{ animationDelay: `${indice * 2}s` }} />
                <div className="flex items-center gap-[0.8cqw]">
                    <span className="flex size-[2.4cqw] items-center justify-center rounded-full bg-marca/15 text-marca"><Wrench className="size-[1.2cqw]" /></span>
                    <span>
                        <span className="block font-semibold text-white">{equipo}</span>
                        <span className="text-slate-500">{falla}</span>
                    </span>
                </div>
                <span className={`rounded-[0.4cqw] px-[0.8cqw] py-[0.35cqw] font-semibold ${indice === 0 ? "bg-marca text-sobre-marca" : "border border-slate-600 text-slate-300"}`}>Tomar</span>
            </div>
        ))}
    </div>
);

// Componentes que revisa el diagnóstico; el último es la falla.
const PRUEBAS = ["Batería", "Cargador", "Puerto de carga"];
const PASOS_DIAGNOSTICO = PRUEBAS.length + 3;

const EstadoPrueba = ({ estado }) => {
    if (estado === "revisando") return <span className="size-[1.4cqw] animate-spin rounded-full border-[0.25cqw] border-marca/25 border-t-marca" />;
    if (estado === "falla") return <TriangleAlert className="size-[1.5cqw] text-amber-400" />;
    if (estado === "bien") return <Check className="size-[1.5cqw] text-emerald-400" strokeWidth={3} />;
    return <span className="size-[1.4cqw] rounded-full border-[0.25cqw] border-slate-700" />;
};

/*
    Pasos: 0–2 revisa cada componente (el anterior queda bien), 3 marca la falla,
    4 muestra el resultado y 5 lo guarda.
*/
const Diagnostico = ({ activa }) => {
    const paso = useSecuencia(activa, PASOS_DIAGNOSTICO, 900);
    const estadoDe = (indice) => {
        if (paso < indice) return "pendiente";
        if (paso === indice) return "revisando";
        return indice === PRUEBAS.length - 1 ? "falla" : "bien";
    };

    return (
        <div className="space-y-[0.8cqw]">
            <div className="flex items-center justify-between">
                <p className="text-[1.5cqw] font-bold text-white">Diagnóstico</p>
                <span className="rounded-full border border-slate-600 px-[0.7cqw] py-[0.15cqw] text-slate-400">Portátil HP</span>
            </div>
            {PRUEBAS.map((prueba, indice) => (
                <div key={prueba} className="flex items-center justify-between rounded-[0.6cqw] border border-borde bg-tarjeta px-[0.9cqw] py-[0.6cqw]">
                    <span className={estadoDe(indice) === "pendiente" ? "text-slate-500" : "text-white"}>{prueba}</span>
                    <EstadoPrueba estado={estadoDe(indice)} />
                </div>
            ))}
            {paso >= PRUEBAS.length + 1 && (
                <div className="escena-entrar flex items-center justify-between gap-[0.8cqw] rounded-[0.6cqw] border border-amber-400/40 bg-amber-400/10 px-[0.9cqw] py-[0.6cqw]">
                    <span className="text-amber-200">Falla: puerto de carga</span>
                    <span className={`rounded-[0.4cqw] px-[0.8cqw] py-[0.35cqw] font-semibold transition-colors duration-300 ${paso >= PRUEBAS.length + 2 ? "bg-emerald-500 text-sobre-marca" : "bg-marca text-sobre-marca"}`}>
                        {paso >= PRUEBAS.length + 2 ? "Guardado ✓" : "Guardar"}
                    </span>
                </div>
            )}
        </div>
    );
};

const PantallaTecnico = ({ activa }) => {
    const { vista, entradas } = useVistaAleatoria(activa, DURACION_TECNICO, alternarTecnico);

    return (
        <div className="grid h-full bg-fondo p-[1.4cqw] text-[1.05cqw] leading-tight text-slate-300">
            <Vista visible={vista === "lista"}><ListaSolicitudes /></Vista>
            <Vista visible={vista === "diagnostico"}><Diagnostico key={entradas.diagnostico} activa={activa && vista === "diagnostico"} /></Vista>
        </div>
    );
};

/* ---------- Cliente: seguimiento y, de vez en cuando, un mensaje al técnico. ---------- */

const DURACION_CLIENTE = { seguimiento: [6000, 11000], chat: [7500, 7500] };
const alternarCliente = (actual) => (actual === "seguimiento" ? "chat" : "seguimiento");
const PASOS_CHAT = 5;

const Seguimiento = () => (
    <div className="flex h-full flex-col gap-[1.1cqw]">
        <p className="text-[1.5cqw] font-bold text-white">Hola, Andrea</p>
        <div className="rounded-[0.8cqw] border border-borde bg-tarjeta p-[1cqw]">
            <p className="font-semibold text-white">Portátil HP</p>
            <p className="flex items-center gap-[0.5cqw] text-marca">
                <span className="escena-latido size-[0.7cqw] rounded-full bg-marca" /> En reparación
            </p>
            <span className="mt-[0.8cqw] block h-[0.6cqw] overflow-hidden rounded-full bg-slate-800">
                <span className="escena-progreso block h-full w-full origin-left scale-x-70 rounded-full bg-marca" />
            </span>
        </div>
        <p className="flex items-center gap-[0.5cqw] text-emerald-400"><Check className="size-[1.2cqw]" /> Cotización aprobada</p>
        <p className="flex items-center gap-[0.3cqw] text-amber-300">
            {[1, 2, 3, 4, 5].map((numero) => <Star key={numero} className="size-[1.2cqw] fill-current" />)}
        </p>
        <span className="mt-auto rounded-[0.6cqw] bg-marca py-[0.7cqw] text-center font-semibold text-sobre-marca">Ver detalle</span>
    </div>
);

const Burbuja = ({ propia = false, children }) => (
    <p className={`escena-entrar max-w-[85%] rounded-[0.9cqw] px-[0.8cqw] py-[0.6cqw] ${propia ? "self-end rounded-br-[0.2cqw] bg-marca text-sobre-marca" : "rounded-bl-[0.2cqw] bg-slate-800 text-slate-100"}`}>
        {children}
    </p>
);

/* Pasos: 0 abre el chat, 1 escribe, 2 envía, 3 el técnico escribe, 4 responde. */
const ChatTecnico = ({ activa }) => {
    const paso = useSecuencia(activa, PASOS_CHAT, 1100);

    return (
        <div className="flex h-full flex-col">
            <div className="-mx-[1.3cqw] flex items-center gap-[0.5cqw] border-b border-white/10 px-[1cqw] pb-[0.8cqw]">
                <ChevronLeft className="size-[1.4cqw] text-marca" />
                <span className="flex size-[2cqw] items-center justify-center rounded-full bg-marca/20 text-marca"><Wrench className="size-[1cqw]" /></span>
                <span>
                    <span className="block font-semibold text-white">Técnico</span>
                    <span className="flex items-center gap-[0.3cqw] text-slate-400"><span className="size-[0.5cqw] rounded-full bg-emerald-400" /> en línea</span>
                </span>
            </div>
            <div className="flex flex-1 flex-col justify-end gap-[0.6cqw] py-[0.8cqw]">
                <Burbuja>Encontramos la falla en el puerto de carga.</Burbuja>
                {paso >= 2 && <Burbuja propia>¿Cuánto tarda?</Burbuja>}
                {paso === 3 && (
                    <span className="escena-entrar flex w-fit gap-[0.3cqw] rounded-[0.9cqw] rounded-bl-[0.2cqw] bg-slate-800 px-[0.8cqw] py-[0.8cqw]">
                        {[0, 150, 300].map((retraso) => <span key={retraso} className="punto-escribiendo size-[0.5cqw] rounded-full bg-slate-400" style={{ animationDelay: `${retraso}ms` }} />)}
                    </span>
                )}
                {paso >= 4 && <Burbuja>Unos 2 días. Te aviso al terminar.</Burbuja>}
            </div>
            {/* Barra para escribir: en el paso 1 el texto aparece letra por letra. */}
            <div className="flex items-center justify-between gap-[0.5cqw] rounded-full border border-slate-700 py-[0.4cqw] pr-[0.4cqw] pl-[0.9cqw]">
                {paso === 1 ? <span className="escena-escribir truncate text-white">¿Cuánto tarda?</span> : <span className="truncate text-slate-500">Escribe un mensaje</span>}
                <span className={`size-[1.6cqw] shrink-0 rounded-full bg-marca transition-[scale] duration-200 ease-fuerte ${paso === 2 ? "scale-75" : "scale-100"}`} />
            </div>
        </div>
    );
};

const PantallaCliente = ({ activa }) => {
    const { vista, entradas } = useVistaAleatoria(activa, DURACION_CLIENTE, alternarCliente);

    return (
        <div className="grid h-full bg-fondo px-[1.3cqw] pt-[3.6cqw] pb-[1.3cqw] text-[1.05cqw] leading-tight text-slate-300">
            <Vista visible={vista === "seguimiento"}><Seguimiento /></Vista>
            <Vista visible={vista === "chat"}><ChatTecnico key={entradas.chat} activa={activa && vista === "chat"} /></Vista>
        </div>
    );
};

const TECLAS = Array.from({ length: 52 }, (_, indice) => indice);

const EscenaDispositivos = () => {
    const contenedor = useRef(null);
    const escenario = useRef(null);
    useGiroConCursor(contenedor, escenario);
    const activa = useEscenaActiva(contenedor);

    return (
        <div
            ref={contenedor}
            role="img"
            aria-label="Ilustración: TecnoHouse en un monitor con el panel del administrador, un portátil con las solicitudes del técnico y un celular con el seguimiento del cliente"
            className="relative mx-auto mb-[8%] aspect-[10/9] w-[88%] max-w-2xl select-none sm:w-full [container-type:inline-size] [perspective:170cqw]"
        >
            <div aria-hidden="true" className="absolute inset-[8%] -z-10 rounded-full bg-marca/25 blur-3xl" />

            <div ref={escenario} className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: transformarEscenario({ x: 0, y: 0 }) }}>
                {/* Sombra en el piso, bajo los tres equipos. */}
                <div className="absolute top-[100%] left-[2%] h-[40cqw] w-[96%] origin-top [transform:rotateX(90deg)] rounded-[50%] bg-[radial-gradient(closest-side,rgb(0_0_0/55%),transparent)]" />

                {/* Monitor del administrador (al fondo). */}
                <Pieza className="top-[4%] left-[30%] w-[66%]" z={-14}>
                    <div className="relative rounded-[1cqw] border border-slate-600 bg-gradient-to-b from-slate-800 to-slate-900 p-[0.9cqw] shadow-[0_3cqw_6cqw_rgb(0_0_0/45%),inset_0_1px_0_rgb(255_255_255/12%)] [transform-style:preserve-3d]">
                        <Canto lado="arriba" grosor={1.8} inset={1} className="bg-gradient-to-b from-slate-500 to-slate-600" />
                        <Canto lado="derecha" grosor={1.8} inset={1} className="bg-gradient-to-r from-slate-600 to-slate-800" />
                        <div className="relative aspect-[16/10] overflow-hidden rounded-[0.5cqw] ring-1 ring-black/60">
                            <PantallaAdministrador activa={activa} />
                            <Reflejo />
                        </div>
                    </div>
                    {/* Brazo detrás de la pantalla y pie apoyado en el piso. */}
                    <div className="relative mx-auto h-[9cqw] w-[9%] bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 [transform-style:preserve-3d]" style={{ transform: "translateZ(-3cqw)" }}>
                        <Canto lado="derecha" grosor={2.4} className="bg-slate-700" />
                    </div>
                    <div className="relative mx-auto h-[14cqw] w-[38%] origin-top rounded-[1.4cqw] bg-gradient-to-b from-slate-500 to-slate-600 [transform-style:preserve-3d]" style={{ transform: "translateZ(-10cqw) rotateX(90deg)" }}>
                        <Canto lado="frente" grosor={0.8} inset={1.4} className="bg-slate-700" />
                        <Canto lado="derecha" grosor={0.8} inset={1.4} className="bg-slate-800" />
                    </div>
                </Pieza>

                {/* Portátil del técnico (adelante, a la izquierda). */}
                <Pieza className="top-[40%] left-[1%] w-[50%]" z={10}>
                    {/* Tapa inclinada unos grados hacia atrás desde la bisagra, como un portátil abierto de verdad. */}
                    <div className="relative origin-bottom rounded-t-[1cqw] border border-slate-600 bg-slate-900 p-[0.8cqw] shadow-[inset_0_1px_0_rgb(255_255_255/12%)] [transform-style:preserve-3d] [transform:rotateX(8deg)]">
                        <Canto lado="arriba" grosor={0.9} inset={1} className="bg-gradient-to-b from-slate-500 to-slate-600" />
                        <Canto lado="derecha" grosor={0.9} inset={1} className="bg-gradient-to-r from-slate-600 to-slate-700" />
                        <div className="relative aspect-[16/10] overflow-hidden rounded-[0.4cqw] ring-1 ring-black/60">
                            <PantallaTecnico activa={activa} />
                            <Reflejo />
                        </div>
                    </div>
                    {/* Base con teclado: plana, sale hacia el frente desde la bisagra; el canto le da el grosor. */}
                    <div className="absolute top-full -left-[3%] w-[106%] origin-top rounded-b-[1.6cqw] border border-slate-500 bg-gradient-to-b from-slate-600 to-slate-700 p-[1.6cqw] shadow-[inset_0_1px_0_rgb(255_255_255/15%)] [transform-style:preserve-3d] [transform:rotateX(90deg)]">
                        <Canto lado="frente" grosor={1.3} inset={1.6} className="bg-gradient-to-b from-slate-500 to-slate-700" />
                        <Canto lado="derecha" grosor={1.3} inset={1.6} className="bg-gradient-to-r from-slate-600 to-slate-800" />
                        {/* Sombra de contacto bajo la base. */}
                        <span className="absolute -inset-[8%] -z-10 bg-[radial-gradient(closest-side,rgb(0_0_0/60%),transparent)]" style={{ transform: "translateZ(-1.5cqw)" }} />
                        <div className="grid grid-cols-13 gap-[0.4cqw] rounded-[0.6cqw] bg-slate-800/70 p-[0.5cqw] shadow-[inset_0_0.3cqw_0.6cqw_rgb(0_0_0/45%)]">
                            {TECLAS.map((tecla) => <span key={tecla} className="aspect-square rounded-[0.25cqw] bg-slate-900 shadow-[inset_0_1px_0_rgb(255_255_255/10%)]" />)}
                        </div>
                        <div className="mx-auto mt-[1.4cqw] h-[9cqw] w-[38%] rounded-[0.8cqw] border border-slate-500/70 bg-slate-600/60 shadow-[inset_0_0.2cqw_0.5cqw_rgb(0_0_0/25%)]" />
                    </div>
                </Pieza>

                {/* Celular del cliente (adelante, a la derecha). */}
                <Pieza className="top-[50%] left-[74%] w-[19%]" z={24}>
                    <div className="relative aspect-[9/19] rounded-[2.4cqw] border border-slate-500 bg-gradient-to-b from-slate-700 to-slate-900 p-[0.6cqw] shadow-[0_3cqw_5cqw_rgb(0_0_0/50%),inset_0_1px_0_rgb(255_255_255/18%)] [transform-style:preserve-3d]">
                        <Canto lado="arriba" grosor={1.2} inset={2.4} className="bg-gradient-to-b from-slate-400 to-slate-600" />
                        <Canto lado="derecha" grosor={1.2} inset={2.4} className="bg-gradient-to-r from-slate-500 to-slate-700" />
                        {/* Botones laterales sobre el canto derecho. */}
                        <span className="absolute top-[26%] left-full h-[12%] w-[0.5cqw] rounded-r-[0.3cqw] bg-slate-500" style={{ transform: "translateZ(-0.35cqw) rotateY(90deg)", transformOrigin: "left" }} />
                        <div className="relative h-full overflow-hidden rounded-[1.9cqw] ring-1 ring-black/60">
                            <span className="absolute inset-x-0 top-[0.9cqw] z-10 mx-auto h-[1.3cqw] w-[32%] rounded-full bg-black" />
                            <PantallaCliente activa={activa} />
                            <Reflejo />
                        </div>
                    </div>
                </Pieza>

                {/* Íconos decorativos flotando entre los equipos. */}
                <Pieza className="top-[16%] left-[10%]" z={4}>
                    <span className="escena-flotar flex size-[9cqw] items-center justify-center rounded-[1.4cqw] border border-sky-300/25 bg-slate-900/70 text-marca" style={{ animationDelay: "400ms" }}>
                        <BarChart3 className="size-[5cqw]" strokeWidth={1.5} />
                    </span>
                </Pieza>
                <Pieza className="top-[30%] left-[22%] text-slate-500" z={-4}>
                    <Cog className="escena-flotar size-[8cqw]" strokeWidth={1.3} style={{ animationDelay: "900ms" }} />
                </Pieza>
                <Pieza className="top-[46%] left-[90%] text-slate-500" z={6}>
                    <Cog className="escena-flotar size-[6cqw]" strokeWidth={1.3} style={{ animationDelay: "1500ms" }} />
                </Pieza>

                {/* Etiquetas de rol: las más cercanas a la cámara, así se mueven más con el cursor. */}
                <Pieza className="-top-[5%] left-[70%]" z={30}><EtiquetaRol>Administrador</EtiquetaRol></Pieza>
                <Pieza className="top-[58%] left-[2%]" z={36}><EtiquetaRol retraso={700}>Técnico</EtiquetaRol></Pieza>
                <Pieza className="top-[87%] left-[80%]" z={44}><EtiquetaRol retraso={1400}>Cliente</EtiquetaRol></Pieza>
            </div>
        </div>
    );
};

export default EscenaDispositivos;
