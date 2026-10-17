import { useEffect, useState } from "react";
import { listarFotos } from "../../api/fotos.js";
import Aviso from "../Aviso.jsx";

/* Galería compartida: cada imagen llega mediante una URL firmada de Storage privado. */
const GaleriaFotosServicio = ({ servicioId }) => {
    const [fotos, setFotos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [ampliada, setAmpliada] = useState(null);

    useEffect(() => {
        let vigente = true;
        setCargando(true);
        setError("");

        listarFotos(servicioId)
            .then((lista) => vigente && setFotos(lista))
            .catch((errorApi) => vigente && setError(errorApi.message))
            .finally(() => vigente && setCargando(false));

        return () => {
            vigente = false;
        };
    }, [servicioId]);

    useEffect(() => {
        if (!ampliada) return undefined;
        const cerrarConEscape = (evento) => evento.key === "Escape" && setAmpliada(null);
        window.addEventListener("keydown", cerrarConEscape);
        return () => window.removeEventListener("keydown", cerrarConEscape);
    }, [ampliada]);

    return (
        <section className="tarjeta mt-6" aria-labelledby="titulo-fotos-servicio">
            <h2 id="titulo-fotos-servicio" className="mb-4 text-lg font-semibold">Fotos del servicio</h2>
            <Aviso texto={error} tipo="error" />
            {cargando && <p className="text-sm text-slate-400">Cargando fotos...</p>}
            {!cargando && !error && fotos.length === 0 && <p className="text-sm text-slate-400">No se adjuntaron fotos.</p>}

            {!cargando && fotos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {fotos.map((foto, indice) => (
                        <button
                            key={foto.id}
                            type="button"
                            className="group overflow-hidden rounded-lg border border-borde focus-visible:outline-2 focus-visible:outline-marca"
                            aria-label={`Ampliar foto ${indice + 1} del servicio`}
                            onClick={() => setAmpliada(foto)}
                        >
                            <img src={foto.url} alt={`Foto ${indice + 1} del servicio`} className="aspect-square w-full object-cover transition group-hover:scale-105" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}

            {ampliada && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Foto ampliada del servicio"
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4"
                    onMouseDown={(evento) => evento.target === evento.currentTarget && setAmpliada(null)}
                >
                    <button type="button" className="absolute top-4 right-4 boton-secundario" onClick={() => setAmpliada(null)}>
                        Cerrar
                    </button>
                    <img src={ampliada.url} alt="Foto ampliada del servicio" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
                </div>
            )}
        </section>
    );
};

export default GaleriaFotosServicio;
