import "server-only";

import { createClient } from "@supabase/supabase-js";

import { type Database } from "@/lib/supabase/tipos";

// Cliente de Supabase con la clave secreta (service_role). SE SALTA LA RLS
// por completo: ve y modifica todo, de todos los hogares. Usar solo cuando
// de verdad hace falta esa potencia (tareas administrativas, el futuro
// proceso de correos bancarios), y solo desde Route Handlers o Server Actions.
//
// El import "server-only" hace que el build falle si este archivo termina
// importado en codigo de cliente.
export function crearClienteAdmin() {
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!clave) {
    throw new Error("Falta SUPABASE_SECRET_KEY en el entorno del servidor.");
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, clave, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
