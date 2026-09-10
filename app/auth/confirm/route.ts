import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { crearClienteServidor } from "@/lib/supabase/server";

// Recibe el enlace de los correos de Supabase (recuperacion de clave).
// Valida el token_hash -> eso abre la sesion -> redirige a la pantalla final.
//
// Usa redirect() de next/navigation (no NextResponse.redirect): asi Next
// aplica al redirect las cookies de sesion que escribio verifyOtp.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  // Nunca redirigir fuera del sitio.
  const destino = next.startsWith("/") ? next : "/";

  if (tokenHash && tipo) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.verifyOtp({
      type: tipo,
      token_hash: tokenHash,
    });
    if (!error) {
      redirect(destino);
    }
  }

  redirect("/login?error=enlace");
}
