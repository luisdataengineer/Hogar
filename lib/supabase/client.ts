import { createBrowserClient } from "@supabase/ssr";

import { type Database } from "@/lib/supabase/tipos";

// Cliente de Supabase para el navegador (Client Components, "use client").
// La sesion vive en cookies, no en localStorage: asi el servidor lee la
// misma sesion que escribio el navegador (ver server.ts y proxy.ts).
export function crearClienteNavegador() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
