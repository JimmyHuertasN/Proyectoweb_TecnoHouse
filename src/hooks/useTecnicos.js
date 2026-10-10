import { useEffect, useState } from "react";
import { supabase, supabaseConfigurado } from "../utilidades/supabase.js";

export const useTecnicos = () => {
    const [tecnicos, setTecnicos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let activo = true;

        const cargarTecnicos = async () => {
            if (!supabaseConfigurado) {
                setError("Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env para cargar los técnicos.");
                setCargando(false);
                return;
            }

            try {
                const { data, error: errorConsulta } = await supabase
                    .from("tecnicos_publicos")
                    .select("id, nombre, especialidad, disponible, calificacion_promedio")
                    .order("nombre");

                if (errorConsulta) throw errorConsulta;
                if (activo) setTecnicos(data);
            } catch (errorConsulta) {
                if (activo) {
                    setError(`No se pudieron cargar los técnicos: ${errorConsulta.message}`);
                }
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargarTecnicos();
        return () => {
            activo = false;
        };
    }, []);

    return { tecnicos, cargando, error };
};
