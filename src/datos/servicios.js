import { Camera, Gamepad2, Laptop, Settings, Smartphone } from "lucide-react";

export const SERVICIOS = [
    {
        id: "computadoras",
        icono: Laptop,
        titulo: "Computadoras",
        descripcion: "Diagnóstico, reparación y mantenimiento de computadoras y laptops.",
    },
    {
        id: "celulares",
        icono: Smartphone,
        titulo: "Celulares",
        descripcion: "Reparación de pantallas, baterías, software y otros componentes.",
    },
    {
        id: "consolas",
        icono: Gamepad2,
        titulo: "Consolas",
        descripcion: "Mantenimiento, limpieza y reparación de consolas de videojuegos.",
    },
    {
        id: "camaras",
        icono: Camera,
        titulo: "Cámaras de Seguridad",
        descripcion: "Instalación, configuración y mantenimiento de sistemas de seguridad.",
    },
    {
        id: "mantenimiento",
        icono: Settings,
        titulo: "Mantenimiento",
        descripcion: "Mantenimiento preventivo y correctivo para tus equipos tecnológicos.",
    },
];
