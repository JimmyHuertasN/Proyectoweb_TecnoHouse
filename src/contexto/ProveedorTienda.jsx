import { useCallback, useEffect, useState } from "react";
import { obtenerProductos } from "../api/productos.js";
import { ContextoTienda } from "./ContextoTienda.js";

const CLAVE_CARRITO = "tecnohouse-carrito";

/* El carrito se guarda en el navegador para que no se pierda al recargar la página. */
const leerCarritoGuardado = () => {
    try {
        const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
        return Array.isArray(guardado) ? guardado : [];
    } catch {
        return [];
    }
};

/*
    Datos de la tienda: los productos activos y el carrito.
    El carrito solo guarda { id, cantidad }; el nombre y el precio se toman siempre del
    producto cargado, así un cambio de precio se ve reflejado.
*/
const ProveedorTienda = ({ children }) => {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [carrito, setCarrito] = useState(leerCarritoGuardado);
    const [carritoAbierto, setCarritoAbierto] = useState(false);

    const recargarProductos = useCallback(async () => {
        const lista = await obtenerProductos();
        setProductos(lista);
        setError("");
        // Al actualizar el catálogo, quita productos que ya no se venden y limita cada cantidad al stock vigente.
        setCarrito((actual) => actual.flatMap((item) => {
            const producto = lista.find((fila) => fila.id === item.id);
            const cantidad = Math.min(item.cantidad, producto?.stock ?? 0);
            return producto && cantidad > 0 ? [{ ...item, cantidad }] : [];
        }));
        return lista;
    }, []);

    useEffect(() => {
        let vigente = true;

        obtenerProductos()
            .then((lista) => {
                if (!vigente) return;
                setProductos(lista);
                setError("");
                // Al cargar el catálogo inicial también se corrigen cantidades guardadas que superan el stock actual.
                setCarrito((actual) => actual.flatMap((item) => {
                    const producto = lista.find((fila) => fila.id === item.id);
                    const cantidad = Math.min(item.cantidad, producto?.stock ?? 0);
                    return producto && cantidad > 0 ? [{ ...item, cantidad }] : [];
                }));
            })
            .catch(() => vigente && setError("No pudimos cargar la tienda en este momento."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [recargarProductos]);

    useEffect(() => {
        try {
            localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
        } catch {
            // El carrito sigue funcionando en memoria aunque el navegador bloquee o llene el almacenamiento.
        }
    }, [carrito]);

    const buscarProducto = (id) => productos.find((producto) => producto.id === id);

    // Productos del carrito que siguen a la venta, con sus datos completos.
    const lineas = carrito
        .map((item) => ({ producto: buscarProducto(item.id), cantidad: item.cantidad }))
        .filter((linea) => linea.producto);

    const cantidadEnCarrito = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
    const total = lineas.reduce((suma, linea) => suma + linea.producto.precio * linea.cantidad, 0);

    const cantidadDe = (id) => carrito.find((item) => item.id === id)?.cantidad ?? 0;

    /* Nunca deja pedir más unidades de las que hay en stock. */
    const cambiarCantidad = (id, cantidad) => {
        const producto = buscarProducto(id);
        if (!producto) return;

        const nueva = Math.min(Math.max(cantidad, 0), producto.stock);
        setCarrito((actual) => {
            if (nueva === 0) return actual.filter((item) => item.id !== id);
            if (!actual.some((item) => item.id === id)) return [...actual, { id, cantidad: nueva }];
            return actual.map((item) => (item.id === id ? { id, cantidad: nueva } : item));
        });
    };

    const agregar = (id, cantidad = 1) => cambiarCantidad(id, cantidadDe(id) + cantidad);
    const quitar = (id) => setCarrito((actual) => actual.filter((item) => item.id !== id));
    const vaciar = () => setCarrito([]);

    // Funciones fijas: el carrito lateral las usa dentro de un useEffect.
    const abrirCarrito = useCallback(() => {
        setCarritoAbierto(true);
        recargarProductos().catch(() => setError("No pudimos actualizar el stock de la tienda."));
    }, [recargarProductos]);
    const cerrarCarrito = useCallback(() => setCarritoAbierto(false), []);

    const tienda = {
        productos,
        recargarProductos,
        cargando,
        error,
        buscarProducto,
        lineas,
        cantidadEnCarrito,
        total,
        cantidadDe,
        agregar,
        cambiarCantidad,
        quitar,
        vaciar,
        carritoAbierto,
        abrirCarrito,
        cerrarCarrito,
    };

    return <ContextoTienda.Provider value={tienda}>{children}</ContextoTienda.Provider>;
};

export default ProveedorTienda;
