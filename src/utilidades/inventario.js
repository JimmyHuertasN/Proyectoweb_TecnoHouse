/* Cálculos del inventario de la tienda. Reciben la lista de productos y devuelven datos. */

// Con esta cantidad o menos, un producto se marca como "por reponer".
export const POCAS_UNIDADES = 3;

export const resumenInventario = (productos) => {
    const activos = productos.filter((producto) => producto.activo);

    return {
        total: productos.length,
        activos: activos.length,
        agotados: activos.filter((producto) => producto.stock === 0).length,
        pocoStock: activos.filter((producto) => producto.stock > 0 && producto.stock <= POCAS_UNIDADES).length,
        valor: activos.reduce((suma, producto) => suma + producto.precio * producto.stock, 0),
    };
};

/* Unidades en stock de los productos activos, sumadas por categoría y ordenadas de mayor a menor. */
export const stockPorCategoria = (productos) => {
    const suma = {};
    productos
        .filter((producto) => producto.activo)
        .forEach((producto) => {
            suma[producto.categoria] = (suma[producto.categoria] ?? 0) + producto.stock;
        });

    return Object.keys(suma)
        .map((categoria) => ({ categoria, unidades: suma[categoria] }))
        .sort((a, b) => b.unidades - a.unidades);
};

/* Productos a la venta que están agotados o casi, empezando por los de menos stock. */
export const productosPorReponer = (productos) =>
    productos
        .filter((producto) => producto.activo && producto.stock <= POCAS_UNIDADES)
        .sort((a, b) => a.stock - b.stock);
