import { useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { listarClientes } from "../../api/admin.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import { formatearFecha, iniciales } from "../../utilidades/formato.js";

const coincideBusqueda = (cliente, busqueda) => {
    const texto = busqueda.trim().toLowerCase();
    return !texto || cliente.nombre.toLowerCase().includes(texto) || cliente.telefono.includes(texto);
};

const FilaCliente = ({ cliente }) => (
    <li>
        <Link
            to={`/admin/clientes/${cliente.id}`}
            className="flex flex-col gap-3 rounded-lg border border-borde bg-fondo/60 p-4 transition hover:border-marca/60 sm:flex-row sm:items-center"
        >
            <span className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-marca/15 text-sm font-bold text-marca sm:flex">
                {iniciales(cliente.nombre)}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{cliente.nombre}</p>
                <p className="text-sm text-slate-400">{cliente.telefono || "Sin teléfono"}</p>
            </div>
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm sm:text-right">
                <div>
                    <dt className="text-xs text-slate-500">Dispositivos</dt>
                    <dd>{cliente.dispositivos}</dd>
                </div>
                <div>
                    <dt className="text-xs text-slate-500">Servicios</dt>
                    <dd>
                        {cliente.servicios}
                        {cliente.serviciosEnCurso > 0 && <span className="text-marca"> ({cliente.serviciosEnCurso} en curso)</span>}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-slate-500">Registrado</dt>
                    <dd>{formatearFecha(cliente.registradoEn)}</dd>
                </div>
            </dl>
        </Link>
    </li>
);

const GestionClientes = () => {
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const visibles = clientes.filter((cliente) => coincideBusqueda(cliente, busqueda));

    useEffect(() => {
        let vigente = true;

        listarClientes()
            .then((lista) => vigente && setClientes(lista))
            .catch(() => vigente && setError("No se pudieron cargar los clientes."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, []);

    return (
        <>
            <EncabezadoPagina titulo="Clientes" descripcion={`${clientes.length} clientes registrados. Abre uno para ver sus equipos y servicios.`} />

            <Aviso texto={error} tipo="error" />

            {cargando && <p className="text-slate-400">Cargando clientes...</p>}

            {!cargando && !error && clientes.length === 0 && (
                <EstadoVacio icono={UsersRound} titulo="Todavía no hay clientes" descripcion="Aparecerán aquí cuando se registren en la página." />
            )}

            {clientes.length > 0 && (
                <>
                    <label htmlFor="buscar-cliente" className="sr-only">Buscar cliente</label>
                    <input
                        id="buscar-cliente"
                        type="search"
                        className="campo mb-5 max-w-md"
                        placeholder="Buscar por nombre o teléfono"
                        value={busqueda}
                        onChange={(evento) => setBusqueda(evento.target.value)}
                    />

                    {visibles.length === 0 ? (
                        <p className="py-8 text-center text-slate-400">Ningún cliente coincide con “{busqueda}”.</p>
                    ) : (
                        <ul className="space-y-3">
                            {visibles.map((cliente) => (
                                <FilaCliente key={cliente.id} cliente={cliente} />
                            ))}
                        </ul>
                    )}
                </>
            )}
        </>
    );
};

export default GestionClientes;
