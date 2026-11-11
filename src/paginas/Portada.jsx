import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, ShieldCheck, ShoppingBag, UsersRound, Wrench } from "lucide-react";
import { obtenerProductos } from "../api/productos.js";
import ImagenProducto from "../componentes/ImagenProducto.jsx";
import PiePagina from "../componentes/inicio/PiePagina.jsx";
import { CATEGORIAS_PRODUCTO } from "../datos/categoriasProductos.js";
import { SERVICIOS } from "../datos/servicios.js";
import { useTecnicos } from "../hooks/useTecnicos.js";
import { formatearPesos } from "../utilidades/formato.js";
import { enlaceWhatsApp, whatsappConfigurado } from "../utilidades/whatsapp.js";

const MAXIMO_PRODUCTOS = 3;

/*
    Productos activos para la vista previa de la tienda.
    PENDIENTE BASE: con la columna "destacado", mostrar los que marque el administrador.
*/
const useProductosDestacados = () => {
    const [productos, setProductos] = useState([]);

    useEffect(() => {
        let vigente = true;
        obtenerProductos()
            .then((lista) => vigente && setProductos(lista.filter((producto) => producto.stock > 0).slice(0, MAXIMO_PRODUCTOS)))
            .catch(() => vigente && setProductos([]));
        return () => {
            vigente = false;
        };
    }, []);

    return productos;
};

const Destacado = ({ Icono, titulo, texto }) => (
    <li className="flex items-center gap-3 rounded-xl border border-borde bg-tarjeta/60 px-4 py-3 text-left">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-marca/10 text-marca" aria-hidden="true">
            <Icono size={20} />
        </span>
        <div>
            <p className="text-sm font-semibold">{titulo}</p>
            <p className="text-xs text-slate-400">{texto}</p>
        </div>
    </li>
);

/* Tarjeta grande de cada mitad: encabezado, una vista previa (children) y el botón. */
const TarjetaSeccion = ({ Icono, antetitulo, titulo, texto, destino, textoBoton, children }) => (
    <section className="group flex flex-col rounded-2xl border border-borde bg-tarjeta/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-marca hover:shadow-[0_10px_40px_rgba(0,170,255,0.15)] sm:p-8">
        <div className="mb-6 flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-marca/10 text-marca transition group-hover:bg-marca/20" aria-hidden="true">
                <Icono size={28} strokeWidth={1.8} />
            </span>
            <div>
                <p className="text-xs font-bold tracking-widest text-marca uppercase">{antetitulo}</p>
                <h2 className="text-2xl font-bold sm:text-3xl">{titulo}</h2>
            </div>
        </div>
        <p className="mb-6 text-slate-300">{texto}</p>

        <div className="flex-1">{children}</div>

        <Link to={destino} className="boton-primario mt-8 w-full py-3.5 text-[15px] font-bold">
            {textoBoton} <ArrowRight size={18} className="transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
    </section>
);

const Etiquetas = ({ lista }) => (
    <ul className="flex flex-wrap gap-2">
        {lista.map((texto) => (
            <li key={texto} className="rounded-full border border-borde bg-black/30 px-3 py-1 text-xs text-slate-300">{texto}</li>
        ))}
    </ul>
);

/* Si no hay productos para mostrar, la tienda enseña sus categorías. */
const VistaTienda = ({ productos }) => (
    <>
        {productos.length > 0 && (
            <ul className="mb-5 grid grid-cols-3 gap-3">
                {productos.map((producto) => (
                    <li key={producto.id}>
                        <Link to={`/tienda/${producto.id}`} className="block overflow-hidden rounded-xl border border-borde bg-fondo transition hover:border-marca">
                            <ImagenProducto url={producto.imagenUrl} className="aspect-square w-full" />
                            <div className="p-2">
                                <p className="truncate text-xs font-semibold">{producto.nombre}</p>
                                <p className="text-xs text-marca">{formatearPesos(producto.precio)}</p>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        )}
        <Etiquetas lista={CATEGORIAS_PRODUCTO} />
    </>
);

const VistaReparaciones = () => (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SERVICIOS.map(({ id, icono: Icono, titulo }) => (
            <li key={id} className="flex flex-col items-center gap-2 rounded-xl border border-borde bg-fondo p-3 text-center">
                <Icono size={22} className="text-marca" aria-hidden="true" />
                <p className="text-xs font-semibold">{titulo}</p>
            </li>
        ))}
    </ul>
);

/* Página de entrada: presenta TecnoHouse y separa la tienda de las reparaciones. */
const Portada = () => {
    const productos = useProductosDestacados();
    const { tecnicos } = useTecnicos();

    const destacados = [
        { Icono: Wrench, titulo: `${SERVICIOS.length} tipos de servicio`, texto: "Para todos tus dispositivos" },
        { Icono: UsersRound, titulo: tecnicos.length > 0 ? `${tecnicos.length} técnicos` : "Técnicos certificados", texto: "Listos para ayudarte" },
        { Icono: ShieldCheck, titulo: "Seguimiento en línea", texto: "Revisa el estado de tu equipo" },
    ];

    return (
        <>
            <main className="relative isolate overflow-hidden bg-fondo">
                <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[40rem] -translate-x-1/2 rounded-full bg-marca/10 blur-3xl" />

                <section className="mx-auto max-w-6xl px-6 pt-20 pb-12 text-center sm:pt-24">
                    <p className="antetitulo">Tecnología · Reparaciones · Repuestos</p>
                    <h1 className="text-5xl font-bold sm:text-7xl">
                        TECNO<span className="text-marca">HOUSE</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                        Reparamos y damos mantenimiento a computadoras, celulares, consolas y cámaras de seguridad,
                        y vendemos los repuestos y accesorios que tus equipos necesitan.
                    </p>

                    <ul className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-3">
                        {destacados.map((destacado) => <Destacado key={destacado.titulo} {...destacado} />)}
                    </ul>
                </section>

                <div className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 lg:grid-cols-2">
                    <TarjetaSeccion
                        Icono={ShoppingBag}
                        antetitulo="Tienda"
                        titulo="Repuestos y accesorios"
                        texto="Arma tu carrito con pantallas, baterías, cargadores y más, y envíanos el pedido por WhatsApp."
                        destino="/tienda"
                        textoBoton="Ir a la tienda"
                    >
                        <VistaTienda productos={productos} />
                    </TarjetaSeccion>

                    <TarjetaSeccion
                        Icono={Wrench}
                        antetitulo="Reparaciones"
                        titulo="Servicio técnico"
                        texto="Solicita tu reparación en línea, recibe la cotización y sigue cada paso hasta que tu equipo esté listo."
                        destino="/reparaciones"
                        textoBoton="Ver reparaciones"
                    >
                        <VistaReparaciones />
                    </TarjetaSeccion>
                </div>

                {whatsappConfigurado && (
                    <section className="border-t border-borde bg-tarjeta/40 px-6 py-12">
                        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
                            <div>
                                <h2 className="text-xl font-bold">¿No sabes qué necesita tu equipo?</h2>
                                <p className="mt-1 text-slate-400">Escríbenos y te orientamos sin compromiso.</p>
                            </div>
                            <a href={enlaceWhatsApp("Hola, quiero información sobre TecnoHouse")} target="_blank" rel="noopener noreferrer" className="boton-primario shrink-0 px-6 py-3">
                                <MessageCircle size={18} aria-hidden="true" /> Escríbenos por WhatsApp
                            </a>
                        </div>
                    </section>
                )}
            </main>

            <PiePagina />
        </>
    );
};

export default Portada;
