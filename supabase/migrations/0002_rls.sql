-- =============================================================
-- 0002_rls.sql
-- La seguridad. Este archivo es el que no puedes copiar sin leer.
-- =============================================================

-- -------------------------------------------------------------
-- Paso 1: cerrar la puerta a los no autenticados
-- -------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
revoke all on all sequences in schema public from anon;

-- 'anon' es el rol de quien no ha iniciado sesión. En esta app
-- nadie sin sesión tiene por qué leer nada, así que se lo quitamos
-- de entrada. Esto es un cinturón adicional: la RLS ya lo bloquea,
-- pero si algún día olvidas activar RLS en una tabla nueva, este
-- revoke la salva.


-- -------------------------------------------------------------
-- Paso 2: activar RLS en TODAS las tablas
-- -------------------------------------------------------------
alter table public.hogares       enable row level security;
alter table public.perfiles      enable row level security;
alter table public.cuentas       enable row level security;
alter table public.categorias    enable row level security;
alter table public.transacciones enable row level security;
alter table public.presupuestos  enable row level security;
alter table public.auditoria     enable row level security;

-- Al activar RLS sin políticas, la tabla queda cerrada a todo el
-- mundo. Postgres deniega por defecto. Las políticas de abajo son
-- las excepciones que abres a mano.
--
-- Si algún día agregas una tabla y olvidas esta línea, esa tabla
-- queda LEGIBLE POR CUALQUIERA que tenga la clave pública, que
-- está a la vista en el navegador. No hay error ni advertencia:
-- funciona perfecto y está abierta. Es el fallo número uno con
-- Supabase.


-- -------------------------------------------------------------
-- Paso 3: función auxiliar
-- -------------------------------------------------------------
create or replace function public.mi_hogar()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select hogar_id from public.perfiles where id = auth.uid();
$$;

grant execute on function public.mi_hogar() to authenticated;

-- Por qué esta función existe y no consultamos perfiles directo
-- dentro de las políticas:
--
-- La política de 'perfiles' necesita saber tu hogar. Si para
-- averiguarlo consulta 'perfiles', Postgres tiene que evaluar la
-- política de 'perfiles' otra vez para permitir esa consulta, que
-- vuelve a consultar 'perfiles'... y explota con un error de
-- recursión infinita.
--
-- security definer rompe el ciclo: la función corre con permisos
-- del dueño y se salta la RLS. Es seguro porque solo devuelve un
-- dato del usuario que ya está autenticado, y no recibe parámetros
-- (nadie puede pedirle el hogar de otro).
--
-- 'stable' le dice a Postgres que el resultado no cambia dentro de
-- la misma consulta, así la calcula una vez y no una vez por fila.


-- -------------------------------------------------------------
-- Paso 4: políticas
-- -------------------------------------------------------------

-- hogares -----------------------------------------------------
create policy "ver mi hogar"
on public.hogares for select to authenticated
using ( id = public.mi_hogar() );

create policy "editar mi hogar"
on public.hogares for update to authenticated
using ( id = public.mi_hogar() )
with check ( id = public.mi_hogar() );

-- USING filtra las filas que puedes tocar.
-- WITH CHECK valida las filas que dejas después de escribir.
-- Si pones solo USING en un update, puedes agarrar una fila tuya
-- y cambiarle el dueño a otro. Los dos van siempre juntos.


-- perfiles ----------------------------------------------------
create policy "ver perfiles de mi hogar"
on public.perfiles for select to authenticated
using ( hogar_id = public.mi_hogar() );

create policy "editar mi perfil"
on public.perfiles for update to authenticated
using ( id = (select auth.uid()) )
with check ( id = (select auth.uid()) );

-- Ves el nombre de tu pareja: se necesita para etiquetar la vista
-- consolidada. No hay política de insert ni de delete porque los
-- perfiles los crea el trigger, no el cliente.
--
-- auth.uid() va envuelto en (select ...) a propósito. Así Postgres
-- lo evalúa una sola vez por consulta en vez de una vez por fila.
-- En una tabla de 50.000 movimientos la diferencia es enorme.


-- cuentas -----------------------------------------------------
create policy "ver mis cuentas y las compartidas"
on public.cuentas for select to authenticated
using (
  perfil_id = (select auth.uid())
  or (hogar_id = public.mi_hogar() and visibilidad = 'compartida')
);

create policy "crear cuentas propias"
on public.cuentas for insert to authenticated
with check (
  perfil_id = (select auth.uid())
  and hogar_id = public.mi_hogar()
);

create policy "editar mis cuentas"
on public.cuentas for update to authenticated
using ( perfil_id = (select auth.uid()) )
with check ( perfil_id = (select auth.uid()) );

create policy "borrar mis cuentas"
on public.cuentas for delete to authenticated
using ( perfil_id = (select auth.uid()) );

