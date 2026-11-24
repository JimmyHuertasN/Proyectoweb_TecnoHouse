import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    BellRing,
    BriefcaseBusiness,
    ChartNoAxesCombined,
    Check,
    FileText,
    LayoutDashboard,
    MessageCircle,
    MessagesSquare,
    NotebookPen,
    PackageSearch,
    Phone,
    PhoneCall,
    Store,
    UserRound,
    UsersRound,
} from "lucide-react";
import { obtenerProductos } from "../api/productos.js";
import EncabezadoSitio from "../componentes/EncabezadoSitio.jsx";
import ImagenProducto from "../componentes/ImagenProducto.jsx";
import PiePagina from "../componentes/PiePagina.jsx";
import EjemploSeguimiento from "../componentes/portada/EjemploSeguimiento.jsx";
import EscenaDispositivos from "../componentes/portada/EscenaDispositivos.jsx";
import { useSesion } from "../contexto/ContextoSesion.js";
import { CATEGORIAS_PRODUCTO } from "../datos/categoriasProductos.js";
import { CONTACTO } from "../datos/contacto.js";
import { SERVICIOS } from "../datos/servicios.js";
import useAnimacionEntrada from "../hooks/useAnimacionEntrada.js";
import { formatearPesos } from "../utilidades/formato.js";
import { rutaInicio, rutaSolicitarReparacion } from "../utilidades/rutas.js";
import { enlaceWhatsApp, whatsappConfigurado } from "../utilidades/whatsapp.js";

const MAXIMO_PRODUCTOS = 4;

/*
    La portada le habla al dueño de un taller de reparaciones (público de Expo Software).
    El resto del sitio (reparaciones, tienda, paneles) funciona como la demo en vivo de un taller real.
*/

/* Problemas del día a día de un taller y cómo los resuelve la plataforma. */
const PROBLEMAS = [
    {
        icono: PhoneCall,
        problema: "Clientes llamando a preguntar “¿ya está mi equipo?”",
        solucion: "Cada cliente ve el estado de su reparación en línea y recibe notificaciones en cada cambio.",
    },
    {
        icono: NotebookPen,
        problema: "Órdenes en cuadernos y cotizaciones por mensaje suelto",
        solucion: "Solicitud, diagnóstico y cotización quedan registrados; el cliente la aprueba desde su cuenta y se descarga en PDF.",
    },
    {
        icono: UsersRound,
        problema: "No saber qué técnico tiene cada equipo",
        solucion: "Los técnicos toman solicitudes y el administrador ve y reasigna todos los servicios desde un panel.",
    },
    {
        icono: PackageSearch,
        problema: "Repuestos y ventas sin control de inventario",
        solucion: "Catálogo en línea con stock, pedidos y pago con Wompi, con reportes de la tienda.",
    },
];

/* Un panel para cada persona del negocio: así se reparte el trabajo en la plataforma. */
const PANELES = [
    {
        icono: LayoutDashboard,
        rol: "Dueño o administrador",
        resumen: "La foto completa del negocio.",
        funciones: ["Ingresos de reparaciones y tienda", "Estadísticas por periodo y exportación CSV", "Gestión de técnicos, clientes y gestores", "Reasignación de servicios"],
    },
    {
        icono: BriefcaseBusiness,
        rol: "Técnicos",
        resumen: "Su cola de trabajo, ordenada.",
        funciones: ["Solicitudes pendientes para tomar", "Diagnóstico con las fotos que envía el cliente", "Cotización por ítems", "Actualización del progreso"],
    },
    {
        icono: UserRound,
        rol: "Tus clientes",
        resumen: "Menos llamadas, más confianza.",
        funciones: ["Solicitan la reparación en línea", "Aprueban o rechazan la cotización", "Chatean con el técnico del servicio", "Califican el servicio al terminar"],
    },
    {
        icono: Store,
        rol: "Gestor de tienda",
        resumen: "Repuestos que se venden solos.",
        funciones: ["Productos, imágenes y precios", "Inventario con productos agotados o por agotarse", "Pedidos y sus estados", "Reportes de ventas"],
    },
];

/* Recorrido de una reparación visto desde el taller. */
const FLUJO_TALLER = [
    { titulo: "Llega la solicitud", descripcion: "El cliente registra su equipo, describe la falla y adjunta fotos desde su celular." },
    { titulo: "El técnico diagnostica y cotiza", descripcion: "Registra los hallazgos y arma la cotización por ítems dentro del mismo servicio." },
    { titulo: "El cliente aprueba en línea", descripcion: "Sin llamadas: acepta o rechaza la cotización y pregunta por el chat." },
    { titulo: "Entregas y mides", descripcion: "El cliente recibe el aviso de “listo” y tú ves el ingreso reflejado en el dashboard." },
];

