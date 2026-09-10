"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { iniciarSesion, type EstadoAuth } from "@/lib/auth/acciones";

const estadoInicial: EstadoAuth = {};

export default function PaginaLogin() {
  const [estado, accion, pendiente] = useActionState(
    iniciarSesion,
    estadoInicial,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-xl font-semibold">Entrar</h1>

      <form action={accion} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Correo
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-md border border-input bg-background px-3 py-2 text-base"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Clave
          <input
            type="password"
            name="clave"
            required
            autoComplete="current-password"
            className="rounded-md border border-input bg-background px-3 py-2 text-base"
          />
        </label>

        {estado.error && (
          <p className="text-sm text-destructive" role="alert">
            {estado.error}
          </p>
        )}

        <Button type="submit" disabled={pendiente}>
          {pendiente ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <div className="flex justify-between text-sm text-muted-foreground">
        <Link href="/recuperar" className="underline">
          Olvidé mi clave
        </Link>
        <Link href="/registro" className="underline">
          Crear cuenta
        </Link>
      </div>
    </main>
  );
}
