import { useEffect, useState } from "react";
import { UserCog } from "lucide-react";
import { actualizarGestor, crearGestor, darAccesoGestor, listarGestores, retirarAccesoGestor } from "../../api/gestores.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FormularioGestor from "../../componentes/panel/admin/FormularioGestor.jsx";
import TarjetaGestor from "../../componentes/panel/admin/TarjetaGestor.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import useToast from "../../hooks/useToast.js";
import { esCorreoValido } from "../../utilidades/validaciones.js";

/* Da el rol de gestor a una cuenta de cliente que ya existe (por ejemplo, alguien que ya se registró). */
const FormularioDarAcceso = ({ alDar, alCancelar }) => {
    const [correo, setCorreo] = useState("");
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);

    const manejarEnvio = async (evento) => {
        evento.preventDefault();
        if (enviando) return;
        const limpio = correo.trim().toLowerCase();
        if (!esCorreoValido(limpio)) {
            setError("Escribe un correo electrónico válido.");
            return;
        }

        setError("");
        setEnviando(true);
        try {
            await alDar(limpio);
        } catch (errorApi) {
            setError(errorApi.message);
            setEnviando(false);
        }
    };

    return (
        <form onSubmit={manejarEnvio} noValidate className="tarjeta mb-8">
            <h2 className="mb-1 text-lg font-semibold">Dar acceso a una cuenta existente</h2>
            <p className="mb-5 text-sm text-slate-400">Solo se puede convertir en gestor una cuenta de cliente. Técnicos y administradores no cambian de rol.</p>
            <Aviso texto={error} tipo="error" />
            <label htmlFor="acceso-correo" className="etiqueta">Correo de la cuenta</label>
            <input id="acceso-correo" type="email" autoComplete="off" className="campo" placeholder="cliente@correo.com" value={correo} onChange={(evento) => setCorreo(evento.target.value)} />
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={alCancelar} className="boton-secundario">Cancelar</button>
                <button type="submit" disabled={enviando} className="boton-primario">{enviando ? "Dando acceso..." : "Dar acceso"}</button>
            </div>
        </form>
    );
};

/* Administración de las cuentas con rol "gestor_tienda". No es un editor general de permisos. */
const GestionGestores = () => {
    const toast = useToast();
    const [gestores, setGestores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    // null, "crear" o "acceso": qué formulario está abierto.
    const [formulario, setFormulario] = useState(null);
    const [recargas, setRecargas] = useState(0);

    useEffect(() => {
        let vigente = true;

        listarGestores()
            .then((lista) => vigente && setGestores(lista))
            .catch((errorApi) => vigente && setError(errorApi.message || "No se pudieron cargar los gestores."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [recargas]);

    const terminar = (mensaje) => {
        setFormulario(null);
        setRecargas((anterior) => anterior + 1);
        toast.exito(mensaje);
    };

    const crear = async (datos) => {
        await crearGestor(datos);
        terminar(`Se creó la cuenta de ${datos.nombre}. Ya puede iniciar sesión con su correo y contraseña.`);
    };

    const darAcceso = async (correo) => {
        await darAccesoGestor(correo);
        terminar(`${correo} ahora es gestor de tienda.`);
    };

    const guardar = async (gestor, datos) => {
        await actualizarGestor(gestor.id, datos);
        terminar(`Se guardaron los datos de ${datos.nombre}.`);
    };

    const retirar = async (gestor) => {
        await retirarAccesoGestor(gestor.id);
        terminar(`${gestor.nombre} ya no es gestor de tienda.`);
    };

    return (
        <>
            <EncabezadoPagina titulo="Gestores de tienda" descripcion="Personas que administran productos, inventario y pedidos. No ven reparaciones, usuarios ni estadísticas generales.">
                {!formulario && (
                    <>
                        <button type="button" onClick={() => setFormulario("acceso")} className="boton-secundario">Dar acceso</button>
                        <button type="button" onClick={() => setFormulario("crear")} className="boton-primario">+ Nuevo gestor</button>
                    </>
                )}
            </EncabezadoPagina>

            <Aviso texto={error} tipo="error" />

            {formulario === "crear" && <FormularioGestor alCrear={crear} alCancelar={() => setFormulario(null)} />}
            {formulario === "acceso" && <FormularioDarAcceso alDar={darAcceso} alCancelar={() => setFormulario(null)} />}

            {cargando && <Skeleton tipo="tarjeta" cantidad={2} etiqueta="Cargando gestores" />}

            {!cargando && !error && gestores.length === 0 && (
                <EstadoVacio icono={UserCog} titulo="Todavía no hay gestores de tienda" descripcion="Crea una cuenta nueva o da acceso a una cuenta de cliente que ya exista." />
            )}

            {gestores.length > 0 && (
                <section aria-labelledby="titulo-lista-gestores">
                    <h2 id="titulo-lista-gestores" className="sr-only">Listado de gestores de tienda</h2>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {gestores.map((gestor) => (
                            <TarjetaGestor key={gestor.id} gestor={gestor} alGuardar={guardar} alRetirar={retirar} />
                        ))}
                    </div>
                </section>
            )}
        </>
    );
};

export default GestionGestores;
