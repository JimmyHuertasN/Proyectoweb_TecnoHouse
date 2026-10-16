import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { obtenerFichaCliente } from "../../api/admin.js";
import { actualizarPerfil } from "../../api/usuarios.js";
import EstadoVacio from "../../componentes/panel/EstadoVacio.jsx";
import FilaSolicitud from "../../componentes/panel/FilaSolicitud.jsx";
import FormularioDatosCliente from "../../componentes/panel/FormularioDatosCliente.jsx";
import { buscarOpcion, TIPOS_DISPOSITIVO } from "../../datos/opciones.js";
import { formatearFecha, iniciales } from "../../utilidades/formato.js";
import useToast from "../../hooks/useToast.js";

const ListaDispositivos = ({ dispositivos }) => {
    if (dispositivos.length === 0) {
        return <p className="text-sm text-slate-400">No ha registrado dispositivos.</p>;
    }

    return (
        <ul className="space-y-3">
            {dispositivos.map((dispositivo) => {
                const tipo = buscarOpcion(TIPOS_DISPOSITIVO, dispositivo.tipo);
                const Icono = tipo.icono;
                return (
                    <li key={dispositivo.id} className="flex items-center gap-3 text-sm">
                        <Icono className="size-5 shrink-0 text-marca" aria-hidden="true" />
                        <span className="min-w-0">
                            <span className="block truncate font-medium">{dispositivo.marca} {dispositivo.modelo}</span>
                            <span className="block text-xs text-slate-400">{dispositivo.numeroSerie || "Sin número de serie"}</span>
                        </span>
                    </li>
                );
            })}
        </ul>
    );
};

const DetalleCliente = () => {
    const { id } = useParams();
    const [ficha, setFicha] = useState(null);
    const [error, setError] = useState("");
    const toast = useToast();

    useEffect(() => {
        let vigente = true;

        obtenerFichaCliente(id)
            .then((encontrada) => vigente && setFicha(encontrada))
            .catch((errorApi) => vigente && setError(errorApi.message));

        return () => {
            vigente = false;
        };
    }, [id]);

    const manejarCambioDatos = async (datos) => {
        await actualizarPerfil(ficha.id, datos);
        setFicha((actual) => ({ ...actual, ...datos }));
        toast.exito("Los datos del cliente se guardaron correctamente.");
    };

    if (error) {
        return (
            <EstadoVacio icono={Search} titulo={error} descripcion="Vuelve a la lista de clientes y elige uno.">
                <Link to="/admin/clientes" className="boton-primario">Ver clientes</Link>
            </EstadoVacio>
        );
    }

    if (!ficha) {
        return <p className="text-slate-400">Cargando cliente...</p>;
    }

    return (
        <>
            <Link to="/admin/clientes" className="mb-6 inline-block text-sm text-slate-400 hover:text-marca">
                ← Volver a clientes
            </Link>

            <div className="mb-8 flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-marca/15 text-lg font-bold text-marca">
                    {iniciales(ficha.nombre)}
                </span>
                <div className="min-w-0">
                    <h1 className="truncate text-2xl font-bold sm:text-3xl">{ficha.nombre}</h1>
                    <p className="text-sm text-slate-400">Cliente desde el {formatearFecha(ficha.registradoEn)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6">
                    <section className="tarjeta">
                        <h2 className="mb-4 text-lg font-semibold">Datos de contacto</h2>
                        <FormularioDatosCliente key={`${ficha.nombre}-${ficha.telefono}`} cliente={ficha} alGuardar={manejarCambioDatos} />
                    </section>

                    <section className="tarjeta">
                        <h2 className="mb-4 text-lg font-semibold">Dispositivos ({ficha.dispositivos.length})</h2>
                        <ListaDispositivos dispositivos={ficha.dispositivos} />
                    </section>
                </div>

                <section className="tarjeta lg:col-span-2">
                    <h2 className="mb-4 text-lg font-semibold">Servicios ({ficha.servicios.length})</h2>
                    {ficha.servicios.length === 0 ? (
                        <p className="text-sm text-slate-400">No ha solicitado servicios.</p>
                    ) : (
                        <ul className="space-y-3">
                            {ficha.servicios.map((servicio) => (
                                <FilaSolicitud
                                    key={servicio.id}
                                    solicitud={servicio}
                                    rutaBase="/admin/servicios"
                                    subtitulo={servicio.tecnico ? `Técnico: ${servicio.tecnico.nombre}` : "Sin técnico"}
                                />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
};

export default DetalleCliente;
