import { useState } from "react";
import { Clock3, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { CONTACTO } from "../../datos/contacto.js";
import { enlaceWhatsApp, whatsappConfigurado } from "../../utilidades/whatsapp.js";

const telefonoConfigurado = CONTACTO.telefono.replace(/\D/g, "").length >= 7;
const correoConfigurado = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONTACTO.correo);

const DatoContacto = ({ Icono, titulo, children }) => (
    <li className="flex items-start gap-3.5">
        <Icono size={20} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />
        <div>
            <p className="text-sm font-semibold text-white">{titulo}</p>
            <div className="text-sm text-slate-400">{children}</div>
        </div>
    </li>
);

const SeccionContacto = () => {
    const [error, setError] = useState("");

    const enviarMensaje = (evento) => {
        evento.preventDefault();
        setError("");
        const formulario = new FormData(evento.currentTarget);
        const nombre = String(formulario.get("nombre") ?? "").trim();
        const correo = String(formulario.get("correo") ?? "").trim();
        const mensaje = String(formulario.get("mensaje") ?? "").trim();
        const cuerpo = `Hola, soy ${nombre}.\nCorreo: ${correo}.\n\n${mensaje}`;
        const destino = evento.nativeEvent.submitter?.value;

        if (destino === "whatsapp" && whatsappConfigurado) {
            window.open(enlaceWhatsApp(cuerpo), "_blank", "noopener,noreferrer");
            return;
        }

        if (destino === "correo" && correoConfigurado) {
            const asunto = encodeURIComponent(`Consulta de servicio técnico - ${nombre}`);
            window.location.href = `mailto:${CONTACTO.correo}?subject=${asunto}&body=${encodeURIComponent(cuerpo)}`;
            return;
        }

        setError("Ese canal de contacto aún no está disponible. Usa los datos que aparecen junto al formulario.");
    };

    return (
        <section id="contacto" data-animacion-entrada aria-labelledby="titulo-contacto" className="seccion">
            <div className="contenedor grid gap-10 lg:grid-cols-2 lg:gap-16">
                <div>
                    <p className="antetitulo">Contacto</p>
                    <h2 id="titulo-contacto" className="titulo-seccion">Cuéntanos qué le pasa a tu equipo</h2>
                    <p className="texto-seccion">Escribe tu mensaje y envíalo por WhatsApp, o prepara un correo con tus datos.</p>

                    <ul className="mt-8 space-y-5">
                        <DatoContacto Icono={Phone} titulo="Teléfono">
                            {telefonoConfigurado ? <a className="hover:text-white" href={`tel:${CONTACTO.telefono.replace(/[^\d+]/g, "")}`}>{CONTACTO.telefono}</a> : CONTACTO.telefono}
                        </DatoContacto>
                        <DatoContacto Icono={Mail} titulo="Correo">
                            {correoConfigurado ? <a className="break-all hover:text-white" href={`mailto:${CONTACTO.correo}`}>{CONTACTO.correo}</a> : CONTACTO.correo}
                        </DatoContacto>
                        {/* El horario se publica solo cuando el negocio lo confirma en datos/contacto.js. */}
                        {CONTACTO.horarioConfigurado && (
                            <DatoContacto Icono={Clock3} titulo="Horario de atención">{CONTACTO.horario}</DatoContacto>
                        )}
                    </ul>
                </div>

                <form onSubmit={enviarMensaje} className="tarjeta space-y-5 sm:p-8" aria-label="Formulario de contacto">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="contacto-nombre" className="etiqueta">Nombre</label>
                            <input id="contacto-nombre" name="nombre" type="text" autoComplete="name" required maxLength={100} className="campo" placeholder="Tu nombre" />
                        </div>
                        <div>
                            <label htmlFor="contacto-correo" className="etiqueta">Correo electrónico</label>
                            <input id="contacto-correo" name="correo" type="email" autoComplete="email" required maxLength={254} className="campo" placeholder="tu@correo.com" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="contacto-mensaje" className="etiqueta">Mensaje</label>
                        <textarea id="contacto-mensaje" name="mensaje" required minLength={5} maxLength={1000} rows={5} className="campo resize-y" placeholder="Ej. Mi portátil no enciende desde ayer." />
                    </div>
                    {error && <p className="text-sm text-amber-300" role="alert">{error}</p>}
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button type="submit" name="canal" value="whatsapp" disabled={!whatsappConfigurado} className="boton-primario flex-1">
                            <MessageCircle size={18} aria-hidden="true" /> Enviar por WhatsApp
                        </button>
                        <button type="submit" name="canal" value="correo" disabled={!correoConfigurado} className="boton-secundario flex-1">
                            <Send size={17} aria-hidden="true" /> Preparar correo
                        </button>
                    </div>
                    {correoConfigurado && <p className="text-xs leading-relaxed text-slate-500">"Preparar correo" abre un borrador en la aplicación de correo de tu dispositivo; lo envías desde allí.</p>}
                </form>
            </div>
        </section>
    );
};

export default SeccionContacto;
