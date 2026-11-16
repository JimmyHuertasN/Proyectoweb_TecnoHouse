/* Enlaces de WhatsApp con un mensaje ya escrito: consulta de un producto o pedido del carrito. */
import { CONTACTO } from "../datos/contacto.js";
import { formatearPesos } from "./formato.js";

const telefonoWhatsApp = CONTACTO.whatsapp.replace(/\D/g, "");

export const whatsappConfigurado = CONTACTO.whatsappConfigurado && telefonoWhatsApp.length >= 8 && telefonoWhatsApp.length <= 15;

export const enlaceWhatsApp = (mensaje) => `https://wa.me/${telefonoWhatsApp}?text=${encodeURIComponent(mensaje)}`;

export const enlaceConsultaProducto = (nombreProducto) => enlaceWhatsApp(`Hola, consulto por ${nombreProducto}`);

/* Incluye el número registrado para que el negocio ubique el pedido al recibir el mensaje. */
export const enlacePedido = (lineas, total, numeroPedido) => {
    const detalle = lineas
        .map(({ producto, cantidad }) => `- ${cantidad} x ${producto.nombre} = ${formatearPesos(producto.precio * cantidad)}`)
        .join("\n");

    return enlaceWhatsApp(`Hola, registré el pedido #${numeroPedido} en TecnoHouse:\n${detalle}\nTotal: ${formatearPesos(total)}`);
};
