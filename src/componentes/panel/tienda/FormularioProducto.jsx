import { useEffect, useMemo, useState } from "react";
import { MAXIMO_IMAGENES_PRODUCTO, TAMANO_MAXIMO_IMAGEN, TIPOS_IMAGEN_PERMITIDOS, validarImagenProducto } from "../../../api/productos.js";
import Aviso from "../../Aviso.jsx";
import ImagenProducto from "../../ImagenProducto.jsx";

// useMemo prepara vistas previas y useEffect libera sus URL temporales.
const VALORES_INICIALES = { nombre: "", descripcion: "", categoria: "", precio: "", stock: "0", activo: true };

const aValores = (producto) =>
    producto
        ? {
              nombre: producto.nombre,
              descripcion: producto.descripcion,
              categoria: producto.categoria,
              precio: String(producto.precio),
              stock: String(producto.stock),
              activo: producto.activo,
          }
        : VALORES_INICIALES;

const validar = (valores, archivos, rutasExistentes) => {
    if (!valores.nombre.trim()) return "Escribe el nombre del producto.";
    if (!valores.categoria) return "Elige una categoría.";
    if (valores.precio === "" || !(Number(valores.precio) > 0)) return "Escribe un precio mayor a 0.";
    if (!/^\d+$/.test(valores.stock)) return "El stock debe ser un número entero, 0 o mayor.";

    // El límite considera las fotos guardadas que se conservan y los archivos nuevos.
    if (archivos.length + rutasExistentes.length > MAXIMO_IMAGENES_PRODUCTO) {
        return `Puedes guardar máximo ${MAXIMO_IMAGENES_PRODUCTO} fotos por producto.`;
    }

    for (const archivo of archivos) {
        try {
            validarImagenProducto(archivo);
        } catch (error) {
            return error.message;
        }
    }
    return null;
};

