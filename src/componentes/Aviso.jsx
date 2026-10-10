const ESTILOS = {
    error: "border-red-500/50 bg-red-500/10 text-red-300",
    exito: "border-green-500/50 bg-green-500/10 text-green-300",
    info: "border-marca/40 bg-marca/10 text-sky-200",
};

/* Recuadro de mensajes del panel. No se dibuja nada si no hay texto. */
const Aviso = ({ texto, tipo = "info" }) => {
    if (!texto) return null;

    return (
        <p className={`mb-5 rounded-lg border px-4 py-3 text-sm ${ESTILOS[tipo]}`} role={tipo === "error" ? "alert" : "status"}>
            {texto}
        </p>
    );
};

export default Aviso;
