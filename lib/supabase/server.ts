import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { type Database } from "@/lib/supabase/tipos";

// Cliente de Supabase para el servidor: Server Components, Route Handlers
// y Server Actions. Lee la sesion de las cookies de la peticion actual.
// Es async porque en Next 16 cookies() es asincrono.
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll se llamo desde un Server Component, que no puede
            // escribir cookies. Inofensivo: proxy.ts refresca la sesion.
          }
        },
      },
    },
  );
}