/*
    Crea o edita un producto (con "producto" se edita). alGuardar recibe los datos,
    los archivos nuevos y las rutas anteriores que se conservaron; los errores se muestran aquí.
*/
const FormularioProducto = ({ producto = null, categorias, alGuardar, alCancelar }) => {
    const [valores, setValores] = useState(() => aValores(producto));
    // Los archivos nuevos se mantienen separados de las fotos ya guardadas.
    const [archivos, setArchivos] = useState([]);
    // Solo se guardan las rutas existentes que quien edita decide conservar.
    const [imagenesRutas, setImagenesRutas] = useState(() => producto?.imagenesRutas ?? (producto?.imagenRuta ? [producto.imagenRuta] : []));
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);
    // Crea miniaturas locales sin subir las fotos antes de guardar el formulario.
    const vistasArchivos = useMemo(() => archivos.map((archivo) => URL.createObjectURL(archivo)), [archivos]);

    // Libera las URL locales al quitar archivos o desmontar el formulario.
    useEffect(() => () => vistasArchivos.forEach((url) => URL.revokeObjectURL(url)), [vistasArchivos]);

    // Una categoría guardada antes que ya no esté en la lista sigue siendo elegible al editar.
    const opcionesCategoria = producto && !categorias.includes(producto.categoria) ? [producto.categoria, ...categorias] : categorias;

    const manejarCambio = (evento) => {
        const { name, type, value, checked } = evento.target;
        setValores((anteriores) => ({ ...anteriores, [name]: type === "checkbox" ? checked : value }));
    };

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        const errorValidacion = validar(valores, archivos, imagenesRutas);
        if (errorValidacion) {
            setError(errorValidacion);
            return;
        }

        setError("");
        setGuardando(true);

        try {
            await alGuardar({ ...valores, imagenesRutas }, archivos, imagenesRutas);
        } catch (errorApi) {
            setError(errorApi.message);
            setGuardando(false);
        }
    };

    return (
        <form onSubmit={manejarEnvio} noValidate className="tarjeta mb-8">
            <h2 className="mb-1 text-lg font-semibold">{producto ? `Editar ${producto.nombre}` : "Nuevo producto"}</h2>
            <p className="mb-5 text-sm text-slate-400">Nombre, categoría y precio son obligatorios. Los productos inactivos no aparecen en el catálogo público.</p>

            <Aviso texto={error} tipo="error" />

            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="producto-nombre" className="etiqueta">Nombre</label>
                    <input id="producto-nombre" name="nombre" type="text" className="campo" maxLength={120} autoComplete="off" placeholder="Ej. Pantalla Samsung A52" value={valores.nombre} onChange={manejarCambio} />
                </div>

                <div>
                    <label htmlFor="producto-categoria" className="etiqueta">Categoría</label>
                    <select id="producto-categoria" name="categoria" className="campo" value={valores.categoria} onChange={manejarCambio}>
                        <option value="">Elige una categoría</option>
                        {opcionesCategoria.map((categoria) => (
                            <option key={categoria} value={categoria}>{categoria}</option>
                        ))}
                    </select>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="producto-descripcion" className="etiqueta">Descripción</label>
                    <textarea id="producto-descripcion" name="descripcion" rows={3} className="campo" maxLength={1000} placeholder="Qué es, con qué equipos es compatible, garantía..." value={valores.descripcion} onChange={manejarCambio} />
                </div>

                <div>
                    <label htmlFor="producto-precio" className="etiqueta">Precio (COP)</label>
                    <input id="producto-precio" name="precio" type="number" inputMode="decimal" min="0" step="any" className="campo" placeholder="Ej. 285000" value={valores.precio} onChange={manejarCambio} />
                </div>

                <div>
                    <label htmlFor="producto-stock" className="etiqueta">Stock</label>
                    <input id="producto-stock" name="stock" type="number" inputMode="numeric" min="0" step="1" className="campo" value={valores.stock} onChange={manejarCambio} />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="producto-imagenes" className="etiqueta">Fotos del producto</label>
                    <p id="producto-imagen-ayuda" className="mb-3 text-xs text-slate-500">
                        Puedes agregar hasta {MAXIMO_IMAGENES_PRODUCTO} fotos. JPG, PNG o WebP, máximo {TAMANO_MAXIMO_IMAGEN / 1024 / 1024} MB cada una.
                    </p>
                    {/* Muestra las fotos actuales y las nuevas; cada botón quita solo la foto elegida. */}
                    {(imagenesRutas.length > 0 || vistasArchivos.length > 0) && (
                        <ul className="mb-4 flex flex-wrap gap-3">
                            {imagenesRutas.map((ruta, indice) => {
                                const imagen = producto?.imagenes?.find((item) => item.ruta === ruta);
                                const url = imagen?.url ?? (ruta === producto?.imagenRuta ? producto?.imagenUrl : "");
                                return (
                                    <li key={ruta} className="relative">
                                        <ImagenProducto url={url} alt={`Foto ${indice + 1} de ${producto?.nombre ?? valores.nombre}`} className="size-20 rounded-lg border border-borde" />
                                        <button type="button" onClick={() => setImagenesRutas((actuales) => actuales.filter((item) => item !== ruta))} aria-label={`Quitar foto ${indice + 1}`} className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-red-600 text-white">×</button>
                                    </li>
                                );
                            })}
                            {vistasArchivos.map((url, indice) => (
                                <li key={url} className="relative">
                                    <img src={url} alt={`Nueva foto ${indice + 1}`} className="size-20 rounded-lg border border-borde object-cover" />
                                    <button type="button" onClick={() => setArchivos((actuales) => actuales.filter((_, posicion) => posicion !== indice))} aria-label={`Quitar nueva foto ${indice + 1}`} className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-red-600 text-white">×</button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {/* multiple habilita la selección de varias fotos en una sola operación. */}
                    <input
                        id="producto-imagenes"
                        type="file"
                        multiple
                        accept={TIPOS_IMAGEN_PERMITIDOS.join(",")}
                        aria-describedby="producto-imagen-ayuda"
                        className="campo file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-marca/15 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-marca"
                        onChange={(evento) => {
                            // Copia los File antes de vaciar el input; el actualizador de estado puede ejecutarse después.
                            const seleccionados = Array.from(evento.target.files ?? []);
                            // Acumula esta selección con las anteriores para permitir elegir fotos en varias tandas.
                            setArchivos((actuales) => [...actuales, ...seleccionados]);
                            // Permite volver a seleccionar el mismo archivo si el usuario lo quitó de la vista previa.
                            evento.target.value = "";
                        }}
                    />
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300 sm:col-span-2">
                    <input name="activo" type="checkbox" className="size-4 cursor-pointer accent-marca" checked={valores.activo} onChange={manejarCambio} />
                    Activo (visible en el catálogo público)
                </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={alCancelar} className="boton-secundario">Cancelar</button>
                <button type="submit" disabled={guardando} className="boton-primario">
                    {guardando ? "Guardando..." : producto ? "Guardar cambios" : "Crear producto"}
                </button>
            </div>
        </form>
    );
};

export default FormularioProducto;
