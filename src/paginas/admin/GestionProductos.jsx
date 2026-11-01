import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { actualizarProducto, borrarProducto, crearProducto, obtenerProductosAdmin, toggleActivo } from "../../api/productos.js";
import Aviso from "../../componentes/Aviso.jsx";
import ImagenProducto from "../../componentes/ImagenProducto.jsx";
import BarraFiltros from "../../componentes/panel/BarraFiltros.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FormularioProducto from "../../componentes/panel/FormularioProducto.jsx";
import ResultadosPaginados from "../../componentes/panel/ResultadosPaginados.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import { CATEGORIAS_PRODUCTO } from "../../datos/categoriasProductos.js";
import { useFiltroPaginado } from "../../hooks/useFiltroPaginado.js";
import useConfirmar from "../../hooks/useConfirmar.js";
import useToast from "../../hooks/useToast.js";
import { coincideTexto } from "../../utilidades/filtros.js";
import { formatearPesos } from "../../utilidades/formato.js";

const FILTROS_VACIOS = { texto: "", categoria: "todas", estado: "todos" };

const cumpleFiltrosProducto = (producto, { texto, categoria, estado }) =>
    (categoria === "todas" || producto.categoria === categoria) &&
    (estado === "todos" || producto.activo === (estado === "activos")) &&
    coincideTexto(texto, [producto.nombre]);

const opcionesCategoria = (productos) => [
    { valor: "todas", etiqueta: `Todas (${productos.length})` },
    ...[...new Set(productos.map((producto) => producto.categoria))]
        .sort((a, b) => a.localeCompare(b))
        .map((categoria) => ({
            valor: categoria,
            etiqueta: `${categoria} (${productos.filter((producto) => producto.categoria === categoria).length})`,
        })),
];

const opcionesEstadoProducto = (productos) => {
    const activos = productos.filter((producto) => producto.activo).length;
    return [
        { valor: "todos", etiqueta: `Todos (${productos.length})` },
        { valor: "activos", etiqueta: `Activos (${activos})` },
        { valor: "inactivos", etiqueta: `Inactivos (${productos.length - activos})` },
    ];
};

const ENCABEZADOS = ["Producto", "Categoría", "Precio", "Stock", "Estado", "Acciones"];

const FilaProducto = ({ producto, ocupado, alEditar, alAlternar, alBorrar }) => (
    <tr className={producto.activo ? "" : "opacity-60"}>
        <td className="px-4 py-3">
            <div className="flex items-center gap-3">
                <ImagenProducto url={producto.imagenUrl} className="size-12 shrink-0 rounded-lg border border-borde" />
                <span className="min-w-0 font-medium">{producto.nombre}</span>
            </div>
        </td>
        <td className="px-4 py-3 text-slate-300">{producto.categoria}</td>
        <td className="px-4 py-3 whitespace-nowrap">{formatearPesos(producto.precio)}</td>
        <td className={`px-4 py-3 ${producto.stock === 0 ? "text-red-300" : ""}`}>{producto.stock}</td>
        <td className="px-4 py-3">
            <span className={producto.activo ? "text-emerald-300" : "text-slate-400"}>{producto.activo ? "Activo" : "Inactivo"}</span>
        </td>
        <td className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
                <button type="button" disabled={ocupado} onClick={() => alEditar(producto)} aria-label={`Editar ${producto.nombre}`} className="boton-secundario px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50">
                    Editar
                </button>
                <button type="button" disabled={ocupado} onClick={() => alAlternar(producto)} aria-label={`${producto.activo ? "Desactivar" : "Activar"} ${producto.nombre}`} className="boton-secundario px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50">
                    {producto.activo ? "Desactivar" : "Activar"}
                </button>
                <button type="button" disabled={ocupado} onClick={() => alBorrar(producto)} aria-label={`Borrar ${producto.nombre}`} className="boton-peligro px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50">
                    Borrar
                </button>
            </div>
        </td>
    </tr>
);

