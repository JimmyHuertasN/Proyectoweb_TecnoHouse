import { useState } from "react";
import { Clock3, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { CONTACTO } from "../../datos/contacto.js";

const telefonoWhatsApp = CONTACTO.whatsapp.replace(/\D/g, "");
const whatsappConfigurado = telefonoWhatsApp.length >= 8 && telefonoWhatsApp.length <= 15;
const telefonoConfigurado = CONTACTO.telefono.replace(/\D/g, "").length >= 7;
const correoConfigurado = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONTACTO.correo);

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
            window.open(`https://wa.me/${telefonoWhatsApp}?text=${encodeURIComponent(cuerpo)}`, "_blank", "noopener,noreferrer");
            return;
        }

        if (destino === "correo" && correoConfigurado) {
            const asunto = encodeURIComponent(`Consulta de servicio técnico - ${nombre}`);
            window.location.href = `mailto:${CONTACTO.correo}?subject=${asunto}&body=${encodeURIComponent(cuerpo)}`;
            return;
        }

        setError("El canal de contacto aún no está configurado. Escríbenos por los datos disponibles al pie de esta sección.");
    };

    return (
        <section id="contacto" data-animacion-entrada aria-labelledby="titulo-contacto" className="scroll-mt-20 border-t border-borde bg-gradient-to-b from-[#0a1422] to-fondo px-6 py-20 sm:px-[8%] sm:py-24">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-14">
                <div>
                    <p className="antetitulo">Estamos para ayudarte</p>
                    <h2 id="titulo-contacto" className="mb-4 text-3xl font-bold sm:text-4xl">CONTÁCTANOS</h2>
                    <p className="mb-8 max-w-xl leading-relaxed text-slate-300">Cuéntanos qué le ocurre a tu equipo. Elige si quieres abrir WhatsApp o preparar un correo con tus datos y tu mensaje.</p>

                    <ul className="space-y-5">
                        <li className="flex items-start gap-3">
                            <Phone size={19} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />
                            <div>
                                <p className="text-sm font-semibold">Teléfono</p>
                                {telefonoConfigurado ? <a className="text-sm text-slate-400 hover:text-marca" href={`tel:${CONTACTO.telefono.replace(/[^\d+]/g, "")}`}>{CONTACTO.telefono}</a> : <p className="text-sm text-slate-500">{CONTACTO.telefono}</p>}
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <Mail size={19} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />
                            <div>
                                <p className="text-sm font-semibold">Correo</p>
                                {correoConfigurado ? <a className="text-sm text-slate-400 hover:text-marca" href={`mailto:${CONTACTO.correo}`}>{CONTACTO.correo}</a> : <p className="text-sm text-slate-500">{CONTACTO.correo}</p>}
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <Clock3 size={19} className="mt-0.5 shrink-0 text-marca" aria-hidden="true" />
                            <div>
                                <p className="text-sm font-semibold">Horario de atención</p>
                                <p className="text-sm text-slate-400">{CONTACTO.horario}</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <form onSubmit={enviarMensaje} className="tarjeta space-y-5" aria-label="Formulario de contacto">
                    <div>
                        <label htmlFor="contacto-nombre" className="etiqueta">Nombre</label>
                        <input id="contacto-nombre" name="nombre" type="text" autoComplete="name" required maxLength={100} className="campo" placeholder="Tu nombre" />
                    </div>
                    <div>
                        <label htmlFor="contacto-correo" className="etiqueta">Correo electrónico</label>
                        <input id="contacto-correo" name="correo" type="email" autoComplete="email" required maxLength={254} className="campo" placeholder="tu@correo.com" />
                    </div>
                    <div>
                        <label htmlFor="contacto-mensaje" className="etiqueta">Mensaje</label>
                        <textarea id="contacto-mensaje" name="mensaje" required minLength={5} maxLength={1000} rows={4} className="campo resize-y" placeholder="Cuéntanos cómo podemos ayudarte." />
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
                    {(!whatsappConfigurado || !correoConfigurado) && <p className="text-xs text-slate-500">Reemplaza los datos pendientes en `src/datos/contacto.js` para habilitar los canales de envío.</p>}
                </form>
            </div>
        </section>
    );
};

export default SeccionContacto;
