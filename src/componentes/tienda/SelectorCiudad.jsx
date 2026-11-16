import { obtenerMunicipiosDepartamento } from "../../datos/municipiosPorDepartamento.js";
import SelectorBusqueda from "./SelectorBusqueda.jsx";

const SelectorCiudad = ({ departamento, ...props }) => (
    <SelectorBusqueda
        {...props}
        id="ciudad-entrega"
        options={obtenerMunicipiosDepartamento(departamento)}
        disabled={!departamento}
        placeholder={departamento ? "Busca o selecciona" : "Elige primero el departamento"}
        listLabel={`Ciudades y municipios de ${departamento || "Colombia"}`}
    />
);

export default SelectorCiudad;
