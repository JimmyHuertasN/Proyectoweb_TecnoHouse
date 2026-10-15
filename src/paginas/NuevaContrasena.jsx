import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { errorEnlaceCorreo } from "../api/supabase.js";
import { cambiarContrasena } from "../api/usuarios.js";
import Aviso from "../componentes/Aviso.jsx";
import DisenoAutenticacion from "../componentes/DisenoAutenticacion.jsx";
import { useSesion } from "../contexto/ContextoSesion.js";
import { rutaInicio } from "../utilidades/rutas.js";

/*
    Ruta /nueva-contrasena: aquí llega el enlace del correo de recuperación.
    Al abrirlo, Supabase inicia una sesión temporal que permite cambiar la contraseña.
*/
const NuevaContrasena = () => {
    const { usuario, cargando } = useSesion();
    const [valores, setValores] = useState({ contrasena: "", confirmar: "" });
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
    const [guardando, setGuardando] = useState(false);
    const navegar = useNavigate();
    const temporizadorRef = useRef(null);

    useEffect(() => {
        return () => clearTimeout(temporizadorRef.current);
    }, []);

    const manejarEnvio = async (evento) => {
        evento.preventDefault();

        if (valores.contrasena.length < 8) {
            setMensaje({ texto: "La contraseña debe tener al menos 8 caracteres.", tipo: "error" });
            return;
        }

        if (valores.contrasena !== valores.confirmar) {
            setMensaje({ texto: "Las contraseñas no coinciden.", tipo: "error" });
            return;
        }

        setGuardando(true);
        try {
            await cambiarContrasena(valores.contrasena);
            setMensaje({ texto: "¡Contraseña actualizada! Entrando a tu panel...", tipo: "exito" });
            temporizadorRef.current = setTimeout(() => navegar(rutaInicio(usuario.rol), { replace: true }), 1500);
        } catch (errorApi) {
            setMensaje({ texto: errorApi.message, tipo: "error" });
            setGuardando(false);
        }
    };

    const descripcion = "Escribe tu nueva contraseña. Úsala la próxima vez que inicies sesión.";

    if (cargando) {
        return (
            <DisenoAutenticacion antetitulo="Recupera tu acceso" titulo="Nueva contraseña" descripcion={descripcion}>
                <p className="text-slate-400">Verificando el enlace...</p>
            </DisenoAutenticacion>
        );
    }

    // Sin sesión significa que el enlace no era válido, ya se usó o expiró.
    if (!usuario || errorEnlaceCorreo) {
        return (
            <DisenoAutenticacion antetitulo="Recupera tu acceso" titulo="El enlace no es válido" descripcion="Puede que ya lo hayas usado o que haya expirado. Pide uno nuevo.">
                <Link to="/recuperar" className="boton-primario w-full py-3">Pedir un enlace nuevo</Link>
            </DisenoAutenticacion>
        );
    }

    return (
        <DisenoAutenticacion antetitulo="Recupera tu acceso" titulo="Nueva contraseña" descripcion={descripcion}>
            <Aviso texto={mensaje.texto} tipo={mensaje.tipo} />

            <form className="space-y-5" noValidate onSubmit={manejarEnvio}>
                <div>
                    <label htmlFor="contrasena-nueva" className="etiqueta">Nueva contraseña</label>
                    <input
                        id="contrasena-nueva"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        className="campo py-3"
                        value={valores.contrasena}
                        onChange={(evento) => setValores({ ...valores, contrasena: evento.target.value })}
                    />
                </div>
                <div>
                    <label htmlFor="contrasena-confirmar" className="etiqueta">Confirmar contraseña</label>
                    <input
                        id="contrasena-confirmar"
                        type="password"
                        placeholder="Repite la contraseña"
                        autoComplete="new-password"
                        className="campo py-3"
                        value={valores.confirmar}
                        onChange={(evento) => setValores({ ...valores, confirmar: evento.target.value })}
                    />
                </div>

                <button className="boton-primario w-full py-3 text-[15px] font-bold" type="submit" disabled={guardando}>
                    {guardando ? "Guardando..." : "Guardar contraseña"}
                </button>
            </form>
        </DisenoAutenticacion>
    );
};

export default NuevaContrasena;
