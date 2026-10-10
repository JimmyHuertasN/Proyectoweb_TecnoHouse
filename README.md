# Proyectoweb_TecnoHouse

## Configuración de Supabase

1. Ejecuta el script SQL del proyecto en el editor SQL de Supabase. El trigger `trg_crear_perfil` crea el perfil al registrarse y aplica el rol `cliente` por defecto; los roles `tecnico` y `admin` se asignan desde la base de datos, nunca desde el formulario de registro.
2. Crea un archivo `.env` en la raíz del proyecto y define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores de **Project URL** y **anon/public key** de tu proyecto Supabase.
3. Instala las dependencias con `npm install` y ejecuta `npm run dev`.

La página de inicio consulta la vista pública `tecnicos_publicos`, definida en el script SQL sobre `tecnicos` y `perfiles`. No almacenes contraseñas ni claves `service_role` en el navegador.