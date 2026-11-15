import { ClipboardCheck, PackageCheck, Stethoscope, UserRoundPlus } from "lucide-react";

/* Pasos de una reparación. La portada los muestra resumidos y la página de reparaciones, completos. */
export const PASOS_SERVICIO = [
    { titulo: "Registra tu equipo", descripcion: "Cuéntanos qué dispositivo tienes y qué problema presenta.", icono: UserRoundPlus },
    { titulo: "Un técnico lo diagnostica", descripcion: "Nuestro equipo revisa el equipo y registra los hallazgos.", icono: Stethoscope },
    { titulo: "Apruebas la cotización", descripcion: "Revisa el costo y el trabajo propuesto antes de autorizar la reparación.", icono: ClipboardCheck },
    { titulo: "Recibes tu equipo reparado", descripcion: "Te avisamos cuando esté listo para que vuelvas a disfrutarlo.", icono: PackageCheck },
];
