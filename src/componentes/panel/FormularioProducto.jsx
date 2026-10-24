import { useState } from "react";
import { TAMANO_MAXIMO_IMAGEN, TIPOS_IMAGEN_PERMITIDOS, validarImagenProducto } from "../../api/productos.js";
import Aviso from "../Aviso.jsx";
import ImagenProducto from "../ImagenProducto.jsx";

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

const validar = (valores, archivo) => {
    if (!valores.nombre.trim()) return "Escribe el nombre del producto.";
    if (!valores.categoria) return "Elige una categoría.";
    if (valores.precio === "" || !(Number(valores.precio) > 0)) return "Escribe un precio mayor a 0.";
    if (!/^\d+$/.test(valores.stock)) return "El stock debe ser un número entero, 0 o mayor.";

    if (archivo) {
        try {
            validarImagenProducto(archivo);
        } catch (error) {
            return error.message;
        }
    }
    return null;
};

/*
    Crea o edita un producto (con "producto" se edita). "alGuardar(datos, archivo)" la recibe
    del padre, que llama a la API; si falla, el error se muestra en el formulario.
*/
const FormularioProducto = ({ producto = null, categorias, alGuardar, alCancelar }) => {
    const [valores, setValores] = useState(() => aValores(producto));
    const [archivo, setArchivo] = useState(null);
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);

    // Una categoría guardada antes que ya no esté en la lista sigue siendo elegible al editar.
    const opcionesCategoria = producto && !categorias.includes(producto.categoria) ? [producto.categoria, ...categorias] : categorias;

    const manejarCambio = (evento) => {
        const { name, type, value, checked } = evento.target;
        setValores((anteriores) => ({ ...anteriores, [name]: type === "checkbox" ? checked : value }));
    };

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        const errorValidacion = validar(valores, archivo);
        if (errorValidacion) {
            setError(errorValidacion);
            return;
        }

        setError("");
        setGuardando(true);

        try {
            await alGuardar(valores, archivo);
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
                    <label htmlFor="producto-imagen" className="etiqueta">Imagen</label>
                    <div className="flex items-center gap-4">
                        {producto && <ImagenProducto url={producto.imagenUrl} alt={`Imagen actual de ${producto.nombre}`} className="size-16 shrink-0 rounded-lg border border-borde" />}
                        <div className="min-w-0 flex-1">
                            <input
                                id="producto-imagen"
                                type="file"
                                accept={TIPOS_IMAGEN_PERMITIDOS.join(",")}
                                aria-describedby="producto-imagen-ayuda"
                                className="campo file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-marca/15 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-marca"
                                onChange={(evento) => setArchivo(evento.target.files?.[0] ?? null)}
                            />
                            <p id="producto-imagen-ayuda" className="mt-1.5 text-xs text-slate-500">
                                JPG, PNG o WebP, máximo {TAMANO_MAXIMO_IMAGEN / 1024 / 1024} MB.
                                {producto?.imagenRuta ? " Si eliges otra, reemplaza a la actual." : ""}
                            </p>
                        </div>
                    </div>
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
