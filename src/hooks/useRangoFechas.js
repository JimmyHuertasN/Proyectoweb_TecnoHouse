import { useState } from "react";
import { rangoPredefinido } from "../utilidades/reportes.js";

/*
    Rango de fechas de un reporte, guardado en el estado de la página (no en la URL).
    Devuelve el rango efectivo { desde, hasta } (AAAA-MM-DD, vacío = sin límite) y lo necesario
    para el selector. Al elegir "Personalizado" se parte del rango que ya se estaba viendo.
*/
export const useRangoFechas = (valorInicial = "6m") => {
    const [valor, setValor] = useState(valorInicial);
    const [personalizado, setPersonalizado] = useState({ desde: "", hasta: "" });

    const rango = valor === "personalizado" ? personalizado : rangoPredefinido(valor);

    const cambiarValor = (nuevoValor) => {
        if (nuevoValor === "personalizado") setPersonalizado(rango);
        setValor(nuevoValor);
    };

    const cambiarFecha = (nombre, fecha) => setPersonalizado((anterior) => ({ ...anterior, [nombre]: fecha }));

    return { valor, desde: rango.desde, hasta: rango.hasta, cambiarValor, cambiarFecha };
};
