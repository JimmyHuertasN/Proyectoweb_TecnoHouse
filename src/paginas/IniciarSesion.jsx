import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BarraNavegacionAutenticacion from "../componentes/BarraNavegacionAutenticacion.jsx";
import MensajeFormulario from "../componentes/MensajeFormulario.jsx";
import { useAuth } from "../hooks/useAuth.js";

const IniciarSesion = () => {
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [verContrasena, setVerContrasena] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
    const navegar = useNavigate();
    const temporizadorRef = useRef(null);
    const { iniciarSesion } = useAuth();

    useEffect(() => {
        return () => clearTimeout(temporizadorRef.current);
    }, []);

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        const correoNormalizado = correo.trim().toLowerCase();

        // Validación 1: los dos campos son obligatorios.
        if (!correoNormalizado || !contrasena) {
            setMensaje({ texto: "Escribe tu correo y tu contraseña.", tipo: "error" });
            return;
        }

        try {
            const { user } = await iniciarSesion({ correo: correoNormalizado, contrasena });
            const nombre = user.user_metadata?.nombre || correoNormalizado;
            setMensaje({ texto: `¡Hola ${nombre}! Entrando a TecnoHouse...`, tipo: "exito" });

            temporizadorRef.current = setTimeout(() => {
                navegar("/");
            }, 1200);
        } catch (error) {
            const esCredencialInvalida = error.message?.toLowerCase().includes("invalid login credentials");
            const texto = esCredencialInvalida
                ? "El correo o la contraseña son incorrectos."
                : `No se pudo iniciar sesión: ${error.message}`;
            setMensaje({ texto, tipo: "error" });
        }
    };

    return (
        <div className="register-page">
            <BarraNavegacionAutenticacion />

            <main className="register-main">
                <section className="register-card" aria-labelledby="login-title">
                    <p className="subtitle">BIENVENIDO DE NUEVO</p>
                    <h1 id="login-title">Inicia sesión</h1>
                    <p className="register-description">Ingresa con la cuenta que creaste para consultar tus solicitudes de servicio.</p>

                    <MensajeFormulario texto={mensaje.texto} tipo={mensaje.tipo} />

                    <form className="register-form" noValidate onSubmit={manejarEnvio}>
                        <div className="form-group">
                            <label htmlFor="correo-login">Correo electrónico</label>
                            <input
                                id="correo-login"
                                name="correo"
                                type="email"
                                placeholder="correo@ejemplo.com"
                                autoComplete="email"
                                value={correo}
                                onChange={(evento) => setCorreo(evento.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="contrasena-login">Contraseña</label>
                            <input
                                id="contrasena-login"
                                name="contrasena"
                                type={verContrasena ? "text" : "password"}
                                placeholder="Tu contraseña"
                                autoComplete="current-password"
                                value={contrasena}
                                onChange={(evento) => setContrasena(evento.target.value)}
                                required
                            />
                            <label className="show-password">
                                <input
                                    id="ver-contrasena"
                                    type="checkbox"
                                    checked={verContrasena}
                                    onChange={(evento) => setVerContrasena(evento.target.checked)}
                                />
                                Mostrar contraseña
                            </label>
                        </div>

                        <button className="register-submit" type="submit">Entrar</button>
                    </form>

                    <p className="login-hint">¿Aún no tienes una cuenta? <Link to="/registro">Regístrate aquí</Link></p>
                </section>
            </main>
        </div>
    );
};

export default IniciarSesion;
