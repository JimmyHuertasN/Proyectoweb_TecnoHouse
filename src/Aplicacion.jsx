import { BrowserRouter, Routes, Route } from "react-router-dom";
import Inicio from "./paginas/Inicio.jsx";
import IniciarSesion from "./paginas/IniciarSesion.jsx";
import Registro from "./paginas/Registro.jsx";

const Aplicacion = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/login" element={<IniciarSesion />} />
                <Route path="/registro" element={<Registro />} />
            </Routes>
        </BrowserRouter>
    );
};

export default Aplicacion;
