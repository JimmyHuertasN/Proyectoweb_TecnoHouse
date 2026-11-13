/* Enlaces de WhatsApp con un mensaje ya escrito: consulta de un producto o pedido del carrito. */
import { CONTACTO } from "../datos/contacto.js";
import { formatearPesos } from "./formato.js";

const telefonoWhatsApp = CONTACTO.whatsapp.replace(/\D/g, "");

export const whatsappConfigurado = CONTACTO.whatsappConfigurado && telefonoWhatsApp.length >= 8 && telefonoWhatsApp.length <= 15;

export const enlaceWhatsApp = (mensaje) => `https://wa.me/${telefonoWhatsApp}?text=${encodeURIComponent(mensaje)}`;

export const enlaceConsultaProducto = (nombreProducto) => enlaceWhatsApp(`Hola, consulto por ${nombreProducto}`);

/* Arma el pedido del carrito como una lista: "- 2 x Batería ... = $ 120.000". */
export const enlacePedido = (lineas, total) => {
    const detalle = lineas
        .map(({ producto, cantidad }) => `- ${cantidad} x ${producto.nombre} = ${formatearPesos(producto.precio * cantidad)}`)
        .join("\n");

    return enlaceWhatsApp(`Hola, quiero hacer este pedido en TecnoHouse:\n${detalle}\nTotal: ${formatearPesos(total)}`);
};
