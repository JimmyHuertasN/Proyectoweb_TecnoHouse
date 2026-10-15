import { useEffect, useState } from "react";
import { obtenerCliente, verificar } from "../api/supabase.js";

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
                const filas = verificar(
                    await obtenerCliente()
                        .from("tecnicos_publicos")
                        .select("id, nombre, especialidad, disponible, calificacion_promedio")
                        .order("nombre")
                );
                if (vigente) setTecnicos(filas);
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
