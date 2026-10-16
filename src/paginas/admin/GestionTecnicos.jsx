import { useEffect, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { cambiarEstadoTecnico, crearTecnico, listarTecnicos } from "../../api/admin.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FormularioTecnico from "../../componentes/panel/FormularioTecnico.jsx";
import TarjetaGestionTecnico from "../../componentes/panel/TarjetaGestionTecnico.jsx";

const GrupoTecnicos = ({ titulo, tecnicos, alCambiarEstado }) => (
    <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">
            {titulo} <span className="text-slate-500">({tecnicos.length})</span>
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tecnicos.map((tecnico) => (
                <TarjetaGestionTecnico key={tecnico.id} tecnico={tecnico} alCambiarEstado={alCambiarEstado} />
            ))}
        </div>
    </section>
);

const GestionTecnicos = () => {
    const [tecnicos, setTecnicos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [aviso, setAviso] = useState("");
    const [formularioAbierto, setFormularioAbierto] = useState(false);
    // Cada vez que aumenta, el useEffect vuelve a pedir la lista a Supabase.
    const [recargas, setRecargas] = useState(0);

    useEffect(() => {
        let vigente = true;

        listarTecnicos()
            .then((lista) => vigente && setTecnicos(lista))
            .catch(() => vigente && setError("No se pudieron cargar los técnicos."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [recargas]);

    const terminarAccion = (mensaje) => {
        setAviso(mensaje);
        setRecargas((anterior) => anterior + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const manejarCreacion = async (datos) => {
        await crearTecnico(datos);
        setFormularioAbierto(false);
        terminarAccion(`Se creó la cuenta de ${datos.nombre}. Ya puede iniciar sesión con su correo y contraseña.`);
    };

    const manejarCambioEstado = async (tecnico, activo) => {
        await cambiarEstadoTecnico(tecnico, activo);
        terminarAccion(activo ? `${tecnico.nombre} está activo de nuevo.` : `${tecnico.nombre} quedó desactivado.`);
    };

    const activos = tecnicos.filter((tecnico) => tecnico.activo);
    const inactivos = tecnicos.filter((tecnico) => !tecnico.activo);

    return (
        <>
            <EncabezadoPagina titulo="Técnicos" descripcion="Crea cuentas de técnicos y actívalas o desactívalas.">
                {!formularioAbierto && (
                    <button
                        type="button"
                        onClick={() => {
                            setAviso("");
                            setFormularioAbierto(true);
                        }}
                        className="boton-primario"
                    >
                        + Nuevo técnico
                    </button>
                )}
            </EncabezadoPagina>

            <Aviso texto={aviso} tipo="exito" />
            <Aviso texto={error} tipo="error" />

            {formularioAbierto && <FormularioTecnico alCrear={manejarCreacion} alCancelar={() => setFormularioAbierto(false)} />}

            {cargando && <p className="text-slate-400">Cargando técnicos...</p>}

            {!cargando && !error && tecnicos.length === 0 && (
                <EstadoVacio icono={BriefcaseBusiness} titulo="Todavía no hay técnicos" descripcion="Crea el primero con el botón “Nuevo técnico”." />
            )}

            {activos.length > 0 && <GrupoTecnicos titulo="Activos" tecnicos={activos} alCambiarEstado={manejarCambioEstado} />}
            {inactivos.length > 0 && <GrupoTecnicos titulo="Desactivados" tecnicos={inactivos} alCambiarEstado={manejarCambioEstado} />}
        </>
    );
};

export default GestionTecnicos;
