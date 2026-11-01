import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cambiarDisponibilidad, listarCalificaciones, obtenerFichaTecnico } from "../../api/tecnico.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import Estrellas from "../../componentes/panel/Estrellas.jsx";
import InterruptorDisponibilidad from "../../componentes/panel/InterruptorDisponibilidad.jsx";
import { useSesion } from "../../contexto/ContextoSesion.js";
import { formatearFecha, iniciales } from "../../utilidades/formato.js";

const calcularPromedio = (calificaciones) => {
    if (calificaciones.length === 0) return 0;
    const suma = calificaciones.reduce((total, calificacion) => total + calificacion.puntuacion, 0);
    return suma / calificaciones.length;
};

const ResumenCalificaciones = ({ calificaciones }) => {
    const promedio = calcularPromedio(calificaciones);

    if (calificaciones.length === 0) {
        return <p className="text-sm text-slate-400">Aún no tienes calificaciones. Aparecerán cuando los clientes califiquen tus servicios.</p>;
    }

    return (
        <div className="flex items-center gap-4">
            <p className="text-5xl font-bold">{promedio.toFixed(1)}</p>
            <div>
                <Estrellas puntuacion={promedio} tamano="text-2xl" />
                <p className="text-sm text-slate-400">
                    {calificaciones.length} {calificaciones.length === 1 ? "calificación" : "calificaciones"}
                </p>
            </div>
        </div>
    );
};

const ItemCalificacion = ({ calificacion }) => (
    <li className="border-b border-borde pb-4 last:border-b-0 last:pb-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <Estrellas puntuacion={calificacion.puntuacion} />
            <span className="text-xs text-slate-500">{formatearFecha(calificacion.creadaEn)}</span>
        </div>
        {calificacion.comentario && <p className="mt-2 text-sm text-slate-200">“{calificacion.comentario}”</p>}
        <p className="mt-1 text-xs text-slate-400">
            {calificacion.nombreCliente} ·{" "}
            <Link to={`/tecnico/servicios/${calificacion.servicioId}`} className="text-marca hover:underline">
                {calificacion.equipo}
            </Link>
        </p>
    </li>
);

const PerfilTecnico = () => {
    const { usuario } = useSesion();
    const [ficha, setFicha] = useState(null);
    const [calificaciones, setCalificaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let vigente = true;

        Promise.all([obtenerFichaTecnico(usuario.id), listarCalificaciones(usuario.id)])
            .then(([fichaEncontrada, lista]) => {
                if (!vigente) return;
                setFicha(fichaEncontrada);
                setCalificaciones(lista);
            })
            .catch((errorApi) => vigente && setError(errorApi.message || "No se pudo cargar tu perfil."))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [usuario.id]);

    const manejarDisponibilidad = async (disponible) => {
        await cambiarDisponibilidad(usuario.id, disponible);
        setFicha((actual) => ({ ...actual, disponible }));
    };

    if (cargando) {
        return <p className="text-slate-400">Cargando perfil...</p>;
    }

    if (error) {
        return <Aviso texto={error} tipo="error" />;
    }

    return (
        <>
            <EncabezadoPagina titulo="Mi perfil" descripcion="Tu disponibilidad y lo que opinan los clientes de tu trabajo." />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6">
                    <section className="tarjeta">
                        <div className="flex items-center gap-4">
                            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-marca/15 text-lg font-bold text-marca">
                                {iniciales(usuario.nombre)}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-lg font-semibold">{usuario.nombre}</p>
                                <p className="truncate text-sm text-slate-400">{usuario.correo}</p>
                                <p className="text-sm text-marca">{ficha.especialidad || "Sin especialidad registrada"}</p>
                            </div>
                        </div>
                    </section>

                    <section className="tarjeta">
                        <h2 className="mb-4 text-lg font-semibold">Disponibilidad</h2>
                        <InterruptorDisponibilidad disponible={ficha.disponible} alCambiar={manejarDisponibilidad} />
                    </section>
                </div>

                <section className="tarjeta lg:col-span-2">
                    <h2 className="mb-4 text-lg font-semibold">Mis calificaciones</h2>
                    <ResumenCalificaciones calificaciones={calificaciones} />

                    {calificaciones.length > 0 && (
                        <ul className="mt-6 space-y-4 border-t border-borde pt-6">
                            {calificaciones.map((calificacion) => (
                                <ItemCalificacion key={calificacion.id} calificacion={calificacion} />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
};

export default PerfilTecnico;
