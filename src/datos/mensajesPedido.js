import { codigoPedido, primerNombre } from "../utilidades/formato.js";

export const mensajeRespuestaPedido = (pedido) => `¡Hola, ${primerNombre(pedido.clienteNombre)}! 👋 Bienvenido a TecnoHouse.
¡Gracias por realizar tu pedido! 🛒💻
Pedido: ${codigoPedido(pedido.numero)}

Hemos recibido tu solicitud correctamente y estamos listos para ayudarte a completar tu compra.

Para continuar con el proceso, por favor confírmanos los siguientes datos:
📌 Nombre completo:
📍 Dirección de entrega:
🏙️ Ciudad:
📞 Número de contacto:

Una vez recibamos esta información, verificaremos la disponibilidad de los productos y te brindaremos los detalles del pago y el envío.
¡Gracias por confiar en TecnoHouse! 💙`;
