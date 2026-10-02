const MensajeFormulario = ({ texto, tipo }) => {
    if (!texto) return null;

    return (
        <p className={`form-message ${tipo}`} role="alert">
            {texto}
        </p>
    );
};

export default MensajeFormulario;
