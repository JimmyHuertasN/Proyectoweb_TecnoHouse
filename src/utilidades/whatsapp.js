/* Enlaces de WhatsApp con un mensaje ya escrito: consulta de un producto o pedido del carrito. */
import { CONTACTO } from "../datos/contacto.js";
import { codigoPedido, formatearPesosWhatsApp } from "./formato.js";
import { mensajeRespuestaPedido } from "../datos/mensajesPedido.js";

const telefonoWhatsApp = CONTACTO.whatsapp.replace(/\D/g, "");

export const whatsappConfigurado = CONTACTO.whatsappConfigurado && telefonoWhatsApp.length >= 8 && telefonoWhatsApp.length <= 15;

export const enlaceWhatsApp = (mensaje) => `https://wa.me/${telefonoWhatsApp}?text=${encodeURIComponent(mensaje)}`;

export const enlaceConsultaProducto = (nombreProducto) => enlaceWhatsApp(`Hola, consulto por ${nombreProducto}`);

/* Incluye el número registrado para que el negocio ubique el pedido al recibir el mensaje. */
export const enlacePedido = (pedido, lineas) => {
    const detalle = lineas.map(({ producto, cantidad }) => `* ${producto.nombre} x${cantidad} — ${formatearPesosWhatsApp(producto.precio * cantidad)}`).join("\n");
    const mensaje = `Hola, TecnoHouse. Quiero confirmar mi pedido.\nNúmero de pedido: ${codigoPedido(pedido.numero)}\n\nProductos:\n${detalle}\n\nTotal: ${formatearPesosWhatsApp(pedido.total)}\nQuisiera coordinar el pago y el envío de mi pedido.`;
    return enlaceWhatsApp(mensaje);
};

export const enlaceRespuestaPedido = (pedido) => {
    const digitos = String(pedido.clienteTelefono ?? "").replace(/\D/g, "");
    const numero = digitos.length === 10 && digitos.startsWith("3") ? `57${digitos}` : digitos;
    if (numero.length < 8 || numero.length > 15) return null;
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensajeRespuestaPedido(pedido))}`;
};
