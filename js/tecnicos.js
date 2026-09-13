const RUTA_API = "https://jsonplaceholder.typicode.com/users";
let tecnicos = [];

const CargarAPI = async () => {
    let tecnicosLocal = localStorage.getItem("tecnicos");
    
    const especialidades = [
    "Reparación de Computadoras y Laptops",
    "Reparación de Celulares",
    "Mantenimiento de Consolas de Videojuegos",
    "Instalación de Cámaras de Seguridad",
    "Mantenimiento Preventivo y Correctivo"
];



    if (tecnicosLocal) {
        tecnicos = JSON.parse(tecnicosLocal);
        console.log("Datos cargados desde localStorage");
        MostrarTecnicos(tecnicos);
    } else {
        try {
            const res = await fetch(RUTA_API);
            const data = await res.json();
           tecnicos = data.slice(0, 5).map((tecnico, index) => ({
                id: tecnico.id,
                nombre: tecnico.name,
                especialidad: especialidades[index % especialidades.length],
                email: tecnico.email,
                telefono: tecnico.phone.split(" ")[0], 
                disponible: tecnico.id % 2 === 0
            }));
            localStorage.setItem("tecnicos", JSON.stringify(tecnicos));
            console.log("Cargado desde el API");
            MostrarTecnicos(tecnicos);
        } catch (error) {
            console.error("Error: ", error);
        }
    }
};

const MostrarTecnicos = (tecnicos) => {
    const contenedorTecnicos = document.getElementById("contenedor-tecnicos");
    const tarjetaHTML = tecnicos.map(tecnico => `
        <div class="tecnico-card">
            <h3>${tecnico.nombre}</h3>
            <p class="especialidad">${tecnico.especialidad}</p>
            <p>${tecnico.email}</p>
            <p>${tecnico.telefono}</p>
            <p class="disponibilidad ${tecnico.disponible ? "disponible" : "no-disponible"}">
                ${tecnico.disponible ? "Disponible" : "No disponible"}
            </p>
            <button onclick="EliminarTecnico(${tecnico.id})">Eliminar</button>
        </div>
    `).join(" ");
    contenedorTecnicos.innerHTML = tarjetaHTML;
};

const EliminarTecnico = (id) => {
    tecnicos = tecnicos.filter(tecnico => tecnico.id != id);
    localStorage.setItem("tecnicos", JSON.stringify(tecnicos));
    MostrarTecnicos(tecnicos);
};

CargarAPI();