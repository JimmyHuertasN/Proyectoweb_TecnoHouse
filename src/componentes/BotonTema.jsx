import { Moon, Sun } from "lucide-react";
import useTema from "../hooks/useTema.js";

/*
    Cambia entre el modo oscuro y el claro. El ícono muestra el modo al que se pasa.
    Con "className" se reemplaza el estilo de botón cuadrado (por ejemplo, en el menú lateral).
*/
const BotonTema = ({ className, conTexto = false }) => {
    const { tema, alternarTema } = useTema();
    const destino = tema === "claro" ? "oscuro" : "claro";
    const Icono = destino === "claro" ? Sun : Moon;
    const texto = `Activar modo ${destino}`;

    return (
        <button
            type="button"
            onClick={alternarTema}
            aria-label={conTexto ? undefined : texto}
            title={conTexto ? undefined : texto}
            className={className ?? "inline-flex size-11 cursor-pointer items-center justify-center rounded-lg border border-slate-700 text-slate-200 transition hover:border-slate-400"}
        >
            <Icono size={conTexto ? 17 : 20} strokeWidth={conTexto ? 1.8 : 2} aria-hidden="true" />
            {conTexto && texto}
        </button>
    );
};

export default BotonTema;
