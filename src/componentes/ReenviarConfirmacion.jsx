import { useState } from "react";
import { reenviarConfirmacion } from "../api/usuarios.js";

/* Botón para volver a pedir el correo de confirmación de la cuenta. */
const ReenviarConfirmacion = ({ correo }) => {
    const [estado, setEstado] = useState({ enviando: false, texto: "" });

    const reenviar = async () => {
        setEstado({ enviando: true, texto: "" });
        try {
            await reenviarConfirmacion(correo);
            setEstado({ enviando: false, texto: "Listo, te enviamos un correo nuevo. Revisa también la carpeta de spam." });
        } catch (errorApi) {
            setEstado({ enviando: false, texto: errorApi.message });
        }
    };

    return (
        <div className="-mt-2 mb-5 text-sm">
            <button type="button" onClick={reenviar} disabled={estado.enviando} className="cursor-pointer font-bold text-marca hover:underline disabled:opacity-50">
                {estado.enviando ? "Enviando..." : "Reenviar correo de confirmación"}
            </button>
            {estado.texto && <p className="mt-1 text-slate-400" role="status">{estado.texto}</p>}
        </div>
    );
};

export default ReenviarConfirmacion;
