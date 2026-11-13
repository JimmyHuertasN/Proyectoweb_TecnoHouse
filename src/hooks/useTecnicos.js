import { useEffect, useState } from "react";
import { llamarApi } from "../api/backend.js";

/*
    Carga los técnicos desde la vista pública "tecnicos_publicos" de Supabase.
    La vista solo expone datos que cualquiera puede ver (sin correos ni teléfonos).
*/
export const useTecnicos = () => {
    const [tecnicos, setTecnicos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let vigente = true;

        const cargar = async () => {
            try {
                const filas = await llamarApi("/api/tecnicos-publicos", { publico: true });
                const porNombre = (tecnicoA, tecnicoB) => (tecnicoA.nombre ?? "").localeCompare(tecnicoB.nombre ?? "");
                if (vigente) setTecnicos(filas.sort(porNombre));
            } catch (errorConsulta) {
                if (vigente) setError(`No se pudieron cargar los técnicos: ${errorConsulta.message}`);
            } finally {
                if (vigente) setCargando(false);
            }
        };

        cargar();
        return () => {
            vigente = false;
        };
    }, []);

    return { tecnicos, cargando, error };
};
