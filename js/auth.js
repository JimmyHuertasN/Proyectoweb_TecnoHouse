/*
    auth.js
    Maneja el registro de usuarios y el inicio de sesión de TecnoHouse.
    Los usuarios se guardan en el localStorage del navegador bajo la
    clave "usuarios", y el usuario que inicia sesión queda en "usuarioActivo".
    El mismo archivo se usa en registro.html y en login.html: cada bloque
    se activa solo si encuentra su formulario en la página.
*/

// Claves usadas en el localStorage (centralizadas para no repetir textos).
const CLAVE_USUARIOS = "usuarios";
const CLAVE_USUARIO_ACTIVO = "usuarioActivo";

/* Devuelve la lista de usuarios guardados; si no hay nada, devuelve un arreglo vacío. */
const ObtenerUsuarios = () => {
    const guardados = localStorage.getItem(CLAVE_USUARIOS);
    return guardados ? JSON.parse(guardados) : [];
};

/* Guarda la lista completa de usuarios en el localStorage. */
const GuardarUsuarios = (usuarios) => {
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
};

/* Busca un usuario por correo. Se normaliza a minúsculas para evitar duplicados. */
const BuscarUsuario = (correo) => {
    return ObtenerUsuarios().find(usuario => usuario.correo === correo.trim().toLowerCase());
};

/*
    Muestra un mensaje dentro del recuadro de avisos del formulario.
    tipo: "error" pinta el borde en rojo, "exito" lo pinta en verde.
*/
const MostrarMensaje = (elemento, texto, tipo) => {
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.className = `form-message ${tipo}`;
    elemento.hidden = false;
};

/* ===================== REGISTRO ===================== */

const formRegistro = document.getElementById("form-registro");

if (formRegistro) {
    const mensajeRegistro = document.getElementById("mensaje-registro");

    formRegistro.addEventListener("submit", (evento) => {
        // Se evita el envío normal para validar los datos con JavaScript.
        evento.preventDefault();

        // Se leen los campos y se limpian los espacios sobrantes.
        const nombre = document.getElementById("nombre").value.trim();
        const correo = document.getElementById("correo").value.trim().toLowerCase();
        const telefono = document.getElementById("telefono").value.trim();
        const contrasena = document.getElementById("contrasena").value;
        const confirmar = document.getElementById("confirmar-contrasena").value;

        // Validación 1: ningún campo puede quedar vacío.
        if (!nombre || !correo || !telefono || !contrasena || !confirmar) {
            MostrarMensaje(mensajeRegistro, "Por favor completa todos los campos.", "error");
            return;
        }

        // Validación 2: el correo debe tener un formato válido.
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            MostrarMensaje(mensajeRegistro, "Escribe un correo electrónico válido.", "error");
            return;
        }

        // Validación 3: la contraseña debe tener mínimo 8 caracteres.
        if (contrasena.length < 8) {
            MostrarMensaje(mensajeRegistro, "La contraseña debe tener al menos 8 caracteres.", "error");
            return;
        }

        // Validación 4: las dos contraseñas deben coincidir.
        if (contrasena !== confirmar) {
            MostrarMensaje(mensajeRegistro, "Las contraseñas no coinciden.", "error");
            return;
        }

        // Validación 5: el correo no puede estar registrado previamente.
        if (BuscarUsuario(correo)) {
            MostrarMensaje(mensajeRegistro, "Ese correo ya tiene una cuenta. Inicia sesión.", "error");
            return;
        }

        // Si pasó todas las validaciones, se agrega el usuario a la lista.
        const usuarios = ObtenerUsuarios();
        usuarios.push({ nombre, correo, telefono, contrasena });
        GuardarUsuarios(usuarios);

        MostrarMensaje(mensajeRegistro, "¡Cuenta creada! Te llevamos al inicio de sesión...", "exito");
        formRegistro.reset();

        // Se envía al usuario al login después de un momento para que lea el mensaje.
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    });
}

/* ===================== INICIO DE SESIÓN ===================== */

const formLogin = document.getElementById("form-login");

if (formLogin) {
    const mensajeLogin = document.getElementById("mensaje-login");
    const verContrasena = document.getElementById("ver-contrasena");
    const campoContrasena = document.getElementById("contrasena-login");

    // Casilla "Mostrar contraseña": cambia el tipo del campo.
    verContrasena.addEventListener("change", () => {
        campoContrasena.type = verContrasena.checked ? "text" : "password";
    });

    formLogin.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const correo = document.getElementById("correo-login").value.trim().toLowerCase();
        const contrasena = campoContrasena.value;

        // Validación 1: los dos campos son obligatorios.
        if (!correo || !contrasena) {
            MostrarMensaje(mensajeLogin, "Escribe tu correo y tu contraseña.", "error");
            return;
        }

        // Validación 2: el correo debe existir entre los usuarios registrados.
        const usuario = BuscarUsuario(correo);

        if (!usuario) {
            MostrarMensaje(mensajeLogin, "No encontramos una cuenta con ese correo.", "error");
            return;
        }

        // Validación 3: la contraseña debe coincidir con la guardada.
        if (usuario.contrasena !== contrasena) {
            MostrarMensaje(mensajeLogin, "La contraseña es incorrecta.", "error");
            return;
        }

        // Sesión iniciada: se guarda el usuario activo (sin la contraseña).
        localStorage.setItem(CLAVE_USUARIO_ACTIVO, JSON.stringify({
            nombre: usuario.nombre,
            correo: usuario.correo
        }));

        MostrarMensaje(mensajeLogin, `¡Hola ${usuario.nombre}! Entrando a TecnoHouse...`, "exito");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1200);
    });
}
