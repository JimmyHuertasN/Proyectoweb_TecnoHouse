import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registrarUsuario } from "../api/usuarios.js";
import Aviso from "../componentes/Aviso.jsx";
import DisenoAutenticacion from "../componentes/DisenoAutenticacion.jsx";
import { validarDatosPersonales } from "../utilidades/validaciones.js";

const CAMPOS = [
    { nombre: "nombre", etiqueta: "Nombre completo", tipo: "text", placeholder: "Ej. Ana Pérez", autoComplete: "name" },
    { nombre: "correo", etiqueta: "Correo electrónico", tipo: "email", placeholder: "correo@ejemplo.com", autoComplete: "email" },
    { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel", placeholder: "Ej. 300 123 4567", autoComplete: "tel" },
    { nombre: "contrasena", etiqueta: "Contraseña", tipo: "password", placeholder: "Mínimo 8 caracteres", autoComplete: "new-password" },
    { nombre: "confirmarContrasena", etiqueta: "Confirmar contraseña", tipo: "password", placeholder: "Repite tu contraseña", autoComplete: "new-password" },
];

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

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        const nombre = valores.nombre.trim();
        const correo = valores.correo.trim().toLowerCase();
        const telefono = valores.telefono.trim();
        const { contrasena, confirmarContrasena } = valores;

        // Validaciones 1 a 3: campos completos, correo y teléfono con formato válido.
        const errorDatos = validarDatosPersonales({ nombre, correo, telefono });
        if (errorDatos || !contrasena || !confirmarContrasena) {
            setMensaje({ texto: errorDatos ?? "Por favor completa todos los campos.", tipo: "error" });
            return;
        }

        // Validación 4: la contraseña debe tener mínimo 8 caracteres.
        if (contrasena.length < 8) {
            setMensaje({ texto: "La contraseña debe tener al menos 8 caracteres.", tipo: "error" });
            return;
        }

        // Validación 5: las dos contraseñas deben coincidir.
        if (contrasena !== confirmarContrasena) {
            setMensaje({ texto: "Las contraseñas no coinciden.", tipo: "error" });
            return;
        }

        // Validación 6 (la hace la API): el correo no puede estar registrado previamente.
        try {
            await registrarUsuario({ nombre, correo, telefono, contrasena });
        } catch (errorApi) {
            setMensaje({ texto: errorApi.message, tipo: "error" });
            return;
        }

        setMensaje({ texto: "¡Cuenta creada! Te llevamos al inicio de sesión...", tipo: "exito" });
        setValores(VALORES_INICIALES);

        temporizadorRef.current = setTimeout(() => {
            navegar("/login");
        }, 1500);
    };

    return (
        <DisenoAutenticacion
            antetitulo="Crea tu cuenta"
            titulo="Regístrate en TecnoHouse"
            descripcion="Completa tus datos para gestionar tus solicitudes de servicio."
        >
            <Aviso texto={mensaje.texto} tipo={mensaje.tipo} />

            <form className="space-y-5" noValidate onSubmit={manejarEnvio}>
                {CAMPOS.map((campo) => (
                    <div key={campo.nombre}>
                        <label htmlFor={campo.nombre} className="etiqueta">{campo.etiqueta}</label>
                        <input
                            id={campo.nombre}
                            name={campo.nombre}
                            type={campo.tipo}
                            placeholder={campo.placeholder}
                            autoComplete={campo.autoComplete}
                            minLength={campo.tipo === "password" ? 8 : undefined}
                            className="campo py-3"
                            value={valores[campo.nombre]}
                            onChange={manejarCambio}
                            required
                        />
                    </div>
                ))}

                <button className="boton-primario w-full py-3 text-[15px] font-bold" type="submit">Crear cuenta</button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
                ¿Ya tienes una cuenta? <Link to="/login" className="font-bold text-marca hover:underline">Inicia sesión</Link>
            </p>
        </DisenoAutenticacion>
    );
};

export default Registro;
