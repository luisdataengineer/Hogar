import Link from "next/link";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { cerrarSesion } from "@/lib/auth/acciones";
import { crearClienteServidor } from "@/lib/supabase/server";

// Layout de la zona autenticada. Todo lo que cuelga de (app) pasa por aca:
// sin sesion valida -> /login. Es el gate real; el proxy es solo apoyo.
export default async function LayoutApp({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre")
    .eq("id", data.claims.sub)
    .single();

  const { data: hogar } = await supabase
    .from("hogares")
    .select("nombre")
    .single();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm">
        <Link href="/" className="min-w-0">
          <span className="block truncate font-medium">{hogar?.nombre}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {perfil?.nombre}
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-3">
          <Link href="/cuentas" className="underline">
            Cuentas
          </Link>
          <Link href="/hogar" className="underline">
            Hogar
          </Link>
          <form action={cerrarSesion}>
            <button type="submit" className="text-muted-foreground underline">
              Salir
            </button>
          </form>
        </nav>
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}
