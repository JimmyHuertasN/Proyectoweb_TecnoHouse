import { useEffect, useState } from "react";
import { obtenerEstadisticas, obtenerIngresosPorMes, obtenerServiciosPorDispositivo } from "../../api/admin.js";
import Aviso from "../../componentes/Aviso.jsx";
import EncabezadoPagina from "../../componentes/panel/EncabezadoPagina.jsx";
import GraficoBarras from "../../componentes/panel/GraficoBarras.jsx";
import GraficoColumnas from "../../componentes/panel/GraficoColumnas.jsx";
import SelectorRangoFechas from "../../componentes/panel/SelectorRangoFechas.jsx";
import Skeleton from "../../componentes/panel/Skeleton.jsx";
import { useRangoFechas } from "../../hooks/useRangoFechas.js";
import { formatearPesos } from "../../utilidades/formato.js";

const plural = (cantidad, singular, varios) => `${cantidad} ${cantidad === 1 ? singular : varios}`;

const TarjetaGrafico = ({ titulo, descripcion, children, className = "" }) => (
    <section className={`tarjeta ${className}`}>
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <p className="mb-5 text-sm text-slate-400">{descripcion}</p>
        {children}
    </section>
);

const SinDatos = ({ texto }) => <p className="py-6 text-center text-sm text-slate-400">{texto}</p>;

/* Dinero abreviado para que quepa sobre la columna: 285.000 → "285 mil", 1.250.000 → "1,3 M". El valor exacto está en el tooltip. */
const formatoCompacto = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });

const Estadisticas = () => {
    const rango = useRangoFechas();
    const { desde, hasta } = rango;
    // { clave, datos } o { clave, error }; "clave" identifica el periodo al que pertenece.
    const [resultado, setResultado] = useState(null);

    useEffect(() => {
        let vigente = true;
        const clave = `${desde}|${hasta}`;

        Promise.all([obtenerEstadisticas(desde, hasta), obtenerIngresosPorMes(desde, hasta), obtenerServiciosPorDispositivo(desde, hasta)])
            .then(([estadisticas, ingresosPorMes, porDispositivo]) => vigente && setResultado({ clave, datos: { ...estadisticas, ingresosPorMes, porDispositivo } }))
            .catch(() => vigente && setResultado({ clave, error: "No se pudieron cargar las estadísticas." }));

        return () => {
            vigente = false;
        };
    }, [desde, hasta]);

    // Mientras llega el periodo nuevo se siguen mostrando los datos anteriores, atenuados.
    const esActual = resultado?.clave === `${desde}|${hasta}`;
    const actualizando = resultado !== null && !esActual;
    const error = esActual ? (resultado.error ?? "") : "";
    const datos = resultado?.datos;

    const cabecera = (
        <>
            <EncabezadoPagina titulo="Estadísticas" descripcion="Cómo se comporta el taller a lo largo del tiempo." />
            <SelectorRangoFechas id="estadisticas" rango={rango} />
        </>
    );

    if (error) {
        return (
            <>
                {cabecera}
                <Aviso texto={error} tipo="error" />
            </>
        );
    }

    if (!datos) {
        return (
            <>
                {cabecera}
                <Skeleton tipo="tarjeta" cantidad={3} etiqueta="Cargando estadísticas" />
            </>
        );
    }

    const { serviciosPorMes, problemasFrecuentes, mejoresTecnicos, ingresosPorMes, porDispositivo } = datos;
    const totalIngresos = ingresosPorMes.reduce((suma, mes) => suma + mes.total, 0);

    return (
        <>
            {cabecera}

            <div aria-busy={actualizando} className={actualizando ? "opacity-60 transition-opacity" : "transition-opacity"}>
                <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <TarjetaGrafico titulo="Servicios por mes" descripcion="Servicios solicitados en cada mes del periodo">
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

                    <TarjetaGrafico
                        titulo="Ingresos por mes"
                        descripcion={`Cotizaciones aprobadas de servicios terminados · Total: ${formatearPesos(totalIngresos)}`}
                    >
                        <GraficoColumnas
                            etiquetaAria="Ingresos por mes"
                            datos={ingresosPorMes.map((mes) => ({
                                clave: mes.mes,
                                etiqueta: mes.etiqueta,
                                valor: mes.total,
                                textoValor: mes.total === 0 ? "0" : formatoCompacto.format(mes.total),
                                descripcion: `${mes.nombreCompleto}: ${formatearPesos(mes.total)}`,
                            }))}
                        />
                    </TarjetaGrafico>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <TarjetaGrafico titulo="Servicios por tipo de equipo" descripcion="Celulares, computadores y consolas atendidos">
                        {porDispositivo.length === 0 ? (
                            <SinDatos texto="No hay servicios en este periodo." />
                        ) : (
                            <GraficoBarras
                                etiquetaAria="Servicios por tipo de equipo"
                                datos={porDispositivo.map((fila) => ({
                                    clave: fila.dispositivo,
                                    etiqueta: fila.dispositivo,
                                    valor: fila.cantidad,
                                    descripcion: `${fila.dispositivo}: ${plural(fila.cantidad, "servicio", "servicios")}`,
                                }))}
                            />
                        )}
                    </TarjetaGrafico>

                    <TarjetaGrafico titulo="Problemas frecuentes" descripcion="Agrupados por categoría seleccionada al crear la solicitud">
                        {problemasFrecuentes.length === 0 ? (
                            <SinDatos texto="No hay servicios en este periodo." />
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

                    <TarjetaGrafico titulo="Mejores técnicos" descripcion="Promedio de sus calificaciones, de 0 a 5" className="lg:col-span-2">
                        {mejoresTecnicos.length === 0 ? (
                            <SinDatos texto="No hay calificaciones en este periodo." />
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
            </div>
        </>
    );
};

export default Estadisticas;
