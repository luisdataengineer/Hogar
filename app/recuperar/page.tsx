"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { pedirRecuperacion, type EstadoAuth } from "@/lib/auth/acciones";

const estadoInicial: EstadoAuth = {};
const claseInput =
  "rounded-md border border-input bg-background px-3 py-2 text-base";

export default function PaginaRecuperar() {
  const [estado, accion, pendiente] = useActionState(
    pedirRecuperacion,
    estadoInicial,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-xl font-semibold">Recuperar clave</h1>

      {estado.ok ? (
        <p className="text-sm text-muted-foreground">
          Si ese correo tiene una cuenta, te llegó un enlace para cambiar la
          clave. Revisa tu bandeja.
        </p>
      ) : (
        <form action={accion} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Correo
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className={claseInput}
            />
          </label>

          {estado.error && (
            <p className="text-sm text-destructive" role="alert">
              {estado.error}
            </p>
          )}

          <Button type="submit" disabled={pendiente}>
            {pendiente ? "Enviando…" : "Enviar enlace"}
          </Button>
        </form>
      )}

      <Link href="/login" className="text-sm text-muted-foreground underline">
        Volver a entrar
      </Link>
    </main>
  );
}
