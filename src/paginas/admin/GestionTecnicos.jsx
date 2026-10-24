import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { cambiarEstadoTecnico, crearTecnico, listarTecnicos } from "../../api/admin.js";
import Aviso from "../../componentes/Aviso.jsx";
import BarraFiltros from "../../componentes/panel/BarraFiltros.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FormularioTecnico from "../../componentes/panel/FormularioTecnico.jsx";
import ResultadosPaginados from "../../componentes/panel/ResultadosPaginados.jsx";
import TarjetaGestionTecnico from "../../componentes/panel/TarjetaGestionTecnico.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import { useFiltroPaginado } from "../../hooks/useFiltroPaginado.js";
import useToast from "../../hooks/useToast.js";
import { coincideTexto } from "../../utilidades/filtros.js";

const FILTROS_VACIOS = { texto: "", estado: "todos" };

const cumpleFiltrosTecnico = (tecnico, { texto, estado }) =>
    (estado === "todos" || tecnico.activo === (estado === "activos")) &&
    coincideTexto(texto, [tecnico.nombre, tecnico.telefono, tecnico.especialidad]);

const opcionesEstadoTecnico = (tecnicos) => {
    const activos = tecnicos.filter((tecnico) => tecnico.activo).length;
    return [
        { valor: "todos", etiqueta: `Todos (${tecnicos.length})` },
        { valor: "activos", etiqueta: `Activos (${activos})` },
        { valor: "desactivados", etiqueta: `Desactivados (${tecnicos.length - activos})` },
    ];
};

const GestionTecnicos = () => {
    const [tecnicos, setTecnicos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const toast = useToast();
    const [formularioAbierto, setFormularioAbierto] = useState(false);
    // Cada vez que aumenta, el useEffect vuelve a pedir la lista a Supabase.
    const [recargas, setRecargas] = useState(0);
    // Los activos primero; dentro de cada grupo se conserva el orden por nombre que trae la API.
    const ordenados = useMemo(() => [...tecnicos].sort((a, b) => Number(b.activo) - Number(a.activo)), [tecnicos]);
    const paginado = useFiltroPaginado(ordenados, cumpleFiltrosTecnico, FILTROS_VACIOS);

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
        toast.exito(mensaje);
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

    return (
        <>
            <EncabezadoPagina titulo="Técnicos" descripcion="Crea cuentas de técnicos y actívalas o desactívalas.">
                {!formularioAbierto && (
                    <button
                        type="button"
                        onClick={() => {
                            setFormularioAbierto(true);
                        }}
                        className="boton-primario"
                    >
                        + Nuevo técnico
                    </button>
                )}
            </EncabezadoPagina>

            <Aviso texto={error} tipo="error" />

            {formularioAbierto && <FormularioTecnico alCrear={manejarCreacion} alCancelar={() => setFormularioAbierto(false)} />}

            {cargando && <Skeleton tipo="tarjeta" cantidad={3} etiqueta="Cargando técnicos" />}

            {!cargando && !error && tecnicos.length === 0 && (
                <EstadoVacio icono={BriefcaseBusiness} titulo="Todavía no hay técnicos" descripcion="Crea el primero con el botón “Nuevo técnico”." />
            )}

            {tecnicos.length > 0 && (
                <section aria-labelledby="titulo-lista-tecnicos">
                    <h2 id="titulo-lista-tecnicos" className="sr-only">Listado de técnicos</h2>

                    <BarraFiltros
                        id="tecnicos"
                        etiqueta="Filtrar técnicos"
                        placeholder="Nombre, teléfono o especialidad"
                        paginado={paginado}
                        opcionesEstado={opcionesEstadoTecnico(tecnicos)}
                    />

                    <ResultadosPaginados id="tecnicos" paginado={paginado}>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {paginado.elementos.map((tecnico) => (
                                <TarjetaGestionTecnico key={tecnico.id} tecnico={tecnico} alCambiarEstado={manejarCambioEstado} />
                            ))}
                        </div>
                    </ResultadosPaginados>
                </section>
            )}
        </>
    );
};

export default GestionTecnicos;
