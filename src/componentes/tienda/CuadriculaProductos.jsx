import TarjetaProductoTienda from "./TarjetaProductoTienda.jsx";

// Dos columnas en celulares; después, tantas columnas como quepan. Con pocos productos
// las tarjetas conservan su ancho en lugar de estirarse para llenar la fila.
const CLASE_CUADRICULA = "grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(13.5rem,1fr))] sm:gap-5";

const SILUETAS = [1, 2, 3, 4, 5, 6];

/* Lista de productos de la tienda. Mientras "cargando" es true muestra siluetas del mismo tamaño. */
const CuadriculaProductos = ({ productos, cargando = false }) => {
    if (cargando) {
        return (
            <div role="status" aria-label="Cargando productos" className={CLASE_CUADRICULA}>
                {SILUETAS.map((numero) => <div key={numero} className="aspect-[3/5] animate-pulse rounded-2xl bg-tarjeta" />)}
            </div>
        );
    }

    return (
        <ul className={CLASE_CUADRICULA}>
            {productos.map((producto) => <TarjetaProductoTienda key={producto.id} producto={producto} />)}
        </ul>
    );
};

export default CuadriculaProductos;
