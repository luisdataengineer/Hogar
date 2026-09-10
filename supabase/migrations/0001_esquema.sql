-- =============================================================
-- 0001_esquema.sql
-- Estructura de datos. Sin seguridad todavía: eso va en 0002.
-- =============================================================

create extension if not exists "pgcrypto";
-- pgcrypto nos da gen_random_uuid(). Usamos UUID y no enteros
-- autoincrementales porque un ID secuencial le dice al mundo
-- cuántos registros tienes y permite adivinar el siguiente.


-- -------------------------------------------------------------
-- Tipos
-- -------------------------------------------------------------
-- Un enum es una lista cerrada. Si alguien intenta guardar
-- 'privada ' con un espacio, Postgres lo rechaza. Con texto libre
-- terminas con 'privada', 'Privada' y 'PRIVADA' en la misma columna.

create type public.tipo_cuenta as enum (
  'efectivo', 'ahorro', 'corriente', 'tarjeta_credito', 'inversion'
);

create type public.visibilidad as enum ('privada', 'compartida');

create type public.tipo_movimiento as enum ('ingreso', 'gasto', 'transferencia');

create type public.origen_registro as enum ('manual', 'correo', 'importado');


-- -------------------------------------------------------------
-- hogares
-- -------------------------------------------------------------
create table public.hogares (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null check (length(trim(nombre)) > 0),
  codigo_invitacion  text not null unique default encode(gen_random_bytes(6), 'hex'),
  creado_en          timestamptz not null default now()
);

comment on column public.hogares.codigo_invitacion is
  'Código corto que se comparte con la pareja para unirse al hogar.';


-- -------------------------------------------------------------
-- perfiles
-- -------------------------------------------------------------
-- auth.users es de Supabase y no se toca. perfiles es tu tabla
-- paralela, con la misma llave, para los datos de tu aplicación.

create table public.perfiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  hogar_id   uuid not null references public.hogares(id) on delete restrict,
  nombre     text not null check (length(trim(nombre)) > 0),
  creado_en  timestamptz not null default now()
);

create index perfiles_hogar_idx on public.perfiles(hogar_id);

-- on delete cascade: si se borra el usuario, se borra su perfil.
-- on delete restrict en hogar_id: Postgres impide borrar un hogar
-- que todavía tiene miembros. Es una red de seguridad contra
-- borrados en cadena que no querías.


-- -------------------------------------------------------------
-- cuentas
-- -------------------------------------------------------------
create table public.cuentas (
  id             uuid primary key default gen_random_uuid(),
  perfil_id      uuid not null references public.perfiles(id) on delete cascade,
  hogar_id       uuid not null references public.hogares(id) on delete restrict,
  nombre         text not null check (length(trim(nombre)) > 0),
  tipo           public.tipo_cuenta not null,
  moneda         char(3) not null default 'COP',
  saldo_inicial  numeric(14,2) not null default 0,
  visibilidad    public.visibilidad not null default 'privada',
  activa         boolean not null default true,
  creada_en      timestamptz not null default now()
);

create index cuentas_perfil_idx on public.cuentas(perfil_id);
create index cuentas_hogar_visibilidad_idx on public.cuentas(hogar_id, visibilidad);

-- numeric(14,2) y NUNCA float para dinero. Los flotantes son
-- aproximaciones binarias: 0.1 + 0.2 da 0.30000000000000004.
-- En una suma de mil movimientos eso se convierte en descuadre real.
-- numeric guarda decimales exactos.


-- -------------------------------------------------------------
-- categorias
-- -------------------------------------------------------------
-- Del hogar, no de la persona. Ambos usan las mismas categorías
-- porque si no, la vista consolidada no cuadra.

create table public.categorias (
  id        uuid primary key default gen_random_uuid(),
  hogar_id  uuid not null references public.hogares(id) on delete cascade,
  nombre    text not null check (length(trim(nombre)) > 0),
  tipo      public.tipo_movimiento not null,
  padre_id  uuid references public.categorias(id) on delete set null,
  unique (hogar_id, nombre, tipo)
);

create index categorias_hogar_idx on public.categorias(hogar_id);

-- padre_id apunta a la misma tabla: así "Restaurantes" cuelga de
-- "Alimentación" sin necesitar otra tabla.


