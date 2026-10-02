import { Link } from "react-router-dom";

const BarraNavegacionAutenticacion = () => {
    return (
        <header className="navbar">
            <Link className="logo" to="/">TECNO<span>HOUSE</span></Link>
            <Link className="back-link" to="/">← Volver al inicio</Link>
        </header>
    );
};

export default BarraNavegacionAutenticacion;
