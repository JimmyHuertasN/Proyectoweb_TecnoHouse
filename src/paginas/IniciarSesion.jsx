import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Aviso from "../componentes/Aviso.jsx";
import DisenoAutenticacion from "../componentes/DisenoAutenticacion.jsx";
import ReenviarConfirmacion from "../componentes/ReenviarConfirmacion.jsx";
import { useSesion } from "../contexto/ContextoSesion.js";
import { rutaInicio } from "../utilidades/rutas.js";

const IniciarSesion = () => {
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [verContrasena, setVerContrasena] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
    // Si la cuenta existe pero no ha confirmado el correo, se ofrece reenviarlo.
    const [sinConfirmar, setSinConfirmar] = useState(false);
    // Evita enviar varias solicitudes de autenticación mientras Supabase responde.
    const [enviando, setEnviando] = useState(false);
    const { iniciarSesion } = useSesion();
    const navegar = useNavigate();
    const ubicacion = useLocation();
    const temporizadorRef = useRef(null);

    useEffect(() => {
        return () => clearTimeout(temporizadorRef.current);
    }, []);

    const manejarEnvio = async (evento) => {
        evento.preventDefault();
        if (enviando) return;

        // Validación del formulario: los dos campos son obligatorios.
        if (!correo.trim() || !contrasena) {
            setMensaje({ texto: "Escribe tu correo y tu contraseña.", tipo: "error" });
            return;
        }

        // Oculta el enlace de reenvío de un intento anterior mientras se valida este intento.
        setSinConfirmar(false);
        setEnviando(true);

        // La verificación de la cuenta y la contraseña la hace Supabase (src/api/usuarios.js).
        try {
            const usuario = await iniciarSesion(correo.trim().toLowerCase(), contrasena);
            setMensaje({ texto: `¡Hola ${usuario.nombre}! Entrando a tu panel...`, tipo: "exito" });

            // Se va a la página principal de su rol; si RutaProtegida lo trajo desde una página de
            // esa misma sección (ej. /cliente/perfil), se le devuelve allí.
            const inicio = rutaInicio(usuario.rol);
            const pedida = ubicacion.state?.desde;
            const destino = pedida?.startsWith(inicio) && inicio !== "/" ? pedida : inicio;
            temporizadorRef.current = setTimeout(() => navegar(destino, { replace: true }), 1200);
        } catch (errorApi) {
            setMensaje({ texto: errorApi.message, tipo: "error" });
            setSinConfirmar(errorApi.codigo === "email_not_confirmed");
            setEnviando(false);
        }
    };

    return (
        <DisenoAutenticacion
            antetitulo="Bienvenido de nuevo"
            titulo="Inicia sesión"
            descripcion="Ingresa con la cuenta que creaste para consultar tus solicitudes de servicio."
        >
            <Aviso texto={mensaje.texto} tipo={mensaje.tipo} />
            {sinConfirmar && <ReenviarConfirmacion correo={correo.trim().toLowerCase()} />}

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
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-400">
                            <input
                                id="ver-contrasena"
                                type="checkbox"
                                className="size-4 cursor-pointer accent-marca"
                                checked={verContrasena}
                                onChange={(evento) => setVerContrasena(evento.target.checked)}
                            />
                            Mostrar contraseña
                        </label>
                        <Link to="/recuperar" className="text-[13px] font-semibold text-marca hover:underline">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                </div>

                <button className="boton-primario w-full py-3 text-[15px] font-bold" type="submit" disabled={enviando}>
                    {enviando ? "Entrando..." : "Entrar"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
                ¿Aún no tienes una cuenta? <Link to="/registro" className="font-bold text-marca hover:underline">Regístrate aquí</Link>
            </p>
        </DisenoAutenticacion>
    );
};

export default IniciarSesion;
