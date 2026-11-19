/*
    productos.js
    Catálogo de productos y repuestos (supabase/catalogo.sql y permisos_tienda.sql).

    El público lee la vista "productos_activos". El personal de tienda (administrador
    y gestor de tienda) lee todos los productos, los crea, edita y borra, y sube sus
    imágenes al bucket público "productos". El stock solo cambia con las funciones
    ajustar_stock_producto y fijar_stock_producto, que no pisan cambios de otros.
*/
import { normalizarTexto } from "../utilidades/filtros.js";
import { obtenerCliente, verificar } from "./supabase.js";

export const BUCKET_PRODUCTOS = "productos";
export const TAMANO_MAXIMO_IMAGEN = 3 * 1024 * 1024;
// Evita que la ficha del producto termine con demasiadas fotos.
export const MAXIMO_IMAGENES_PRODUCTO = 8;
export const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

const EXTENSIONES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
// Incluye la columna nueva que contiene todas las fotos para las consultas actuales.
const COLUMNAS_PUBLICAS = "id, nombre, descripcion, categoria, precio, stock, imagen_ruta, imagenes_rutas, creado_en";
const COLUMNAS_GESTION = `${COLUMNAS_PUBLICAS}, activo`;
// Mantiene disponibles los productos si la base aún expone el esquema de una sola foto.
const COLUMNAS_ANTERIORES = "id, nombre, descripcion, categoria, precio, stock, imagen_ruta, creado_en";
const COLUMNAS_GESTION_ANTERIORES = `${COLUMNAS_ANTERIORES}, activo`;
const SIN_PERMISO = "No se pudo guardar el cambio. Tu cuenta no tiene permiso para administrar la tienda.";

const consultarProductos = async (consultaActual, consultaAnterior) => {
    try {
        return verificar(await consultaActual());
    } catch (error) {
        // Permite que el catálogo siga cargando mientras Supabase aún no tiene la migración de varias fotos.
        if (!error.message?.toLowerCase().includes("imagenes_rutas")) throw error;
        console.warn("Supabase aún no tiene imagenes_rutas. Ejecuta supabase/catalogo.sql para habilitar la galería de fotos.");
        return verificar(await consultaAnterior());
    }
};

const urlImagen = (ruta) =>
    ruta ? obtenerCliente().storage.from(BUCKET_PRODUCTOS).getPublicUrl(ruta).data.publicUrl : "";

const aProducto = (fila) => {
    // Usa la lista de fotos nueva y, durante la migración, cae a la ruta antigua.
    const imagenesRutas = fila.imagenes_rutas?.length ? fila.imagenes_rutas : fila.imagen_ruta ? [fila.imagen_ruta] : [];
    // Prepara URL y ruta juntas para la galería y para los controles administrativos.
    const imagenes = imagenesRutas.map((ruta) => ({ ruta, url: urlImagen(ruta) }));
    return {
        id: fila.id,
        nombre: fila.nombre,
        descripcion: fila.descripcion ?? "",
        categoria: fila.categoria,
        precio: Number(fila.precio),
        stock: fila.stock,
        imagenRuta: imagenesRutas[0] ?? "",
        imagenUrl: imagenes[0]?.url ?? "",
        imagenesRutas,
        imagenes,
        // La vista pública solo trae productos activos y no incluye la columna.
        activo: fila.activo ?? true,
        creadoEn: fila.creado_en,
    };
};

/* Datos del formulario → columnas de la tabla. Solo incluye lo que se envió. El stock va aparte (ver fijarStock). */
const aFila = ({ nombre, descripcion, categoria, precio, activo }) => ({
    ...(nombre !== undefined && { nombre: nombre.trim() }),
    ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
    ...(categoria !== undefined && { categoria: categoria.trim() }),
    ...(precio !== undefined && { precio: Number(precio) }),
    ...(activo !== undefined && { activo }),
});

