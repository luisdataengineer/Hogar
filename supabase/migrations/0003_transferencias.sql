-- =============================================================
-- 0003_transferencias.sql
-- Cierra el hueco: una transferencia necesita origen y destino.
-- Las migraciones ya aplicadas no se editan; se agrega encima.
-- =============================================================

-- -------------------------------------------------------------
-- Paso 1: la columna
-- -------------------------------------------------------------
alter table public.transacciones
  add column cuenta_destino_id uuid references public.cuentas(id) on delete restrict;

create index transacciones_cuenta_destino_idx
  on public.transacciones(cuenta_destino_id);

comment on column public.transacciones.cuenta_destino_id is
  'Solo se llena cuando tipo = transferencia. Ver constraint abajo.';

-- on delete restrict y no cascade: si intentas borrar una cuenta
-- que es destino de transferencias, Postgres te frena. Con cascade
-- borrarías movimientos que también pertenecen a la cuenta origen,
-- y esa quedaría descuadrada sin que nadie se entere.


-- -------------------------------------------------------------
-- Paso 2: hacer imposible el estado imposible
-- -------------------------------------------------------------
alter table public.transacciones
  add constraint transferencia_coherente check (
    (tipo = 'transferencia'
      and cuenta_destino_id is not null
      and cuenta_destino_id <> cuenta_id)
    or
    (tipo <> 'transferencia'
      and cuenta_destino_id is null)
  );

-- Tres cosas quedan garantizadas por la base de datos:
--   1. Una transferencia SIEMPRE tiene destino.
--   2. Un gasto o ingreso NUNCA tiene destino.
--   3. Nadie transfiere de una cuenta a sí misma.
--
-- Esto no depende de que el frontend valide bien, ni de que tu
-- proceso de correos esté correcto, ni de que nadie escriba a
-- mano en la base. Un insert que rompa la regla es rechazado.
--
-- Es la misma idea del unique (perfil_id, referencia_externa):
-- la regla de negocio vive donde no se puede evadir.


-- -------------------------------------------------------------
-- Paso 3: actualizar la política de inserción
-- -------------------------------------------------------------
-- La política vieja solo validaba cuenta_id. Ahora hay una
-- segunda cuenta y también hay que validarla: sin esto podrías
-- transferir hacia la cuenta de tu pareja y descuadrarle el saldo.

drop policy "crear movimientos en mis cuentas" on public.transacciones;

create policy "crear movimientos en mis cuentas"
on public.transacciones for insert to authenticated
with check (
  perfil_id = (select auth.uid())
  and hogar_id = public.mi_hogar()
  and cuenta_id in (
    select id from public.cuentas
    where perfil_id = (select auth.uid())
  )
  and (
    cuenta_destino_id is null
    or cuenta_destino_id in (
      select id from public.cuentas
      where perfil_id = (select auth.uid())
    )
  )
);

-- Lección general: cada vez que agregas una columna que apunta a
-- otra tabla, revisa si alguna política necesita validarla. Una
-- columna nueva sin política es una puerta nueva sin chapa.
