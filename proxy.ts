import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { type Database } from "@/lib/supabase/tipos";

// Rutas que un usuario sin sesion puede ver.
const RUTAS_PUBLICAS = ["/login", "/registro", "/recuperar", "/auth"];

function esPublica(pathname: string): boolean {
  return RUTAS_PUBLICAS.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
}

// proxy.ts (antes middleware.ts): refresca la sesion de Supabase y decide
// redirects de navegacion. El gate de seguridad real es app/(app)/layout.tsx.
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          respuesta = NextResponse.next({
            request: { headers: request.headers },
          });
          for (const { name, value, options } of cookiesToSet) {
            respuesta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Nada de codigo entre createServerClient y esta linea: getClaims()
  // dispara el refresco y el setAll de arriba.
  const { data } = await supabase.auth.getClaims();
  const haySesion = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  // Redirect conservando las cookies recien escritas por el refresco.
  function redirigir(destino: string) {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    const r = NextResponse.redirect(url);
    for (const cookie of respuesta.cookies.getAll()) {
      r.cookies.set(cookie);
    }
    return r;
  }

  if (!haySesion && !esPublica(pathname)) {
    return redirigir("/login");
  }
  if (haySesion && (pathname === "/login" || pathname === "/registro")) {
    return redirigir("/");
  }

  return respuesta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
