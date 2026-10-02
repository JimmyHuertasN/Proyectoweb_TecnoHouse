import { Link } from "react-router-dom";

const BarraNavegacion = () => {
    return (
        <header className="navbar">
            <Link className="logo" to="/">TECNO<span>HOUSE</span></Link>
            <nav>
                <ul className="nav-links">
                    <li><a href="#inicio">Inicio</a></li>
                    <li><a href="#servicios">Servicios</a></li>
                    <li><a href="#tecnicos">Técnicos</a></li>
                    <li><a href="#catalogo">Catálogo</a></li>
                    <li><a href="#ubicacion">Ubicación</a></li>
                </ul>
            </nav>

            <div className="nav-buttons">
                <Link to="/login" className="login-button">Iniciar Sesión</Link>
                <Link to="/registro" className="register-button">Registrarse</Link>
            </div>
        </header>
    );
};

export default BarraNavegacion;