const telefonoConfigurado = CONTACTO.telefono.replace(/\D/g, "").length >= 7;

/*
    Productos con stock para la vista previa de la tienda.
    PENDIENTE BASE: con la columna "destacado", mostrar los que marque el administrador.
*/
const useProductosDestacados = () => {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let vigente = true;
        obtenerProductos()
            .then((lista) => vigente && setProductos(lista.filter((producto) => producto.stock > 0).slice(0, MAXIMO_PRODUCTOS)))
            .catch(() => vigente && setProductos([]))
            .finally(() => vigente && setCargando(false));
        return () => {
            vigente = false;
        };
    }, []);

    return { productos, cargando };
};

const PrimeraSeccion = () => (
    <section className="overflow-hidden border-b border-white/10 bg-gradient-to-b from-superficie to-fondo">
        <div className="contenedor grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[1fr_1.15fr] lg:py-24">
            <div>
                <p className="antetitulo">Software para talleres de reparación</p>
                <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
                    Tu taller organizado. Tus clientes informados.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
                    TecnoHouse reúne en una sola plataforma las solicitudes, los técnicos, las cotizaciones, el seguimiento y la tienda de repuestos de tu negocio. Deja el cuaderno y el teléfono ocupado atrás.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <a href="#demo" className="boton-primario px-6 py-3 text-base">
                        Ver la demo en vivo <ArrowRight size={18} aria-hidden="true" />
                    </a>
                    <a href="#paneles" className="boton-secundario px-6 py-3 text-base">Qué incluye</a>
                </div>

                <div className="mt-10">
                    <p className="text-sm text-slate-400">Pensado para talleres que reparan:</p>
                    <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400" aria-label="Tipos de equipos que maneja la plataforma">
                        {SERVICIOS.map(({ id, icono: Icono, titulo }) => (
                            <li key={id} className="flex items-center gap-2">
                                <Icono size={16} className="text-slate-500" aria-hidden="true" /> {titulo}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <EscenaDispositivos />
        </div>
    </section>
);

/* Problema → solución: lo primero que reconoce el dueño de un taller. */
const SeccionProblemas = () => (
    <section data-animacion-entrada aria-labelledby="titulo-problemas" className="seccion">
        <div className="contenedor grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
                <p className="antetitulo">¿Te suena?</p>
                <h2 id="titulo-problemas" className="titulo-seccion">Lo que frena a un taller de reparaciones</h2>
                <p className="texto-seccion">El trabajo técnico sale bien, pero el tiempo se va en llamadas, papeles y cuentas que no cuadran.</p>
            </div>

            <ul className="grid gap-x-10 sm:grid-cols-2">
                {PROBLEMAS.map(({ icono: Icono, problema, solucion }) => (
                    <li key={problema} className="flex gap-4 border-t border-white/10 py-5">
                        <Icono size={22} strokeWidth={1.8} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />
                        <div>
                            <h3 className="font-semibold text-white">{problema}</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                                <Check size={14} strokeWidth={2.5} className="mr-1.5 -mt-0.5 inline text-marca" aria-hidden="true" />
                                {solucion}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </section>
);

/* Un bloque por rol: muestra que la plataforma cubre a todo el negocio, no solo al cliente. */
const SeccionPaneles = () => (
    <section id="paneles" data-animacion-entrada aria-labelledby="titulo-paneles" className="seccion border-y border-white/10 bg-superficie">
        <div className="contenedor">
            <p className="antetitulo">Qué incluye</p>
            <h2 id="titulo-paneles" className="titulo-seccion">Un panel para cada persona de tu negocio</h2>
            <p className="texto-seccion">Cada rol entra con su propia cuenta y ve solo lo que le corresponde.</p>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {PANELES.map(({ icono: Icono, rol, resumen, funciones }) => (
                    <li key={rol} className="tarjeta">
                        <Icono size={22} strokeWidth={1.8} className="text-marca" aria-hidden="true" />
                        <h3 className="mt-4 font-semibold text-white">{rol}</h3>
                        <p className="mt-1 text-sm text-slate-400">{resumen}</p>
                        <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                            {funciones.map((funcion) => (
                                <li key={funcion} className="flex gap-2 text-sm leading-snug text-slate-300">
                                    <Check size={14} strokeWidth={2.5} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />
                                    {funcion}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    </section>
);

/* El recorrido de una reparación, contado desde el taller. */
const SeccionFlujo = () => (
    <section data-animacion-entrada aria-labelledby="titulo-flujo" className="seccion">
        <div className="contenedor">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
                <div>
                    <p className="antetitulo">Cómo funciona</p>
                    <h2 id="titulo-flujo" className="titulo-seccion">Una reparación de principio a fin, sin perder el hilo</h2>
                    <p className="texto-seccion">Así ve tu cliente el avance de su equipo: cada cambio de estado y cada mensaje del técnico le llega al instante.</p>
                </div>
                <EjemploSeguimiento />
            </div>

            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {FLUJO_TALLER.map((paso, indice) => (
                    <li key={paso.titulo} className="border-t-2 border-slate-700 pt-5">
                        <p className="text-sm font-semibold text-marca">Paso {indice + 1}</p>
                        <h3 className="mt-2 font-semibold text-white">{paso.titulo}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">{paso.descripcion}</p>
                    </li>
                ))}
            </ol>

            <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-400" aria-label="Herramientas incluidas en el flujo">
                <li className="flex items-center gap-2"><BellRing size={16} className="text-slate-500" aria-hidden="true" /> Notificaciones en tiempo real</li>
                <li className="flex items-center gap-2"><MessagesSquare size={16} className="text-slate-500" aria-hidden="true" /> Chat por servicio</li>
                <li className="flex items-center gap-2"><FileText size={16} className="text-slate-500" aria-hidden="true" /> Cotización en PDF</li>
                <li className="flex items-center gap-2"><ChartNoAxesCombined size={16} className="text-slate-500" aria-hidden="true" /> Ingresos y estadísticas</li>
            </ul>
        </div>
    </section>
);

const ProductoPortada = ({ producto }) => (
    <li>
        <Link to={`/tienda/${producto.id}`} className="tarjeta-elevable block overflow-hidden">
            <ImagenProducto url={producto.imagenUrl} contener className="aspect-square w-full bg-slate-900 p-3" />
            <div className="border-t border-borde p-3.5">
                <p className="truncate text-sm font-medium text-white">{producto.nombre}</p>
                <p className="mt-0.5 text-sm text-slate-300">{formatearPesos(producto.precio)}</p>
            </div>
        </Link>
    </li>
);

/* La tienda como ingreso extra del taller. Con productos muestra la demo; sin ellos, las categorías. */
const SeccionTienda = ({ productos, cargando }) => (
    <section data-animacion-entrada aria-labelledby="titulo-tienda" className="seccion border-y border-white/10 bg-superficie">
        <div className="contenedor grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
                <p className="antetitulo">Tienda en línea incluida</p>
                <h2 id="titulo-tienda" className="titulo-seccion">Vende repuestos y accesorios desde el mismo sistema</h2>
                <p className="texto-seccion">Publica tu catálogo, controla el stock y recibe pedidos con pago en línea por Wompi. Las ventas se suman a los reportes del negocio.</p>
                <Link to="/tienda" className="boton-secundario mt-6">
                    Ver la tienda de ejemplo <ArrowRight size={16} aria-hidden="true" />
                </Link>
            </div>

            {cargando && (
                <div role="status" aria-label="Cargando productos" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {[1, 2, 3].map((numero) => <div key={numero} className="aspect-[3/4] animate-pulse rounded-2xl bg-tarjeta" />)}
                </div>
            )}

            {!cargando && productos.length > 0 && (
                <ul className="grid grid-cols-2 content-start gap-4 sm:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]">
                    {productos.map((producto) => <ProductoPortada key={producto.id} producto={producto} />)}
                </ul>
            )}

            {!cargando && productos.length === 0 && (
                <div>
                    <p className="mb-4 text-sm text-slate-400">Categorías que trae la tienda:</p>
                    <ul className="grid gap-x-10 sm:grid-cols-2">
                        {CATEGORIAS_PRODUCTO.map((categoria) => (
                            <li key={categoria} className="border-t border-white/10 py-3.5 font-medium text-slate-200">{categoria}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    </section>
);

/* La demo: TecnoHouse funcionando como un taller real, para recorrerla desde cada rol. */
const SeccionDemo = () => {
    const { usuario } = useSesion();

    return (
        <section id="demo" data-animacion-entrada aria-labelledby="titulo-demo" className="seccion scroll-mt-20">
            <div className="contenedor">
                <div className="grid gap-10 rounded-3xl border border-borde bg-gradient-to-br from-tarjeta to-superficie p-6 sm:p-10 lg:grid-cols-[1fr_1.3fr] lg:gap-14">
                    <div>
                        <p className="antetitulo">Demo en vivo</p>
                        <h2 id="titulo-demo" className="titulo-seccion">Pruébalo como lo usaría tu taller</h2>
                        <p className="texto-seccion">Este sitio es un taller funcionando con TecnoHouse. Recórrelo como cliente o entra al panel para ver el lado del negocio.</p>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            {usuario ? (
                                <Link to={rutaInicio(usuario.rol)} className="boton-primario">Ir a mi panel</Link>
                            ) : (
                                <>
                                    <Link to="/login" className="boton-primario">Entrar al panel</Link>
                                    <Link to="/registro" className="boton-secundario">Crear cuenta de cliente</Link>
                                </>
                            )}
                        </div>
                    </div>

                    <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <li>
                            <Link to={rutaSolicitarReparacion(usuario)} className="enlace font-semibold">
                                Solicitar una reparación <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                            <p className="mt-1 text-sm leading-relaxed text-slate-400">Vive el proceso como lo haría uno de tus clientes.</p>
                        </li>
                        <li>
                            <Link to="/reparaciones" className="enlace font-semibold">
                                Página de servicios <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                            <p className="mt-1 text-sm leading-relaxed text-slate-400">Servicios, técnicos, reseñas y ubicación del taller.</p>
                        </li>
                        <li>
                            <Link to="/tienda" className="enlace font-semibold">
                                Tienda de repuestos <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                            <p className="mt-1 text-sm leading-relaxed text-slate-400">Catálogo, carrito y pago en línea.</p>
                        </li>
                        <li>
                            <Link to="/login" className="enlace font-semibold">
                                Panel del administrador <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                            <p className="mt-1 text-sm leading-relaxed text-slate-400">Dashboard, técnicos, inventario y estadísticas.</p>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    );
};

/* Contacto comercial. Solo muestra los canales que están configurados en datos/contacto.js. */
const SeccionContacto = () => (
    <section data-animacion-entrada aria-labelledby="titulo-contacto" className="seccion border-t border-white/10 bg-superficie">
        <div className="contenedor grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
                <p className="antetitulo">¿Tienes un taller?</p>
                <h2 id="titulo-contacto" className="titulo-seccion">Llevemos TecnoHouse a tu negocio</h2>
                <p className="texto-seccion">Escríbenos y te mostramos cómo se adapta a tus servicios, tus técnicos y tu tienda.</p>
            </div>

            <ul className="grid gap-8 sm:grid-cols-2">
                {whatsappConfigurado && (
                    <li>
                        <MessageCircle size={22} className="text-marca" aria-hidden="true" />
                        <h3 className="mt-3 font-semibold text-white">WhatsApp</h3>
                        <p className="mt-1 text-sm text-slate-400">{CONTACTO.whatsapp}</p>
                        <a href={enlaceWhatsApp("Hola, tengo un taller de reparaciones y quiero conocer TecnoHouse")} target="_blank" rel="noopener noreferrer" className="enlace mt-3 text-sm">
                            Agendar una demostración <ArrowRight size={14} aria-hidden="true" />
                        </a>
                    </li>
                )}
                {telefonoConfigurado && (
                    <li>
                        <Phone size={22} className="text-marca" aria-hidden="true" />
                        <h3 className="mt-3 font-semibold text-white">Teléfono</h3>
                        <p className="mt-1 text-sm text-slate-400">{CONTACTO.telefono}</p>
                        <a href={`tel:${CONTACTO.telefono.replace(/[^\d+]/g, "")}`} className="enlace mt-3 text-sm">
                            Llamar <ArrowRight size={14} aria-hidden="true" />
                        </a>
                    </li>
                )}
            </ul>
        </div>
    </section>
);

/* Página de entrada: presenta TecnoHouse a dueños de talleres y lleva a la demo en vivo. */
const Portada = () => {
    const { productos, cargando } = useProductosDestacados();
    useAnimacionEntrada(cargando);

    return (
        <>
            <EncabezadoSitio />

            <main>
                <PrimeraSeccion />
                <SeccionProblemas />
                <SeccionPaneles />
                <SeccionFlujo />
                <SeccionTienda productos={productos} cargando={cargando} />
                <SeccionDemo />
                <SeccionContacto />
            </main>

            <PiePagina />
        </>
    );
};

export default Portada;
