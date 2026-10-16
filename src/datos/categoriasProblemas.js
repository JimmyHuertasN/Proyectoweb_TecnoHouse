/*
    Categorías para agrupar los problemas que describen los clientes con sus palabras.
    Se revisan en orden y gana la primera que coincida, por eso "No enciende" va antes
    que "Batería y carga" ("no enciende, solo parpadea la luz de carga").
*/
const CATEGORIAS = [
    { nombre: "Pantalla", palabras: ["pantalla", "display", "tactil", "touch", "vidrio"] },
    { nombre: "No enciende", palabras: ["no enciende", "no prende", "no arranca"] },
    { nombre: "Batería y carga", palabras: ["bateria", "carga", "cargador"] },
    { nombre: "Temperatura", palabras: ["calienta", "temperatura", "ventilador"] },
    { nombre: "Conexión y controles", palabras: ["control", "conecta", "wifi", "bluetooth", "puerto", "usb"] },
    { nombre: "Lectura de discos", palabras: ["disco", "lector", "lee"] },
    { nombre: "Lentitud y software", palabras: ["lento", "congela", "reinicia", "virus", "software", "sistema"] },
    { nombre: "Audio", palabras: ["audio", "sonido", "parlante", "microfono"] },
];

export const OTROS_PROBLEMAS = "Otros";

// Quita tildes y mayúsculas para que "Batería" y "bateria" cuenten igual.
const normalizar = (texto) => texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export const clasificarProblema = (descripcion = "") => {
    const texto = normalizar(descripcion);
    const categoria = CATEGORIAS.find(({ palabras }) => palabras.some((palabra) => texto.includes(palabra)));
    return categoria?.nombre ?? OTROS_PROBLEMAS;
};
