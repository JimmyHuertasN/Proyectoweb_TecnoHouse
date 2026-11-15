import { Link } from "react-router-dom";

/* Nombre de la marca. Lleva a la portada, o a "destino" dentro de los paneles. */
const Logotipo = ({ destino = "/", className = "text-xl" }) => (
    <Link to={destino} className={`shrink-0 font-extrabold tracking-tight text-white ${className}`} aria-label="TecnoHouse, ir al inicio">
        Tecno<span className="text-marca">House</span>
    </Link>
);

export default Logotipo;
