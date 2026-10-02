import { useEffect, useState } from "react";

const RUTA_API = "https://jsonplaceholder.typicode.com/users";
const CLAVE_TECNICOS = "tecnicos";

const ESPECIALIDADES = [
    "Reparación de Computadoras y Laptops",
    "Reparación de Celulares",
    "Mantenimiento de Consolas de Videojuegos",
    "Instalación de Cámaras de Seguridad",
    "Mantenimiento Preventivo y Correctivo",
];

/*
    Carga los técnicos desde localStorage si ya existen; si no, los trae de la
    API y los guarda en caché. Expone un estado de error porque la versión
    original solo lo registraba en consola y la pantalla se quedaba vacía.
*/
export const useTecnicos = () => {
    const tecnicosLocal = localStorage.getItem(CLAVE_TECNICOS);

    const [tecnicos, setTecnicos] = useState(() => tecnicosLocal ? JSON.parse(tecnicosLocal) : []);
    const [cargando, setCargando] = useState(!tecnicosLocal);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (tecnicosLocal) return;

        const cargarDesdeApi = async () => {
            try {
                const res = await fetch(RUTA_API);
                const data = await res.json();
                const nuevosTecnicos = data.slice(0, 5).map((tecnico, index) => ({
                    id: tecnico.id,
                    nombre: tecnico.name,
                    especialidad: ESPECIALIDADES[index % ESPECIALIDADES.length],
                    email: tecnico.email,
                    telefono: tecnico.phone.split(" ")[0],
                    disponible: tecnico.id % 2 === 0,
                }));
                localStorage.setItem(CLAVE_TECNICOS, JSON.stringify(nuevosTecnicos));
                setTecnicos(nuevosTecnicos);
            } catch {
                setError("No se pudieron cargar los técnicos. Intenta recargar la página.");
            } finally {
                setCargando(false);
            }
        };

        cargarDesdeApi();
        // Solo debe ejecutarse una vez al montar: tecnicosLocal ya decidió la rama al renderizar.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const eliminarTecnico = (id) => {
        setTecnicos((actuales) => {
            const restantes = actuales.filter((tecnico) => tecnico.id !== id);
            localStorage.setItem(CLAVE_TECNICOS, JSON.stringify(restantes));
            return restantes;
        });
    };

    return { tecnicos, cargando, error, eliminarTecnico };
};
