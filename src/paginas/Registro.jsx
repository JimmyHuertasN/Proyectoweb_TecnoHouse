import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BarraNavegacionAutenticacion from "../componentes/BarraNavegacionAutenticacion.jsx";
import MensajeFormulario from "../componentes/MensajeFormulario.jsx";
import { useAuth } from "../hooks/useAuth.js";

const VALORES_INICIALES = {
    nombre: "",
    correo: "",
    telefono: "",
    contrasena: "",
    confirmarContrasena: "",
};

const Registro = () => {
    const [valores, setValores] = useState(VALORES_INICIALES);
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
    const navegar = useNavigate();
    const temporizadorRef = useRef(null);
    const { registrar } = useAuth();

    // Evita navegar a una página ya desmontada si el usuario se va antes de que termine la espera.
    useEffect(() => {
        return () => clearTimeout(temporizadorRef.current);
    }, []);

    const manejarCambio = (evento) => {
        const { name, value } = evento.target;
        setValores((anteriores) => ({ ...anteriores, [name]: value }));
    };

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        const nombre = valores.nombre.trim();
        const correo = valores.correo.trim().toLowerCase();
        const telefono = valores.telefono.trim();
        const { contrasena, confirmarContrasena } = valores;

        // Validación 1: ningún campo puede quedar vacío.
        if (!nombre || !correo || !telefono || !contrasena || !confirmarContrasena) {
            setMensaje({ texto: "Por favor completa todos los campos.", tipo: "error" });
            return;
        }

        // Validación 2: el correo debe tener un formato válido.
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            setMensaje({ texto: "Escribe un correo electrónico válido.", tipo: "error" });
            return;
        }

        // Validación 3: la contraseña debe tener mínimo 8 caracteres.
        if (contrasena.length < 8) {
            setMensaje({ texto: "La contraseña debe tener al menos 8 caracteres.", tipo: "error" });
            return;
        }

        // Validación 4: las dos contraseñas deben coincidir.
        if (contrasena !== confirmarContrasena) {
            setMensaje({ texto: "Las contraseñas no coinciden.", tipo: "error" });
            return;
        }

        try {
            const { session } = await registrar({ nombre, telefono, correo, contrasena });
            const texto = session
                ? "¡Cuenta creada! Entrando a TecnoHouse..."
                : "Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.";
            setMensaje({ texto, tipo: "exito" });
            setValores(VALORES_INICIALES);

            temporizadorRef.current = setTimeout(() => {
                navegar(session ? "/" : "/login");
            }, 1800);
        } catch (error) {
            const texto = error.message?.toLowerCase().includes("already registered")
                ? "Ese correo ya tiene una cuenta. Inicia sesión."
                : `No se pudo crear la cuenta: ${error.message}`;
            setMensaje({ texto, tipo: "error" });
        }
    };

    return (
        <div className="register-page">
            <BarraNavegacionAutenticacion />

            <main className="register-main">
                <section className="register-card" aria-labelledby="register-title">
                    <p className="subtitle">CREA TU CUENTA</p>
                    <h1 id="register-title">Regístrate en TecnoHouse</h1>
                    <p className="register-description">Completa tus datos para gestionar tus solicitudes de servicio.</p>

                    <MensajeFormulario texto={mensaje.texto} tipo={mensaje.tipo} />

                    <form className="register-form" noValidate onSubmit={manejarEnvio}>
                        <div className="form-group">
                            <label htmlFor="nombre">Nombre completo</label>
                            <input
                                id="nombre"
                                name="nombre"
                                type="text"
                                placeholder="Ej. Ana Pérez"
                                autoComplete="name"
                                value={valores.nombre}
                                onChange={manejarCambio}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="correo">Correo electrónico</label>
                            <input
                                id="correo"
                                name="correo"
                                type="email"
                                placeholder="correo@ejemplo.com"
                                autoComplete="email"
                                value={valores.correo}
                                onChange={manejarCambio}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="telefono">Teléfono</label>
                            <input
                                id="telefono"
                                name="telefono"
                                type="tel"
                                placeholder="Ej. 300 123 4567"
                                autoComplete="tel"
                                value={valores.telefono}
                                onChange={manejarCambio}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="contrasena">Contraseña</label>
                            <input
                                id="contrasena"
                                name="contrasena"
                                type="password"
                                placeholder="Mínimo 8 caracteres"
                                minLength={8}
                                autoComplete="new-password"
                                value={valores.contrasena}
                                onChange={manejarCambio}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmarContrasena">Confirmar contraseña</label>
                            <input
                                id="confirmarContrasena"
                                name="confirmarContrasena"
                                type="password"
                                placeholder="Repite tu contraseña"
                                minLength={8}
                                autoComplete="new-password"
                                value={valores.confirmarContrasena}
                                onChange={manejarCambio}
                                required
                            />
                        </div>

                        <button className="register-submit" type="submit">Crear cuenta</button>
                    </form>

                    <p className="login-hint">¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link></p>
                </section>
            </main>
        </div>
    );
};

export default Registro;
