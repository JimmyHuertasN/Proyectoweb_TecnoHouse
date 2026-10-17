import { useEffect, useState } from "react";
import { obtenerEstadisticas } from "../../api/admin.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import GraficoBarras from "../../componentes/panel/GraficoBarras.jsx";
import GraficoColumnas from "../../componentes/panel/GraficoColumnas.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";

const plural = (cantidad, singular, varios) => `${cantidad} ${cantidad === 1 ? singular : varios}`;

const TarjetaGrafico = ({ titulo, descripcion, children, className = "" }) => (
    <section className={`tarjeta ${className}`}>
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <p className="mb-5 text-sm text-slate-400">{descripcion}</p>
        {children}
    </section>
);

const SinDatos = ({ texto }) => <p className="py-6 text-center text-sm text-slate-400">{texto}</p>;

const Estadisticas = () => {
    const [estadisticas, setEstadisticas] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let vigente = true;

        obtenerEstadisticas()
            .then((datos) => vigente && setEstadisticas(datos))
            .catch(() => vigente && setError("No se pudieron cargar las estadísticas."));

        return () => {
            vigente = false;
        };
    }, []);

    if (error) return <Aviso texto={error} tipo="error" />;
    if (!estadisticas) return <Skeleton tipo="tarjeta" cantidad={3} etiqueta="Cargando estadísticas" />;

    const { serviciosPorMes, problemasFrecuentes, mejoresTecnicos } = estadisticas;

    return (
        <>
            <EncabezadoPagina titulo="Estadísticas" descripcion="Cómo se comporta el taller a lo largo del tiempo." />

            <TarjetaGrafico titulo="Servicios por mes" descripcion="Servicios solicitados en los últimos 6 meses" className="mb-6">
                <GraficoColumnas
                    etiquetaAria="Servicios por mes"
                    datos={serviciosPorMes.map((mes) => ({
                        clave: mes.clave,
                        etiqueta: mes.etiqueta,
                        valor: mes.cantidad,
                        descripcion: `${mes.nombreCompleto}: ${plural(mes.cantidad, "servicio", "servicios")}`,
                    }))}
                />
            </TarjetaGrafico>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TarjetaGrafico titulo="Problemas frecuentes" descripcion="Agrupados por categoría seleccionada al crear la solicitud">
                    {problemasFrecuentes.length === 0 ? (
                        <SinDatos texto="Todavía no hay servicios." />
                    ) : (
                        <GraficoBarras
                            etiquetaAria="Problemas frecuentes"
                            datos={problemasFrecuentes.map((problema) => ({
                                clave: problema.categoria,
                                etiqueta: problema.categoria,
                                valor: problema.cantidad,
                                descripcion: `${problema.categoria}: ${plural(problema.cantidad, "servicio", "servicios")}`,
                            }))}
                        />
                    )}
                </TarjetaGrafico>

                <TarjetaGrafico titulo="Mejores técnicos" descripcion="Promedio de sus calificaciones, de 0 a 5">
                    {mejoresTecnicos.length === 0 ? (
                        <SinDatos texto="Todavía no hay calificaciones." />
                    ) : (
                        <GraficoBarras
                            etiquetaAria="Mejores técnicos"
                            maximo={5}
                            datos={mejoresTecnicos.map((tecnico) => ({
                                clave: tecnico.id,
                                etiqueta: tecnico.nombre,
                                valor: tecnico.promedio,
                                textoValor: tecnico.promedio.toFixed(1),
                                descripcion: `${tecnico.nombre}: ${tecnico.promedio.toFixed(1)} de 5 (${plural(tecnico.cantidad, "calificación", "calificaciones")})`,
                            }))}
                        />
                    )}
                </TarjetaGrafico>
            </div>
        </>
    );
};

export default Estadisticas;
