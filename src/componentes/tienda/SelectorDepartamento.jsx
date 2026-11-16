import { DEPARTAMENTOS_COLOMBIA } from "../../datos/departamentosColombia.js";
import SelectorBusqueda from "./SelectorBusqueda.jsx";

const SelectorDepartamento = (props) => (
    <SelectorBusqueda
        {...props}
        id="departamento-entrega"
        options={DEPARTAMENTOS_COLOMBIA}
        placeholder="Busca o selecciona"
        listLabel="Departamentos de Colombia"
    />
);

export default SelectorDepartamento;
