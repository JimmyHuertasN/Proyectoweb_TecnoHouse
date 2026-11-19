/*
    gestores.js
    Cuentas de gestor de tienda, solo para el administrador.
    - Crear una cuenta nueva pasa por el API ASP.NET (POST /api/gestores), que usa la
      API administrativa de Supabase Auth con una clave que nunca llega al navegador.
    - Listar, editar y dar o quitar el rol usan funciones de supabase/permisos_tienda.sql,
      que revisan en la base que quien llama sea administrador.
*/
import { llamarApi } from "./backend.js";
import { obtenerCliente, verificar } from "./supabase.js";

export const listarGestores = async () => {
    const filas = verificar(await obtenerCliente().rpc("listar_gestores_tienda"));
    return filas.map((fila) => ({
        id: fila.id,
        nombre: fila.nombre,
        telefono: fila.telefono ?? "",
        correo: fila.correo,
        creadoEn: fila.creado_en,
    }));
};

export const crearGestor = async ({ nombre, correo, telefono, contrasena }) => {
    await llamarApi("/api/gestores", { metodo: "POST", datos: { nombre, correo, telefono, contrasena } });
};

/* Convierte en gestor una cuenta de cliente que ya existe. */
export const darAccesoGestor = async (correo) => {
    verificar(await obtenerCliente().rpc("conceder_rol_gestor", { p_correo: correo }));
};

/* La cuenta vuelve a ser cliente y pierde el acceso a la tienda en su siguiente operación. */
export const retirarAccesoGestor = async (id) => {
    verificar(await obtenerCliente().rpc("retirar_rol_gestor", { p_perfil_id: id }));
};

export const actualizarGestor = async (id, { nombre, telefono }) => {
    verificar(await obtenerCliente().rpc("actualizar_gestor", { p_perfil_id: id, p_nombre: nombre, p_telefono: telefono }));
};
