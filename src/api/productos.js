/*
    productos.js
    Catálogo de productos y repuestos (supabase/catalogo.sql).

    El público lee la vista "productos_activos". Solo el administrador puede leer
    todos los productos, crearlos, editarlos o borrarlos, y subir sus imágenes
    al bucket público "productos".
*/
import { normalizarTexto } from "../utilidades/filtros.js";
import { obtenerCliente, verificar } from "./supabase.js";

export const BUCKET_PRODUCTOS = "productos";
export const TAMANO_MAXIMO_IMAGEN = 3 * 1024 * 1024;
export const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

const EXTENSIONES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const COLUMNAS_PUBLICAS = "id, nombre, descripcion, categoria, precio, stock, imagen_ruta, creado_en";
const COLUMNAS_ADMIN = `${COLUMNAS_PUBLICAS}, activo`;
const SIN_PERMISO = "No se pudo guardar el cambio. Revisa los permisos del administrador.";

const urlImagen = (ruta) =>
    ruta ? obtenerCliente().storage.from(BUCKET_PRODUCTOS).getPublicUrl(ruta).data.publicUrl : "";

const aProducto = (fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion ?? "",
    categoria: fila.categoria,
    precio: Number(fila.precio),
    stock: fila.stock,
    imagenRuta: fila.imagen_ruta ?? "",
    imagenUrl: urlImagen(fila.imagen_ruta),
    // La vista pública solo trae productos activos y no incluye la columna.
    activo: fila.activo ?? true,
    creadoEn: fila.creado_en,
});

/* Datos del formulario → columnas de la tabla. Solo incluye lo que se envió. */
const aFila = ({ nombre, descripcion, categoria, precio, stock, activo }) => ({
    ...(nombre !== undefined && { nombre: nombre.trim() }),
    ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
    ...(categoria !== undefined && { categoria: categoria.trim() }),
    ...(precio !== undefined && { precio: Number(precio) }),
    ...(stock !== undefined && { stock: Number(stock) }),
    ...(activo !== undefined && { activo }),
});

/* Si las reglas de seguridad bloquean el cambio, Supabase no da error: solo no toca filas. */
const exigirFilas = (filas) => {
    if (filas.length === 0) throw new Error(SIN_PERMISO);
    return filas;
};

/* Productos activos, para la sección pública. Funciona sin iniciar sesión. */
export const obtenerProductos = async () => {
    const filas = verificar(
        await obtenerCliente().from("productos_activos").select(COLUMNAS_PUBLICAS).order("categoria").order("nombre")
    );
    return filas.map(aProducto);
};

/* Todos los productos, activos o no. Solo el administrador obtiene filas. */
export const obtenerProductosAdmin = async () => {
    const filas = verificar(await obtenerCliente().from("productos").select(COLUMNAS_ADMIN).order("nombre"));
    return filas.map(aProducto);
};

export const validarImagenProducto = (archivo) => {
    if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
        throw new Error("La imagen debe estar en formato JPG, PNG o WebP.");
    }
    if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
        throw new Error("La imagen debe pesar máximo 3 MB.");
    }
};

const crearSlug = (texto) =>
    normalizarTexto(texto).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "producto";

/*
    Sube la imagen al bucket "productos" y devuelve su ruta. El nombre lleva el id del
    producto, el nombre en minúsculas y una marca de tiempo para no pisar fotos anteriores:
    "<id>-pantalla-samsung-a52-lq3k9x.jpg".
*/
export const subirImagenProducto = async (archivo, nombreProducto, productoId) => {
    validarImagenProducto(archivo);

    const ruta = `${productoId}-${crearSlug(nombreProducto)}-${Date.now().toString(36)}.${EXTENSIONES[archivo.type]}`;
    const { error } = await obtenerCliente().storage.from(BUCKET_PRODUCTOS).upload(ruta, archivo, {
        contentType: archivo.type,
        upsert: false,
    });
    if (error) verificar({ error });
    return ruta;
};

/* Una imagen huérfana no afecta al catálogo: si no se puede quitar, solo se avisa en consola. */
const quitarImagen = async (ruta) => {
    const { error } = await obtenerCliente().storage.from(BUCKET_PRODUCTOS).remove([ruta]);
    if (error) console.warn("No se pudo borrar la imagen del producto:", error.message);
};

/* "archivo" es opcional. Si el producto no se guarda, la imagen recién subida se quita. */
export const crearProducto = async (datos, archivo = null) => {
    const id = crypto.randomUUID();
    const imagenRuta = archivo ? await subirImagenProducto(archivo, datos.nombre, id) : null;

    try {
        const fila = verificar(
            await obtenerCliente()
                .from("productos")
                .insert({ id, ...aFila(datos), imagen_ruta: imagenRuta })
                .select(COLUMNAS_ADMIN)
                .single()
        );
        return aProducto(fila);
    } catch (error) {
        if (imagenRuta) await quitarImagen(imagenRuta);
        throw error;
    }
};

/* Con "archivo" reemplaza la imagen: guarda la nueva y quita "imagenAnterior" cuando el cambio se confirmó. */
export const actualizarProducto = async (id, datos, archivo = null, imagenAnterior = "") => {
    const imagenRuta = archivo ? await subirImagenProducto(archivo, datos.nombre, id) : null;

    try {
        const filas = exigirFilas(
            verificar(
                await obtenerCliente()
                    .from("productos")
                    .update({ ...aFila(datos), ...(imagenRuta && { imagen_ruta: imagenRuta }) })
                    .eq("id", id)
                    .select(COLUMNAS_ADMIN)
            )
        );
        if (imagenRuta && imagenAnterior) await quitarImagen(imagenAnterior);
        return aProducto(filas[0]);
    } catch (error) {
        if (imagenRuta) await quitarImagen(imagenRuta);
        throw error;
    }
};

export const toggleActivo = async (id, activo) => {
    exigirFilas(verificar(await obtenerCliente().from("productos").update({ activo }).eq("id", id).select("id")));
};

export const borrarProducto = async (id) => {
    const [fila] = exigirFilas(
        verificar(await obtenerCliente().from("productos").delete().eq("id", id).select("imagen_ruta"))
    );
    if (fila.imagen_ruta) await quitarImagen(fila.imagen_ruta);
};
