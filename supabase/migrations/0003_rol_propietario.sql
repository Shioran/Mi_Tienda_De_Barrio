-- =====================================================================
-- Mi Tienda de Barrio — Rol "propietario" (dueño único de la app)
-- Ejecutar DESPUÉS de 0002_gestion_usuarios.sql
-- =====================================================================
-- Jerarquía de roles: cajero < admin < propietario
--   - cajero: solo Registrar venta.
--   - admin: catálogo, inventario, reportes, precios (todo lo operativo).
--   - propietario: todo lo de admin, MÁS ascender/degradar admins y
--     eliminar usuarios. Solo puede haber "propietario" quien lo asigne
--     manualmente por SQL (no se puede otorgar desde la app).
-- ---------------------------------------------------------------------

alter type public.rol_usuario add value if not exists 'propietario';
