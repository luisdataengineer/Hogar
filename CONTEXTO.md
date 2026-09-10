# CONTEXTO.md

Documento para dar contexto al asistente al abrir el proyecto.
Léelo completo antes de proponer o escribir cualquier cosa.

---

## Qué es esto

App web de finanzas personales para dos personas de un mismo hogar.
Uso privado, no comercial. Es también el proyecto piloto con el que
se está construyendo un esqueleto reutilizable para futuros clientes,
así que las decisiones deben ser generalizables y estar bien hechas.

**Requisitos del producto:**
- Registro de gastos diarios con la menor fricción posible (prioridad #1)
- Alimentación automática desde correos de notificación bancaria
  (Bancolombia y BBVA) — fase posterior, pero el modelo ya lo soporta
- Presupuesto por categoría y mes
- Patrimonio e inversiones — fase posterior
- Uso individual de cada persona, más una vista consolidada de pareja
- Se usa principalmente desde el celular

---

## Stack decidido

| Capa | Elección |
|---|---|
| Framework | Next.js con App Router y TypeScript |
| Estilos | Tailwind + shadcn/ui |
| Base de datos, auth y storage | Supabase (Postgres) |
| Validación | Zod, siempre del lado del servidor |
| Hosting | Vercel |
| Desarrollo local | Supabase CLI con Docker |

---

## Esquema de datos

Ya está diseñado, revisado y entendido. **No lo rediseñes ni
propongas cambios sin preguntar.** Cuatro migraciones existentes:

- `0001_esquema.sql` — tablas, tipos, índices, triggers
- `0002_rls.sql` — RLS y todas las políticas
- `0003_transferencias.sql` — cuenta destino y ajuste de política
- `0004_grants.sql` — privilegios de tabla (`grant select/insert/…`)
  para `authenticated` y `service_role`. Necesario: las versiones
  actuales de Supabase ya no los conceden por defecto, y la RLS solo
  filtra encima de un permiso que exista. Probado en `supabase/tests/`.

**Tablas:** `hogares`, `perfiles`, `cuentas`, `categorias`,
`transacciones`, `presupuestos`, `auditoria`.

**Modelo de visibilidad — tres niveles:**
1. Privado por defecto: cada persona solo ve lo suyo
2. Cuentas marcadas como `compartida`: la pareja las ve completas
3. Vista consolidada: la función `resumen_hogar()` devuelve solo
   totales agregados, nunca movimientos individuales

---

## Reglas no negociables

1. **RLS activada en toda tabla nueva.** Sin excepción, incluso en
   tablas que parezcan inofensivas.
2. **La clave `service_role` nunca llega al navegador.** Solo en
   Route Handlers o Server Actions, y solo desde `lib/supabase/admin.ts`.
3. **Toda función `security definer` lleva `set search_path = ''`**
   y referencia todo con esquema completo (`public.tabla`).
4. **Dinero en `numeric`, jamás en `float`.**
5. **Las migraciones aplicadas no se editan.** Un cambio de esquema
   es un archivo nuevo con el siguiente número.
6. **Validación de entrada en el servidor con Zod.** La validación
   del formulario es comodidad, no seguridad.
7. **`.env.local` nunca va a git.**
8. **Nunca apuntar el entorno de desarrollo a la base de producción.**

## Convenciones

- Nombres de tablas, columnas y funciones **en español**, en plural
  para tablas, sin tildes ni ñ.
- Código, nombres de variables y comentarios de TypeScript en español
  también, para mantener consistencia.
- Un archivo por responsabilidad. Nada de archivos de 400 líneas.

---

## Cómo quiero trabajar

- **Un archivo a la vez.** Explícame qué hace y por qué antes de
  escribirlo, no después.
- **No agregues nada que no haya pedido.** Ni dependencias, ni
  archivos de ejemplo, ni features "que de una vez".
- **Antes de instalar una dependencia, dime para qué sirve** y si
  hay forma de evitarla.
- Estoy aprendiendo este stack. Vengo de Google Apps Script, Excel
  y SQL. Entiendo bien datos y procesos; me falta el lado web.
- Si algo que pido está mal, dímelo. Prefiero corregir ahora.

---

## Plan de trabajo

### Fase 1 — Entorno
Verificar e instalar: Node LTS, Git, Docker Desktop, Supabase CLI.
Confirmar cada uno con su comando de versión antes de seguir.

### Fase 2 — Proyecto base
1. `create-next-app` con TypeScript, Tailwind, App Router, ESLint
2. Instalar `@supabase/supabase-js` y `@supabase/ssr`
3. Inicializar shadcn/ui
4. `supabase init`
5. Copiar las tres migraciones a `supabase/migrations/`
6. `supabase start` y `supabase db reset`

**Punto de control:** las tablas aparecen en el Studio local y las
tres migraciones corrieron sin error.

### Fase 3 — Probar que la RLS realmente bloquea
Antes de escribir una sola pantalla. Crear dos usuarios de prueba
en hogares distintos, cargarles datos, y verificar desde SQL —
suplantando el rol `authenticated` con cada `auth.uid()` — que:
- Ninguno ve las transacciones del otro
- Ninguno ve las cuentas privadas del otro
- Sí se ven las cuentas marcadas como compartidas
- `resumen_hogar()` no devuelve filas individuales
- Nadie puede insertar en `auditoria`

**Este paso no se salta.** Una política que nunca probaste es una
política que no sabes si funciona.

Hecho: suite pgTAP en `supabase/tests/0001_rls.sql` (26 pruebas,
3 usuarios). Se corre con `supabase test db`.

### Fase 4 — Conexión y sesión
Los cuatro archivos que importan:
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `proxy.ts` — antes se llamaba `middleware.ts`; Next 16 lo deprecó
  y renombró a `proxy` (misma función). En la raíz del proyecto.

**Punto de control:** revisar estos cuatro con calma antes de seguir.

### Fase 5 — Autenticación
Login, recuperar clave, callback, layout protegido, cerrar sesión.

Hecho, incluyendo registro con `codigo_invitacion` (se decidió sumarlo).
- `lib/auth/esquemas.ts` (Zod) + `lib/auth/acciones.ts` (Server Actions)
- Pantallas: `/login`, `/registro`, `/recuperar`, `/recuperar/nueva-clave`
- `app/auth/confirm/route.ts` valida el `token_hash` del correo (`verifyOtp`)
- `app/(app)/` = zona autenticada; su `layout.tsx` es el gate real
- Plantilla de correo personalizada: `supabase/templates/recuperar_clave.html`
- Probado de punta a punta (registro, invitación, login, recuperación).

### Fase 6 — Primera pantalla útil
Registro de un gasto en el menor número de toques posible, y lista
de movimientos del mes. Nada más. Es la funcionalidad que decide si
la app se usa o se abandona.

Hecho. Se decidió sumar gestión de cuentas (un gasto necesita una
cuenta y el registro no crea ninguna).
- `lib/supabase/tipos.ts` — tipos generados de la BD, cableados a los
  4 clientes. Regenerar con `supabase gen types typescript --local` en
  cada cambio de esquema.
- `lib/cuentas/` y `lib/gastos/` — esquemas Zod + Server Actions
- `app/(app)/page.tsx` — formulario de gasto (monto+descripción+fecha)
  + lista del mes con total; `app/(app)/cuentas`, `app/(app)/hogar`
- `app/(app)/layout.tsx` — barra: hogar · nombre · nav · Salir
- Probado end-to-end incluyendo aislamiento RLS entre las dos personas
  y visibilidad de cuenta compartida.
- Categorías: fuera de alcance por ahora (el gasto va sin categoría).

### Fase 7 — Despliegue
Proyecto de Supabase en la nube, `supabase db push`, proyecto en
Vercel, variables de entorno, y el workflow de backup con `pg_dump`.

---

## Fuera de alcance por ahora

Lectura de correos bancarios, módulo de inversiones y patrimonio,
gráficas y análisis, app móvil nativa, notificaciones.

Que el modelo de datos los soporte no significa que se construyan
ahora. Primero registrar un gasto y verlo en una lista.