-- Acá está el nivel intermedio de visibilidad: marcas una cuenta
-- como 'compartida' y tu pareja la ve completa. Las privadas no
-- las ve ni sabe que existen.


-- categorias --------------------------------------------------
create policy "ver categorias del hogar"
on public.categorias for select to authenticated
using ( hogar_id = public.mi_hogar() );

create policy "crear categorias del hogar"
on public.categorias for insert to authenticated
with check ( hogar_id = public.mi_hogar() );

create policy "editar categorias del hogar"
on public.categorias for update to authenticated
using ( hogar_id = public.mi_hogar() )
with check ( hogar_id = public.mi_hogar() );

-- Sin política de delete: borrar una categoría desordenaría el
-- histórico de ambos. Se desactiva, no se borra.


-- transacciones -----------------------------------------------
create policy "ver mis movimientos y los de cuentas compartidas"
on public.transacciones for select to authenticated
using (
  perfil_id = (select auth.uid())
  or cuenta_id in (
    select id from public.cuentas
    where hogar_id = public.mi_hogar()
      and visibilidad = 'compartida'
  )
);

create policy "crear movimientos en mis cuentas"
on public.transacciones for insert to authenticated
with check (
  perfil_id = (select auth.uid())
  and hogar_id = public.mi_hogar()
  and cuenta_id in (
    select id from public.cuentas
    where perfil_id = (select auth.uid())
  )
);

create policy "editar mis movimientos"
on public.transacciones for update to authenticated
using ( perfil_id = (select auth.uid()) )
with check ( perfil_id = (select auth.uid()) );

create policy "borrar mis movimientos"
on public.transacciones for delete to authenticated
using ( perfil_id = (select auth.uid()) );

-- La condición de cuenta_id en el INSERT es la importante: sin
-- ella podrías marcar un movimiento como tuyo pero cargarlo a la
-- cuenta de tu pareja y descuadrarle el saldo.


-- presupuestos ------------------------------------------------
create policy "ver mis presupuestos"
on public.presupuestos for select to authenticated
using ( perfil_id = (select auth.uid()) );

create policy "crear mis presupuestos"
on public.presupuestos for insert to authenticated
with check ( perfil_id = (select auth.uid()) );

create policy "editar mis presupuestos"
on public.presupuestos for update to authenticated
using ( perfil_id = (select auth.uid()) )
with check ( perfil_id = (select auth.uid()) );

create policy "borrar mis presupuestos"
on public.presupuestos for delete to authenticated
using ( perfil_id = (select auth.uid()) );


-- auditoria ---------------------------------------------------
create policy "ver mi propia auditoria"
on public.auditoria for select to authenticated
using ( perfil_id = (select auth.uid()) );

-- Solo select. Sin políticas de insert, update o delete, nadie
-- puede escribir ni borrar el registro desde el cliente. La única
-- forma de que entre una fila es el trigger, que corre en security
-- definer. Un rastro que el usuario puede alterar no es un rastro.


-- -------------------------------------------------------------
-- Paso 5: la vista consolidada
-- -------------------------------------------------------------
create or replace function public.resumen_hogar(
  p_desde date,
  p_hasta date
)
returns table (
  perfil_id  uuid,
  nombre     text,
  tipo       public.tipo_movimiento,
  categoria  text,
  total      numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.nombre,
    t.tipo,
    coalesce(c.nombre, 'Sin categoría'),
    sum(t.monto)
  from public.transacciones t
  join public.perfiles p on p.id = t.perfil_id
  left join public.categorias c on c.id = t.categoria_id
  where t.hogar_id = public.mi_hogar()
    and t.fecha between p_desde and p_hasta
  group by p.id, p.nombre, t.tipo, c.nombre;
$$;

grant execute on function public.resumen_hogar(date, date) to authenticated;

-- Este es el tercer nivel de visibilidad y el truco del diseño.
--
-- La función corre en security definer, así que ve TODOS los
-- movimientos del hogar, incluidos los privados. Pero solo puede
-- devolver lo que está en el GROUP BY: totales por persona, tipo y
-- categoría. Nunca una fila individual, nunca una descripción,
-- nunca un monto suelto.
--
-- El filtro es public.mi_hogar(), no un parámetro. Si recibiera el
-- hogar por parámetro, cualquiera podría pedir el resumen de otra
-- familia probando UUIDs. La función solo sabe consultar el hogar
-- de quien la llama.
--
-- ADVERTENCIA HONESTA: un agregado sí filtra información. Tu
-- pareja va a ver "gastaste $340.000 en Restaurantes en agosto".
-- No ve dónde ni con quién, pero ve el total. Si quieres algo más
-- reservado, quita p.id y p.nombre del select y del group by:
-- quedan los totales del hogar sin decir de quién fue cada peso.
-- Es una decisión de producto, no técnica. Decídela con ella.
