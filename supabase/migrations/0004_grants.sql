-- =============================================================
-- 0004_grants.sql
-- Faltaba la base: los privilegios de tabla.
--
-- Las politicas de 0002 restringen QUE FILAS ve cada quien, pero
-- la RLS solo actua encima de un permiso que ya exista. Si el rol
-- no tiene GRANT sobre la tabla, Postgres responde "permission
-- denied" sin llegar a evaluar la politica.
--
-- Las versiones actuales de Supabase ya no conceden SELECT/INSERT/
-- UPDATE/DELETE por defecto a anon ni authenticated. Hay que
-- hacerlo explicito. Esta migracion concede a authenticated
-- EXACTAMENTE las operaciones para las que cada tabla tiene
-- politica en 0002/0003, y da acceso completo a service_role.
--
-- anon no recibe nada: 0002 le cerro la puerta a proposito.
-- =============================================================

-- -------------------------------------------------------------
-- authenticated: privilegio minimo, alineado con las politicas
-- -------------------------------------------------------------
grant select, update                 on public.hogares       to authenticated;
grant select, update                 on public.perfiles      to authenticated;
grant select, insert, update, delete on public.cuentas       to authenticated;
grant select, insert, update         on public.categorias    to authenticated;  -- sin delete: no hay politica de borrado
grant select, insert, update, delete on public.transacciones to authenticated;
grant select, insert, update, delete on public.presupuestos  to authenticated;
grant select                         on public.auditoria     to authenticated;  -- solo lectura; las filas las escribe el trigger

-- Sin grant sobre secuencias para authenticated: todos los PK son
-- uuid con default gen_random_uuid(). El unico bigserial es
-- auditoria.id, y esa tabla solo la escribe el trigger, que corre
-- en security definer con permisos del dueno.


-- -------------------------------------------------------------
-- service_role: acceso completo. Se usa solo desde el servidor
-- (lib/supabase/admin.ts), se salta la RLS, y nunca llega al
-- navegador (regla 2). Necesita el privilegio de tabla igual.
-- -------------------------------------------------------------
grant all privileges on public.hogares       to service_role;
grant all privileges on public.perfiles      to service_role;
grant all privileges on public.cuentas       to service_role;
grant all privileges on public.categorias    to service_role;
grant all privileges on public.transacciones to service_role;
grant all privileges on public.presupuestos  to service_role;
grant all privileges on public.auditoria     to service_role;

grant usage, select on sequence public.auditoria_id_seq to service_role;
