import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Camera, ClipboardCheck, ListChecks, MapPin, MessageCircle, MessagesSquare, Phone } from "lucide-react";
import { obtenerProductos } from "../api/productos.js";
import EncabezadoSitio from "../componentes/EncabezadoSitio.jsx";
import ImagenProducto from "../componentes/ImagenProducto.jsx";
import PiePagina from "../componentes/PiePagina.jsx";
import EjemploSeguimiento from "../componentes/portada/EjemploSeguimiento.jsx";
import { useSesion } from "../contexto/ContextoSesion.js";
import { CATEGORIAS_PRODUCTO } from "../datos/categoriasProductos.js";
import { CONTACTO } from "../datos/contacto.js";
import { PASOS_SERVICIO } from "../datos/pasosServicio.js";
import { SERVICIOS } from "../datos/servicios.js";
import useAnimacionEntrada from "../hooks/useAnimacionEntrada.js";
import { formatearPesos } from "../utilidades/formato.js";
import { rutaInicio, rutaSolicitarReparacion } from "../utilidades/rutas.js";
import { enlaceWhatsApp, whatsappConfigurado } from "../utilidades/whatsapp.js";

const MAXIMO_PRODUCTOS = 4;

const VENTAJAS_SEGUIMIENTO = [
    { icono: ListChecks, titulo: "Estado paso a paso", texto: "Desde que recibimos la solicitud hasta la entrega." },
    { icono: ClipboardCheck, titulo: "Cotización antes de reparar", texto: "Tú decides si apruebas o rechazas el costo." },
    { icono: MessagesSquare, titulo: "Conversación con el técnico", texto: "Pregunta y recibe respuestas en el mismo servicio." },
    { icono: Camera, titulo: "Fotos del equipo", texto: "Adjunta imágenes de la falla al crear la solicitud." },
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

const PrimeraSeccion = () => {
    const { usuario } = useSesion();

    return (
        <section className="overflow-hidden border-b border-white/10 bg-gradient-to-b from-superficie to-fondo">
            <div className="contenedor grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
                <div>
                    <p className="antetitulo">Servicio técnico y repuestos en Valledupar</p>
                    <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
                        Reparamos tus equipos. Tú sigues cada paso en línea.
                    </h1>
                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
                        Servicio técnico para computadores, celulares, consolas y cámaras de seguridad, y una tienda con los repuestos y accesorios que necesitan.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link to={rutaSolicitarReparacion(usuario)} className="boton-primario px-6 py-3 text-base">
                            Solicitar una reparación <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                        <Link to="/tienda" className="boton-secundario px-6 py-3 text-base">Ver la tienda</Link>
                    </div>

                    <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400" aria-label="Equipos que atendemos">
                        {SERVICIOS.map(({ id, icono: Icono, titulo }) => (
                            <li key={id} className="flex items-center gap-2">
                                <Icono size={16} className="text-slate-500" aria-hidden="true" /> {titulo}
                            </li>
                        ))}
                    </ul>
                </div>

                <EjemploSeguimiento />
            </div>
        </section>
    );
};

/* Lista abierta, sin tarjetas: cada servicio es una fila con su ícono. */
const SeccionServicios = () => (
    <section data-animacion-entrada aria-labelledby="titulo-servicios" className="seccion">
        <div className="contenedor grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
                <p className="antetitulo">Reparaciones</p>
                <h2 id="titulo-servicios" className="titulo-seccion">Qué equipos atendemos</h2>
                <p className="texto-seccion">Diagnosticamos la falla, te enviamos la cotización y reparamos solo si la apruebas.</p>
                <Link to="/reparaciones" className="enlace mt-6">
                    Ver servicios y técnicos <ArrowRight size={16} aria-hidden="true" />
                </Link>
            </div>

            <ul className="grid gap-x-10 sm:grid-cols-2">
                {SERVICIOS.map(({ id, icono: Icono, titulo, descripcion }) => (
                    <li key={id} className="flex gap-4 border-t border-white/10 py-5">
                        <Icono size={22} strokeWidth={1.8} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />
                        <div>
                            <h3 className="font-semibold text-white">{titulo}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-slate-400">{descripcion}</p>
                        </div>
                    </li>
                ))}
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

/* Con productos muestra una selección; sin productos, las categorías que maneja la tienda. */
const SeccionTienda = ({ productos, cargando }) => (
    <section data-animacion-entrada aria-labelledby="titulo-tienda" className="seccion border-y border-white/10 bg-superficie">
        <div className="contenedor grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
                <p className="antetitulo">Tienda</p>
                <h2 id="titulo-tienda" className="titulo-seccion">Repuestos y accesorios</h2>
                <p className="texto-seccion">Arma tu carrito y envíanos el pedido por WhatsApp. Te confirmamos disponibilidad y entrega.</p>
                <Link to="/tienda" className="boton-secundario mt-6">
                    Explorar la tienda <ArrowRight size={16} aria-hidden="true" />
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
                    <p className="mb-4 text-sm text-slate-400">En la tienda encuentras:</p>
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

/* Los cuatro pasos en una sola línea numerada; el detalle está en la página de reparaciones. */
const SeccionPasos = () => (
    <section data-animacion-entrada aria-labelledby="titulo-pasos" className="seccion">
        <div className="contenedor">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="antetitulo">Cómo funciona</p>
                    <h2 id="titulo-pasos" className="titulo-seccion">De la solicitud a la entrega, en cuatro pasos</h2>
                </div>
                <a href="/reparaciones#como-funciona" className="enlace">
                    Conocer el proceso <ArrowRight size={16} aria-hidden="true" />
                </a>
            </div>

            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {PASOS_SERVICIO.map((paso, indice) => (
                    <li key={paso.titulo} className="border-t-2 border-slate-700 pt-5">
                        <p className="text-sm font-semibold text-marca">Paso {indice + 1}</p>
                        <h3 className="mt-2 font-semibold text-white">{paso.titulo}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">{paso.descripcion}</p>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);

const SeccionSeguimiento = () => {
    const { usuario } = useSesion();

    return (
        <section data-animacion-entrada aria-labelledby="titulo-seguimiento" className="pb-16 sm:pb-20">
            <div className="contenedor">
                <div className="grid gap-10 rounded-3xl border border-borde bg-gradient-to-br from-tarjeta to-superficie p-6 sm:p-10 lg:grid-cols-[1fr_1.3fr] lg:gap-14">
                    <div>
                        <p className="antetitulo">Seguimiento en línea</p>
                        <h2 id="titulo-seguimiento" className="titulo-seccion">Tu reparación, siempre a la vista</h2>
                        <p className="texto-seccion">Con tu cuenta consultas en qué va cada equipo, sin llamar ni esperar respuesta.</p>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            {usuario ? (
                                <Link to={rutaInicio(usuario.rol)} className="boton-primario">Ir a mi panel</Link>
                            ) : (
                                <>
                                    <Link to="/login" className="boton-primario">Iniciar sesión</Link>
                                    <Link to="/registro" className="boton-secundario">Crear cuenta</Link>
                                </>
                            )}
                        </div>
                    </div>

                    <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        {VENTAJAS_SEGUIMIENTO.map(({ icono: Icono, titulo, texto }) => (
                            <li key={titulo} className="flex gap-3.5">
                                <Icono size={20} strokeWidth={1.8} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />
                                <div>
                                    <h3 className="text-sm font-semibold text-white">{titulo}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{texto}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

/* Solo muestra los canales que están configurados en datos/contacto.js. */
const SeccionContacto = () => (
    <section data-animacion-entrada aria-labelledby="titulo-contacto" className="seccion border-t border-white/10 bg-superficie">
        <div className="contenedor grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
                <p className="antetitulo">Contacto</p>
                <h2 id="titulo-contacto" className="titulo-seccion">¿No sabes qué necesita tu equipo?</h2>
                <p className="texto-seccion">Escríbenos y te orientamos antes de que traigas el equipo.</p>
            </div>

            <ul className="grid gap-8 sm:grid-cols-3">
                {whatsappConfigurado && (
                    <li>
                        <MessageCircle size={22} className="text-marca" aria-hidden="true" />
                        <h3 className="mt-3 font-semibold text-white">WhatsApp</h3>
                        <p className="mt-1 text-sm text-slate-400">{CONTACTO.whatsapp}</p>
                        <a href={enlaceWhatsApp("Hola, quiero información sobre TecnoHouse")} target="_blank" rel="noopener noreferrer" className="enlace mt-3 text-sm">
                            Abrir chat <ArrowRight size={14} aria-hidden="true" />
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
                <li>
                    <MapPin size={22} className="text-marca" aria-hidden="true" />
                    <h3 className="mt-3 font-semibold text-white">Dirección</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{CONTACTO.direccion}</p>
                    <a href="/reparaciones#ubicacion" className="enlace mt-3 text-sm">
                        Ver el mapa <ArrowRight size={14} aria-hidden="true" />
                    </a>
                </li>
            </ul>
        </div>
    </section>
);

/* Página de entrada: presenta el negocio y lleva a reparaciones, a la tienda y a la cuenta. */
const Portada = () => {
    const { productos, cargando } = useProductosDestacados();
    useAnimacionEntrada(cargando);

    return (
        <>
            <EncabezadoSitio />

            <main>
                <PrimeraSeccion />
                <SeccionServicios />
                <SeccionTienda productos={productos} cargando={cargando} />
                <SeccionPasos />
                <SeccionSeguimiento />
                <SeccionContacto />
            </main>

            <PiePagina />
        </>
    );
};

export default Portada;
