import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Aviso from "../componentes/Aviso.jsx";
import DisenoAutenticacion from "../componentes/DisenoAutenticacion.jsx";
import { useSesion } from "../contexto/ContextoSesion.js";

const IniciarSesion = () => {
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [verContrasena, setVerContrasena] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
    const { iniciarSesion } = useSesion();
    const navegar = useNavigate();
    const ubicacion = useLocation();
    const temporizadorRef = useRef(null);

    // Si RutaProtegida nos trajo aquí, al entrar volvemos a la página que se pidió.
    const destino = ubicacion.state?.desde ?? "/panel";

    useEffect(() => {
        return () => clearTimeout(temporizadorRef.current);
    }, []);

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        // Validación del formulario: los dos campos son obligatorios.
        if (!correo.trim() || !contrasena) {
            setMensaje({ texto: "Escribe tu correo y tu contraseña.", tipo: "error" });
            return;
        }

        // La verificación de la cuenta y la contraseña la hace la API (src/api/usuarios.js).
        try {
            const usuario = await iniciarSesion(correo, contrasena);
            setMensaje({ texto: `¡Hola ${usuario.nombre}! Entrando a tu panel...`, tipo: "exito" });
            temporizadorRef.current = setTimeout(() => navegar(destino, { replace: true }), 1200);
        } catch (errorApi) {
            setMensaje({ texto: errorApi.message, tipo: "error" });
        }
    };

    return (
        <DisenoAutenticacion
            antetitulo="Bienvenido de nuevo"
            titulo="Inicia sesión"
            descripcion="Ingresa con la cuenta que creaste para consultar tus solicitudes de servicio."
        >
            <Aviso texto={mensaje.texto} tipo={mensaje.tipo} />

            <form className="space-y-5" noValidate onSubmit={manejarEnvio}>
                <div>
                    <label htmlFor="correo-login" className="etiqueta">Correo electrónico</label>
                    <input
                        id="correo-login"
                        name="correo"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        autoComplete="email"
                        className="campo py-3"
                        value={correo}
                        onChange={(evento) => setCorreo(evento.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="contrasena-login" className="etiqueta">Contraseña</label>
                    <input
                        id="contrasena-login"
                        name="contrasena"
                        type={verContrasena ? "text" : "password"}
                        placeholder="Tu contraseña"
                        autoComplete="current-password"
                        className="campo py-3"
                        value={contrasena}
                        onChange={(evento) => setContrasena(evento.target.value)}
                        required
                    />
                    <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-[13px] text-slate-400">
                        <input
                            id="ver-contrasena"
                            type="checkbox"
                            className="size-4 cursor-pointer accent-marca"
                            checked={verContrasena}
                            onChange={(evento) => setVerContrasena(evento.target.checked)}
                        />
                        Mostrar contraseña
                    </label>
                </div>

                <button className="boton-primario w-full py-3 text-[15px] font-bold" type="submit">Entrar</button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
                ¿Aún no tienes una cuenta? <Link to="/registro" className="font-bold text-marca hover:underline">Regístrate aquí</Link>
            </p>
        </DisenoAutenticacion>
    );
};

export default IniciarSesion;
