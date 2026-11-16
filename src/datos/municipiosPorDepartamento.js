import municipiosDane from "./municipiosColombia.json";

const normalizar = (texto) => texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/[^a-z0-9]/g, "");

// DIVIPOLA del DANE; el departamento insular incluye el prefijo "Archipiélago de".
export const obtenerMunicipiosDepartamento = (departamento) => {
    if (!departamento) return [];
    const clave = normalizar(departamento);
    const claveDane = clave === "sanandresprovidenciaysantacatalina"
        ? "archipielagodesanandresprovidenciaysantacatalina"
        : clave;
    return municipiosDane[claveDane] ?? [];
};
