-- =============================================================
-- 0001_rls.sql  ·  pgTAP  ·  se ejecuta con: supabase test db
--
-- Verifica que la RLS de 0002/0003 y los grants de 0004 hacen
-- lo que se espera. Todo ocurre dentro de una transaccion que
-- se revierte: no deja usuarios ni datos en la base local.
--
-- Los tres niveles de visibilidad bajo prueba:
--   1. privado   -> cada quien solo ve lo suyo
--   2. compartido-> la pareja ve la cuenta completa
--   3. resumen   -> resumen_hogar() da solo totales agregados
-- =============================================================
begin;

create extension if not exists pgtap with schema extensions;

-- -------------------------------------------------------------
-- Utilidades de prueba (viven en el esquema tests, se revierten)
-- -------------------------------------------------------------
create schema tests;

-- Crea un usuario de auth. El trigger al_crear_usuario arma el
-- hogar y el perfil; si el metadata trae codigo_invitacion, se
-- une a ese hogar en vez de crear uno.
create function tests.crear_usuario(p_email text, p_meta jsonb) returns uuid
language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role, created_at, updated_at)
  values (v_id, p_email, p_meta, 'authenticated', 'authenticated', now(), now());
  return v_id;
end $$;

-- Corre un SELECT escalar suplantando a un usuario (o a 'anon' si
-- p_uid es null) y SIEMPRE devuelve el rol a postgres, incluso si
-- la consulta falla. Devuelve el valor como texto.
create function tests.escalar(p_uid uuid, p_sql text) returns text
language plpgsql as $$
declare v text;
begin
  if p_uid is null then
    perform set_config('request.jwt.claims', '', true);
    set local role anon;
  else
    perform set_config('request.jwt.claims',
                       jsonb_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
  end if;
  execute p_sql into v;
  reset role;
  return v;
exception when others then
  reset role;
  return 'ERROR: ' || sqlerrm;
end $$;

-- ¿La base RECHAZA esta operacion para el usuario dado?
-- Cubre los dos frenos: falta de privilegio de tabla y RLS.
create function tests.rechazado(p_uid uuid, p_sql text) returns boolean
language plpgsql as $$
begin
  if p_uid is null then
    perform set_config('request.jwt.claims', '', true);
    set local role anon;
  else
    perform set_config('request.jwt.claims',
                       jsonb_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
  end if;
  execute p_sql;
  reset role;
  return false;   -- se permitio
exception when others then
  reset role;
  return true;    -- se rechazo
end $$;


-- -------------------------------------------------------------
-- Usuarios y datos de prueba
--   Ana + Beto  -> Hogar Uno   (Beto entra con el codigo)
--   Caro        -> Hogar Dos
-- -------------------------------------------------------------
do $$
declare
  v_ana uuid; v_beto uuid; v_caro uuid;
  v_codigo text; v_h1 uuid; v_h2 uuid;
  a_priv   uuid := gen_random_uuid();
  a_shared uuid := gen_random_uuid();
  b_priv   uuid := gen_random_uuid();
  c_priv   uuid := gen_random_uuid();
begin
  v_ana := tests.crear_usuario('ana@test.local',
                               '{"nombre":"Ana","nombre_hogar":"Hogar Uno"}');
  select codigo_invitacion into v_codigo from public.hogares where nombre = 'Hogar Uno';
  v_beto := tests.crear_usuario('beto@test.local',
                                jsonb_build_object('nombre','Beto','codigo_invitacion', v_codigo));
  v_caro := tests.crear_usuario('caro@test.local',
                                '{"nombre":"Caro","nombre_hogar":"Hogar Dos"}');

  select hogar_id into v_h1 from public.perfiles where id = v_ana;
  select hogar_id into v_h2 from public.perfiles where id = v_caro;

  create table tests.d (clave text primary key, val uuid);
  insert into tests.d (clave, val) values
    ('ana', v_ana), ('beto', v_beto), ('caro', v_caro),
    ('h1', v_h1), ('h2', v_h2),
    ('a_priv', a_priv), ('a_shared', a_shared), ('b_priv', b_priv), ('c_priv', c_priv);

  -- Siembra como postgres (sin RLS de por medio). Se fija el claim
  -- jwt para que el trigger de auditoria registre el perfil correcto.
  perform set_config('request.jwt.claims',
                     jsonb_build_object('sub', v_ana, 'role','authenticated')::text, true);
  insert into public.categorias (hogar_id, nombre, tipo) values (v_h1, 'Mercado', 'gasto');
  insert into public.cuentas (id, perfil_id, hogar_id, nombre, tipo, visibilidad) values
    (a_priv,   v_ana, v_h1, 'Ana Efectivo', 'efectivo',  'privada'),
    (a_shared, v_ana, v_h1, 'Casa',         'corriente', 'compartida');
  insert into public.transacciones (cuenta_id, perfil_id, hogar_id, tipo, monto, descripcion) values
    (a_priv,   v_ana, v_h1, 'gasto', 100, 'Privado Ana'),
    (a_shared, v_ana, v_h1, 'gasto', 200, 'Compartido Ana');

  perform set_config('request.jwt.claims',
                     jsonb_build_object('sub', v_beto, 'role','authenticated')::text, true);
  insert into public.cuentas (id, perfil_id, hogar_id, nombre, tipo, visibilidad) values
    (b_priv, v_beto, v_h1, 'Beto Ahorro', 'ahorro', 'privada');
  insert into public.transacciones (cuenta_id, perfil_id, hogar_id, tipo, monto, descripcion) values
    (b_priv, v_beto, v_h1, 'gasto', 50, 'Privado Beto');

  perform set_config('request.jwt.claims',
                     jsonb_build_object('sub', v_caro, 'role','authenticated')::text, true);
  insert into public.categorias (hogar_id, nombre, tipo) values (v_h2, 'Mercado', 'gasto');
  insert into public.cuentas (id, perfil_id, hogar_id, nombre, tipo, visibilidad) values
    (c_priv, v_caro, v_h2, 'Caro Efectivo', 'efectivo', 'privada');
  insert into public.transacciones (cuenta_id, perfil_id, hogar_id, tipo, monto, descripcion) values
    (c_priv, v_caro, v_h2, 'gasto', 30, 'Privado Caro');

  perform set_config('request.jwt.claims', '', true);
end $$;


-- =============================================================
select plan(26);

-- -------------------------------------------------------------
-- Trigger de alta
-- -------------------------------------------------------------
select is(
  (select (b.hogar_id = a.hogar_id and c.hogar_id <> a.hogar_id)::text
   from public.perfiles a, public.perfiles b, public.perfiles c
   where a.id = (select val from tests.d where clave='ana')
     and b.id = (select val from tests.d where clave='beto')
     and c.id = (select val from tests.d where clave='caro')),
  'true',
  'alta: el codigo_invitacion mete a Beto en el hogar de Ana; Caro queda en otro hogar'
);

-- -------------------------------------------------------------
-- Controles positivos: cada quien SI ve lo suyo
-- (sin esto, una politica que niega todo tambien "pasaria")
-- -------------------------------------------------------------
select is(
  tests.escalar((select val from tests.d where clave='ana'),
    $q$ select count(*)::text from public.cuentas where perfil_id = (select auth.uid()) $q$),
  '2',
  'positivo: Ana ve sus 2 cuentas'
);
select is(
  tests.escalar((select val from tests.d where clave='ana'),
    $q$ select count(*)::text from public.transacciones where perfil_id = (select auth.uid()) $q$),
  '2',
  'positivo: Ana ve sus 2 movimientos'
);
select is(
  tests.escalar((select val from tests.d where clave='beto'),
    $q$ select count(*)::text from public.cuentas where nombre = 'Beto Ahorro' $q$),
  '1',
  'positivo: Beto ve su propia cuenta privada'
);

-- -------------------------------------------------------------
-- Nivel 2: compartido
-- -------------------------------------------------------------
select is(
  tests.escalar((select val from tests.d where clave='beto'),
    $q$ select count(*)::text from public.cuentas where nombre = 'Casa' $q$),
  '1',
  '#1  Beto ve la cuenta COMPARTIDA de Ana'
);
select is(
  tests.escalar((select val from tests.d where clave='beto'),
    $q$ select count(*)::text from public.cuentas where nombre = 'Ana Efectivo' $q$),
  '0',
  '#2  Beto NO ve la cuenta PRIVADA de Ana'
);
select is(
  tests.escalar((select val from tests.d where clave='beto'),
    $q$ select exists(select 1 from public.transacciones where descripcion = 'Compartido Ana')::text $q$),
  'true',
  '#3a  Beto ve el movimiento de la cuenta compartida'
);
select is(
  tests.escalar((select val from tests.d where clave='beto'),
    $q$ select exists(select 1 from public.transacciones where descripcion = 'Privado Ana')::text $q$),
  'false',
  '#3b  Beto NO ve el movimiento de la cuenta privada'
);

-- -------------------------------------------------------------
-- perfiles: se ve el nombre de la pareja, no el de otros hogares
-- -------------------------------------------------------------
select is(
  tests.escalar((select val from tests.d where clave='beto'),
    $q$ select count(*)::text from public.perfiles where nombre = 'Ana' $q$),
  '1',
  '#4a  Beto ve el perfil de Ana (mismo hogar)'
);
select is(
  tests.escalar((select val from tests.d where clave='caro'),
    $q$ select count(*)::text from public.perfiles where nombre = 'Ana' $q$),
  '0',
  '#4b  Caro NO ve el perfil de Ana (otro hogar)'
);

-- -------------------------------------------------------------
-- Nivel 1: aislamiento total entre hogares
-- -------------------------------------------------------------
select is(
  tests.escalar((select val from tests.d where clave='caro'),
    format($q$ select count(*)::text from public.cuentas where hogar_id = %L $q$,
           (select val from tests.d where clave='h1'))),
  '0',
  '#5a  Caro ve CERO cuentas del Hogar Uno'
);
select is(
  tests.escalar((select val from tests.d where clave='caro'),
    format($q$ select count(*)::text from public.transacciones where hogar_id = %L $q$,
           (select val from tests.d where clave='h1'))),
  '0',
  '#5b  Caro ve CERO movimientos del Hogar Uno'
);
select is(
  tests.escalar((select val from tests.d where clave='caro'),
    format($q$ select count(*)::text from public.categorias where hogar_id = %L $q$,
           (select val from tests.d where clave='h1'))),
  '0',
  '#5c  Caro ve CERO categorias del Hogar Uno'
);
select is(
  tests.escalar((select val from tests.d where clave='caro'),
    format($q$ select count(*)::text from public.hogares where id = %L $q$,
           (select val from tests.d where clave='h1'))),
  '0',
  '#5d  Caro ve CERO hogares ajenos'
);

-- -------------------------------------------------------------
-- Nivel 3: resumen_hogar() da solo agregados del hogar propio
-- -------------------------------------------------------------
select is(
  tests.escalar((select val from tests.d where clave='beto'),
    $q$ select coalesce(sum(total),0)::text from public.resumen_hogar('2000-01-01','2100-01-01') $q$),
  '350.00',
  '#6a  resumen para Beto: 100 privado + 200 compartido + 50 = 350, el privado va DENTRO del total'
);
select is(
  tests.escalar((select val from tests.d where clave='beto'),
    $q$ select count(*)::text from public.resumen_hogar('2000-01-01','2100-01-01') $q$),
  '2',
  '#6b  resumen: 2 filas agregadas (por persona), nunca los movimientos sueltos'
);
select is(
  tests.escalar((select val from tests.d where clave='caro'),
    $q$ select coalesce(sum(total),0)::text from public.resumen_hogar('2000-01-01','2100-01-01') $q$),
  '30.00',
  '#6c  resumen para Caro: solo su hogar (30), el filtro es mi_hogar() no un parametro'
);

-- -------------------------------------------------------------
-- Escritura: no puedes tocar cuentas ajenas
-- -------------------------------------------------------------
select ok(
  tests.rechazado((select val from tests.d where clave='ana'),
    format($q$ insert into public.transacciones (cuenta_id, perfil_id, hogar_id, tipo, monto, descripcion)
               values (%L, %L, %L, 'gasto', 10, 'intento') $q$,
           (select val from tests.d where clave='b_priv'),
           (select val from tests.d where clave='ana'),
           (select val from tests.d where clave='h1'))),
  '#7  Ana NO puede cargar un gasto a la cuenta privada de Beto'
);

-- -------------------------------------------------------------
-- auditoria: rastro que el usuario no puede alterar
-- -------------------------------------------------------------
select ok(
  tests.rechazado((select val from tests.d where clave='ana'),
    $q$ insert into public.auditoria (accion, tabla) values ('hack','x') $q$),
  '#8a  authenticated NO puede insertar en auditoria'
);
select ok(
  tests.rechazado((select val from tests.d where clave='ana'),
    $q$ update public.auditoria set accion = 'hack' $q$),
  '#8b  authenticated NO puede actualizar auditoria'
);
select ok(
  tests.rechazado((select val from tests.d where clave='ana'),
    $q$ delete from public.auditoria $q$),
  '#8c  authenticated NO puede borrar auditoria'
);

-- -------------------------------------------------------------
-- auditoria: el trigger si escribe, y cada quien ve solo lo suyo
--   Ana sembro 2 cuentas + 2 movimientos = 4 filas
--   Caro sembro 1 cuenta + 1 movimiento  = 2 filas
-- -------------------------------------------------------------
select is(
  tests.escalar((select val from tests.d where clave='ana'),
    $q$ select count(*)::text from public.auditoria where perfil_id = (select auth.uid()) $q$),
  '4',
  '#9a  el trigger escribio la auditoria de Ana (4 filas)'
);
select is(
  tests.escalar((select val from tests.d where clave='ana'),
    $q$ select count(*)::text from public.auditoria where perfil_id <> (select auth.uid()) $q$),
  '0',
  '#9b  Ana NO ve filas de auditoria de otros'
);
select is(
  tests.escalar((select val from tests.d where clave='caro'),
    $q$ select count(*)::text from public.auditoria where perfil_id = (select auth.uid()) $q$),
  '2',
  '#9c  Caro solo ve sus 2 filas de auditoria'
);

-- -------------------------------------------------------------
-- anon: sin sesion no se lee nada
-- -------------------------------------------------------------
select ok(
  tests.rechazado(null, $q$ select 1 from public.transacciones $q$),
  '#10a  anon no puede leer transacciones'
);
select ok(
  tests.rechazado(null, $q$ select 1 from public.cuentas $q$),
  '#10b  anon no puede leer cuentas'
);

select * from finish();
rollback;
