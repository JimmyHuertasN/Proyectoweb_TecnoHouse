/* Categorías persistidas en servicios.categoria y reutilizadas por el formulario. */
export const CATEGORIAS_PROBLEMAS = [
    "Pantalla",
    "No enciende",
    "Batería y carga",
    "Temperatura",
    "Conexión",
    "Lectura de discos",
    "Lentitud y software",
    "Audio",
    "Otros",
];

/* Clasificación heredada para utilidades que aún necesiten interpretar texto libre. */
const CATEGORIAS = [
    { nombre: "Pantalla", palabras: ["pantalla", "display", "tactil", "touch", "vidrio"] },
    { nombre: "No enciende", palabras: ["no enciende", "no prende", "no arranca"] },
    { nombre: "Batería y carga", palabras: ["bateria", "carga", "cargador"] },
    { nombre: "Temperatura", palabras: ["calienta", "temperatura", "ventilador"] },
    { nombre: "Conexión", palabras: ["control", "conecta", "conexion", "wifi", "bluetooth", "puerto", "usb"] },
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