const GestionProductos = () => {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    // null = formulario cerrado; { producto: null } = crear; { producto } = editar ese producto.
    const [formulario, setFormulario] = useState(null);
    // Id del producto con una acción en curso (para no lanzar dos a la vez).
    const [ocupadoId, setOcupadoId] = useState("");
    // Cada vez que aumenta, el useEffect vuelve a pedir la lista a Supabase.
    const [recargas, setRecargas] = useState(0);
    const toast = useToast();
    const confirmar = useConfirmar();
    const paginado = useFiltroPaginado(productos, cumpleFiltrosProducto, FILTROS_VACIOS);

    useEffect(() => {
        let vigente = true;

        obtenerProductosAdmin()
            .then((lista) => vigente && setProductos(lista))
            .catch((errorApi) => vigente && setError(errorApi.message || "No se pudieron cargar los productos."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [recargas]);

    const recargar = () => setRecargas((anterior) => anterior + 1);

    const abrirFormulario = (producto = null) => {
        setFormulario({ producto });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const guardar = async (valores, archivo) => {
        const { producto } = formulario;
        if (producto) {
            await actualizarProducto(producto.id, valores, archivo, producto.imagenRuta);
        } else {
            await crearProducto(valores, archivo);
        }

        setFormulario(null);
        recargar();
        toast.exito(producto ? `Se guardaron los cambios de ${valores.nombre.trim()}.` : `Se creó ${valores.nombre.trim()}.`);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const ejecutar = async (producto, accion, mensajeExito) => {
        setOcupadoId(producto.id);
        try {
            await accion();
            recargar();
            toast.exito(mensajeExito);
        } catch (errorApi) {
            toast.error(errorApi.message);
        } finally {
            setOcupadoId("");
        }
    };

    const alternar = (producto) =>
        confirmar({
            titulo: producto.activo ? "Desactivar producto" : "Activar producto",
            mensaje: producto.activo
                ? `¿Ocultar ${producto.nombre} del catálogo? El producto no se borrará.`
                : `¿Volver a mostrar ${producto.nombre} en el catálogo?`,
        }).then((aceptado) => {
            if (aceptado) {
                return ejecutar(
                    producto,
                    () => toggleActivo(producto.id, !producto.activo),
                    producto.activo ? `${producto.nombre} ya no se muestra en el catálogo.` : `${producto.nombre} vuelve a mostrarse en el catálogo.`
                );
            }
            return undefined;
        });

    const borrar = async (producto) => {
        const aceptado = await confirmar({
            titulo: "Borrar producto",
            mensaje: `¿Borrar ${producto.nombre}? Se elimina del catálogo y su imagen. No se puede deshacer. Si solo quieres ocultarlo, usa Desactivar.`,
        });
        if (aceptado) await ejecutar(producto, () => borrarProducto(producto.id), `Se borró ${producto.nombre}.`);
    };

    return (
        <>
            <EncabezadoPagina titulo="Catálogo" descripcion="Productos y repuestos que se muestran en el sitio público. Los inactivos quedan ocultos.">
                {!formulario && (
                    <button type="button" onClick={() => abrirFormulario()} className="boton-primario">
                        + Crear producto
                    </button>
                )}
            </EncabezadoPagina>

            <Aviso texto={error} tipo="error" />

            {formulario && (
                <FormularioProducto
                    key={formulario.producto?.id ?? "nuevo"}
                    producto={formulario.producto}
                    categorias={CATEGORIAS_PRODUCTO}
                    alGuardar={guardar}
                    alCancelar={() => setFormulario(null)}
                />
            )}

            {cargando && <Skeleton tipo="fila" cantidad={4} etiqueta="Cargando productos" />}

            {!cargando && !error && productos.length === 0 && (
                <EstadoVacio icono={Package} titulo="Todavía no hay productos" descripcion="Crea el primero con el botón “Crear producto”." />
            )}

            {productos.length > 0 && (
                <section aria-labelledby="titulo-lista-productos">
                    <h2 id="titulo-lista-productos" className="sr-only">Listado de productos</h2>

                    <BarraFiltros
                        id="productos"
                        etiqueta="Filtrar productos"
                        placeholder="Nombre del producto"
                        paginado={paginado}
                        opcionesCategoria={opcionesCategoria(productos)}
                        opcionesEstado={opcionesEstadoProducto(productos)}
                    />

                    <ResultadosPaginados id="productos" paginado={paginado}>
                        <div role="region" aria-label="Tabla de productos" tabIndex={0} className="overflow-x-auto rounded-xl border border-borde focus-visible:outline-2 focus-visible:outline-marca">
                            <table className="w-full min-w-[46rem] text-left text-sm">
                                <caption className="sr-only">Productos del catálogo con su categoría, precio, stock y estado</caption>
                                <thead className="bg-tarjeta text-xs tracking-wide text-slate-400 uppercase">
                                    <tr>
                                        {ENCABEZADOS.map((encabezado) => (
                                            <th key={encabezado} scope="col" className="px-4 py-3 font-semibold">{encabezado}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-borde">
                                    {paginado.elementos.map((producto) => (
                                        <FilaProducto
                                            key={producto.id}
                                            producto={producto}
                                            ocupado={ocupadoId === producto.id}
                                            alEditar={abrirFormulario}
                                            alAlternar={alternar}
                                            alBorrar={borrar}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ResultadosPaginados>
                </section>
            )}
        </>
    );
};

export default GestionProductos;
