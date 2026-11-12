import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { obtenerPedidos } from "../../api/pedidos.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import TarjetaMetrica from "../../componentes/panel/TarjetaMetrica.jsx";
import { ESTADOS_PEDIDO } from "../../datos/estadosPedido.js";

/*
    Pedidos que llegan desde el carrito de la tienda.
    PENDIENTE BASE: cuando exista la tabla "pedidos" (ver api/pedidos.js), aquí va
    la lista con el detalle de cada pedido y el selector para cambiar su estado.
*/
const PedidosTienda = () => {
    const [pedidos, setPedidos] = useState([]);

    useEffect(() => {
        let vigente = true;
        obtenerPedidos().then((lista) => vigente && setPedidos(lista));
        return () => {
            vigente = false;
        };
    }, []);

    const contarPorEstado = (estado) => pedidos.filter((pedido) => pedido.estado === estado).length;

    return (
        <>
            <EncabezadoPagina titulo="Pedidos" descripcion="Pedidos que los clientes arman en el carrito de la tienda." />

            <Aviso texto="Esta sección está lista para cuando se cree la tabla de pedidos en la base. Por ahora los pedidos llegan por WhatsApp." />

            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {ESTADOS_PEDIDO.map((estado) => (
                    <TarjetaMetrica key={estado.valor} icono={estado.icono} titulo={estado.etiqueta} valor={contarPorEstado(estado.valor)} detalle={estado.detalle} />
                ))}
            </div>

            {pedidos.length === 0 && (
                <EstadoVacio
                    icono={ShoppingCart}
                    titulo="Todavía no hay pedidos registrados"
                    descripcion="Cuando la base guarde los pedidos del carrito, aquí podrás verlos, confirmarlos, marcarlos como entregados o cancelarlos."
                />
            )}
        </>
    );
};

export default PedidosTienda;
