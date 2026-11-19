-- =====================================================================
-- rol_gestor_tienda.sql   (paso 1 de 3 del rol "Gestor de tienda")
-- Agrega el valor 'gestor_tienda' al tipo public.rol_usuario.
--
-- Va solo en este archivo porque PostgreSQL no deja USAR un valor nuevo de
-- un enum en la misma transacción que lo crea. El editor SQL de Supabase
-- ejecuta cada "Run" como una transacción: primero se ejecuta este archivo y,
-- cuando termine, permisos_tienda.sql (paso 2) y gestor_prueba.sql (paso 3).
--
-- Se puede ejecutar varias veces: si el valor ya existe no hace nada.
-- =====================================================================

alter type public.rol_usuario add value if not exists 'gestor_tienda';