/* Si las reglas de seguridad bloquean el cambio, Supabase no da error: solo no toca filas. */
const exigirFilas = (filas) => {
    if (filas.length === 0) throw new Error(SIN_PERMISO);
    return filas;
};

/* Productos activos, para la sección pública. Funciona sin iniciar sesión. */
export const obtenerProductos = async () => {
    const cliente = obtenerCliente();
    const filas = await consultarProductos(
        () => cliente.from("productos_activos").select(COLUMNAS_PUBLICAS).order("categoria").order("nombre"),
        () => cliente.from("productos_activos").select(COLUMNAS_ANTERIORES).order("categoria").order("nombre")
    );
    return filas.map(aProducto);
};

/* Todos los productos, activos o no. Solo el personal de tienda obtiene filas. */
export const obtenerTodosLosProductos = async () => {
    const cliente = obtenerCliente();
    const filas = await consultarProductos(
        () => cliente.from("productos").select(COLUMNAS_GESTION).order("nombre"),
        () => cliente.from("productos").select(COLUMNAS_GESTION_ANTERIORES).order("nombre")
    );
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
    Sube una imagen al bucket "productos" y devuelve su ruta. El nombre lleva el id y
    el slug del producto, la fecha y un UUID para que cada archivo sea único.
*/
export const subirImagenProducto = async (archivo, nombreProducto, productoId) => {
    validarImagenProducto(archivo);

    // Añade un UUID para que varias fotos elegidas al mismo tiempo no choquen en Storage.
    const ruta = `${productoId}-${crearSlug(nombreProducto)}-${Date.now().toString(36)}-${crypto.randomUUID()}.${EXTENSIONES[archivo.type]}`;
    const { error } = await obtenerCliente().storage.from(BUCKET_PRODUCTOS).upload(ruta, archivo, {
        contentType: archivo.type,
        upsert: false,
    });
    if (error) verificar({ error });
    return ruta;
};

const subirImagenesProducto = async (archivos, nombreProducto, productoId) => {
    // Conserva las rutas subidas para poder quitarlas si una foto falla a mitad del proceso.
    const rutas = [];
    try {
        for (const archivo of archivos) rutas.push(await subirImagenProducto(archivo, nombreProducto, productoId));
        return rutas;
    } catch (error) {
        if (rutas.length) await quitarImagenes(rutas);
        throw error;
    }
};

/* Una imagen huérfana no afecta al catálogo: si no se puede quitar, solo se avisa en consola. */
const quitarImagenes = async (rutas) => {
    // Elimina duplicados y valores vacíos antes de solicitar la limpieza a Storage.
    const rutasUnicas = [...new Set(rutas.filter(Boolean))];
    if (!rutasUnicas.length) return;
    const { error } = await obtenerCliente().storage.from(BUCKET_PRODUCTOS).remove(rutasUnicas);
    if (error) console.warn("No se pudieron borrar imágenes del producto:", error.message);
};

/* Las fotos son opcionales. Si no se guarda el producto, se limpian las imágenes recién subidas. */
export const crearProducto = async (datos, archivos = []) => {
    // Valida el límite también en la API por si se omite el formulario.
    if (archivos.length > MAXIMO_IMAGENES_PRODUCTO) throw new Error(`Puedes guardar máximo ${MAXIMO_IMAGENES_PRODUCTO} fotos por producto.`);
    const id = crypto.randomUUID();
    // Sube primero las fotos para guardar sus rutas junto con el producto.
    const imagenesRutas = await subirImagenesProducto(archivos, datos.nombre, id);

    try {
        const fila = verificar(
            await obtenerCliente()
                .from("productos")
                // Un producto nuevo todavía no tiene ventas: su stock inicial se guarda junto con él.
                .insert({ id, ...aFila(datos), stock: Number(datos.stock), imagen_ruta: imagenesRutas[0] ?? null, imagenes_rutas: imagenesRutas })
                .select(COLUMNAS_GESTION)
                .single()
        );
        return aProducto(fila);
    } catch (error) {
        await quitarImagenes(imagenesRutas);
        throw error;
    }
};

/* Suma o resta unidades sobre el stock que haya en la base en ese momento. Devuelve el stock nuevo. */
export const ajustarStock = async (id, cambio) =>
    verificar(await obtenerCliente().rpc("ajustar_stock_producto", { p_producto_id: id, p_cambio: cambio }));

/*
    Pone una cantidad exacta. "stockAnterior" es el valor que se estaba viendo: si alguien
    (otro gestor o un pedido confirmado) lo cambió mientras tanto, la base rechaza el cambio.
*/
export const fijarStock = async (id, stock, stockAnterior) =>
    verificar(await obtenerCliente().rpc("fijar_stock_producto", { p_producto_id: id, p_stock: stock, p_stock_anterior: stockAnterior }));

/*
    Actualiza datos y fotos; guarda primero las nuevas y limpia las que se quitaron tras confirmar el cambio.
    Si el stock del formulario es distinto al que tenía el producto, se guarda al final con fijarStock.
*/
export const actualizarProducto = async (id, datos, archivos = [], imagenesAnteriores = [], stockAnterior = null) => {
    // Cuenta fotos conservadas y nuevas antes de subir archivos innecesarios.
    if (datos.imagenesRutas && datos.imagenesRutas.length + archivos.length > MAXIMO_IMAGENES_PRODUCTO) {
        throw new Error(`Puedes guardar máximo ${MAXIMO_IMAGENES_PRODUCTO} fotos por producto.`);
    }
    // Mantiene las fotos actuales y agrega las rutas de los archivos recién subidos.
    const imagenesSubidas = await subirImagenesProducto(archivos, datos.nombre ?? "producto", id);
    const imagenesRutas = datos.imagenesRutas ? [...datos.imagenesRutas, ...imagenesSubidas] : undefined;

    let fila;
    try {
        [fila] = exigirFilas(
            verificar(
                await obtenerCliente()
                    .from("productos")
                    .update({
                        ...aFila(datos),
                        ...(imagenesRutas && { imagenes_rutas: imagenesRutas, imagen_ruta: imagenesRutas[0] ?? null }),
                    })
                    .eq("id", id)
                    .select(COLUMNAS_GESTION)
            )
        );
    } catch (error) {
        await quitarImagenes(imagenesSubidas);
        throw error;
    }

    // Borra las fotos retiradas solo después de confirmar que la fila se actualizó.
    if (imagenesRutas) await quitarImagenes(imagenesAnteriores.filter((ruta) => !imagenesRutas.includes(ruta)));

    const stockNuevo = datos.stock === undefined ? null : Number(datos.stock);
    if (stockNuevo !== null && stockAnterior !== null && stockNuevo !== stockAnterior) {
        try {
            fila.stock = await fijarStock(id, stockNuevo, stockAnterior);
        } catch (error) {
            const errorStock = new Error(`Se guardaron los demás datos, pero no el stock. ${error.message}`);
            // Avisa a la página que el producto sí cambió y que debe recargarlo.
            errorStock.datosGuardados = true;
            throw errorStock;
        }
    }
    return aProducto(fila);
};

export const toggleActivo = async (id, activo) => {
    exigirFilas(verificar(await obtenerCliente().from("productos").update({ activo }).eq("id", id).select("id")));
};

/* La base no deja borrar un producto que aparece en pedidos: responde con un mensaje que sugiere desactivarlo. */
export const borrarProducto = async (id) => {
    const [fila] = exigirFilas(
        verificar(await obtenerCliente().from("productos").delete().eq("id", id).select("imagen_ruta, imagenes_rutas"))
    );
    // Limpia todas las fotos vinculadas, incluida la ruta de compatibilidad antigua.
    await quitarImagenes([...(fila.imagenes_rutas ?? []), fila.imagen_ruta]);
};
