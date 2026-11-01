/*
 * Reemplaza y confirma estos valores en un solo lugar antes de publicar el sitio.
 * Un dato con `Configurado: false` no debe mostrarse como enlace ni habilitar
 * una acción de contacto, aunque tenga un formato aparentemente válido.
 */
export const CONTACTO = {
    telefono: "3044748157",
    whatsapp: "+57 304 4748157",
    correo: "mbjuancamilo16@gmail.com",
    correoConfigurado: true,
    horario: "8:00 a.m. - 6:00 p.m. Lunes a Viernes",
    horarioConfigurado: false,
    direccion: "Sede Hurtado, vía a Patillal, Valledupar, Cesar, Colombia",
    redes: [
        { nombre: "Instagram", url: "" },
        { nombre: "Facebook", url: "" },
    ],
    // Coordenadas de referencia; no se usan hasta confirmar la dirección.
    coordenadas: {
        latitud: 10.50067,
        longitud: -73.26938,
    },
};

export const PENDIENTES_CONTACTO = [
    "Confirmar el teléfono público y el número de WhatsApp.",
    "Confirmar el horario de atención.",
    "Confirmar la dirección y las coordenadas de la sede.",
    "Confirmar las URL oficiales de Instagram y Facebook.",
    "Verificar que el correo público sea el buzón definitivo de TecnoHouse.",
];
