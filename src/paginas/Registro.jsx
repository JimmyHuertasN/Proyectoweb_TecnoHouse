import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BarraNavegacionAutenticacion from "../componentes/BarraNavegacionAutenticacion.jsx";
import MensajeFormulario from "../componentes/MensajeFormulario.jsx";
import { BuscarUsuario, GuardarUsuarios, ObtenerUsuarios } from "../utilidades/autenticacion.js";

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

    // Evita navegar a una página ya desmontada si el usuario se va antes de que termine la espera.
    useEffect(() => {
        return () => clearTimeout(temporizadorRef.current);
    }, []);

    const manejarCambio = (evento) => {
        const { name, value } = evento.target;
        setValores((anteriores) => ({ ...anteriores, [name]: value }));
    };

    const manejarEnvio = (evento) => {
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

        // Validación 5: el correo no puede estar registrado previamente.
        if (BuscarUsuario(correo)) {
            setMensaje({ texto: "Ese correo ya tiene una cuenta. Inicia sesión.", tipo: "error" });
            return;
        }

        const usuarios = ObtenerUsuarios();
        usuarios.push({ nombre, correo, telefono, contrasena });
        GuardarUsuarios(usuarios);

        setMensaje({ texto: "¡Cuenta creada! Te llevamos al inicio de sesión...", tipo: "exito" });
        setValores(VALORES_INICIALES);

        temporizadorRef.current = setTimeout(() => {
            navegar("/login");
        }, 1500);
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