-- -------------------------------------------------------------
-- transacciones
-- -------------------------------------------------------------
create table public.transacciones (
  id                  uuid primary key default gen_random_uuid(),
  cuenta_id           uuid not null references public.cuentas(id) on delete cascade,
  perfil_id           uuid not null references public.perfiles(id) on delete cascade,
  hogar_id            uuid not null references public.hogares(id) on delete restrict,
  categoria_id        uuid references public.categorias(id) on delete set null,
  tipo                public.tipo_movimiento not null,
  monto               numeric(14,2) not null check (monto > 0),
  descripcion         text,
  fecha               date not null default current_date,
  origen              public.origen_registro not null default 'manual',
  referencia_externa  text,
  creada_en           timestamptz not null default now(),
  unique (perfil_id, referencia_externa)
);

create index transacciones_perfil_fecha_idx on public.transacciones(perfil_id, fecha desc);
create index transacciones_cuenta_idx on public.transacciones(cuenta_id);
create index transacciones_hogar_fecha_idx on public.transacciones(hogar_id, fecha desc);

-- El monto siempre es positivo; el signo lo da 'tipo'. Guardar
-- negativos es una fuente clásica de errores al sumar.

-- unique (perfil_id, referencia_externa) es la pieza clave para
-- leer correos de Bancolombia y BBVA. Guardas ahí el identificador
-- del correo, y si el proceso corre dos veces, Postgres rechaza
-- el duplicado. La deduplicación queda garantizada por la base,
-- no por tu código.

comment on column public.transacciones.hogar_id is
  'Denormalizado a propósito: evita un join en cada política RLS.';


-- -------------------------------------------------------------
-- presupuestos
-- -------------------------------------------------------------
create table public.presupuestos (
  id            uuid primary key default gen_random_uuid(),
  perfil_id     uuid not null references public.perfiles(id) on delete cascade,
  categoria_id  uuid not null references public.categorias(id) on delete cascade,
  periodo       date not null,
  monto_limite  numeric(14,2) not null check (monto_limite > 0),
  unique (perfil_id, categoria_id, periodo)
);

-- periodo guarda el primer día del mes: 2026-09-01 = septiembre.
-- Un solo campo date en vez de dos enteros año/mes, así puedes
-- comparar rangos directamente.


-- -------------------------------------------------------------
-- auditoria
-- -------------------------------------------------------------
create table public.auditoria (
  id           bigserial primary key,
  perfil_id    uuid references public.perfiles(id) on delete set null,
  accion       text not null,
  tabla        text not null,
  registro_id  uuid,
  datos_antes  jsonb,
  datos_despues jsonb,
  creada_en    timestamptz not null default now()
);

create index auditoria_perfil_fecha_idx on public.auditoria(perfil_id, creada_en desc);


-- -------------------------------------------------------------
-- Trigger: crear hogar y perfil al registrarse
-- -------------------------------------------------------------
create or replace function public.manejar_usuario_nuevo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hogar_id uuid;
  v_codigo   text;
begin
  v_codigo := new.raw_user_meta_data ->> 'codigo_invitacion';

  if v_codigo is not null then
    select id into v_hogar_id
    from public.hogares
    where codigo_invitacion = v_codigo;
  end if;

  if v_hogar_id is null then
    insert into public.hogares (nombre)
    values (coalesce(new.raw_user_meta_data ->> 'nombre_hogar', 'Mi hogar'))
    returning id into v_hogar_id;
  end if;

  insert into public.perfiles (id, hogar_id, nombre)
  values (
    new.id,
    v_hogar_id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
  );

  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.manejar_usuario_nuevo();

-- security definer = la función corre con permisos del dueño, no
-- de quien la dispara. Necesario porque el usuario que se acaba de
-- registrar todavía no tiene permiso de escribir en perfiles.
--
-- set search_path = '' es OBLIGATORIO en toda función security
-- definer. Sin eso, alguien puede crear una tabla en otro esquema
-- que se llame igual, ponerla primero en su search_path, y hacer
-- que tu función privilegiada escriba en la tabla de él. Es un
-- vector de escalada de privilegios documentado. Por eso todo
-- va escrito como public.tabla, con el esquema completo.


-- -------------------------------------------------------------
-- Trigger: auditoría genérica
-- -------------------------------------------------------------
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.auditoria (perfil_id, accion, tabla, registro_id, datos_antes, datos_despues)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger auditar_transacciones
  after insert or update or delete on public.transacciones
  for each row execute function public.registrar_auditoria();

create trigger auditar_cuentas
  after insert or update or delete on public.cuentas
  for each row execute function public.registrar_auditoria();

-- Una sola función sirve para todas las tablas: tg_op trae la
-- operación y tg_table_name el nombre de la tabla.
