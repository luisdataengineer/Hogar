"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { cambiarClave, type EstadoAuth } from "@/lib/auth/acciones";

const estadoInicial: EstadoAuth = {};
const claseInput =
  "rounded-md border border-input bg-background px-3 py-2 text-base";

export default function PaginaNuevaClave() {
  const [estado, accion, pendiente] = useActionState(
    cambiarClave,
    estadoInicial,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-xl font-semibold">Clave nueva</h1>

      <form action={accion} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nueva clave
          <input
            type="password"
            name="clave"
            required
            minLength={6}
            autoComplete="new-password"
            className={claseInput}
          />
        </label>

        {estado.error && (
          <p className="text-sm text-destructive" role="alert">
            {estado.error}
          </p>
        )}

        <Button type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Guardar clave"}
        </Button>
      </form>
    </main>
  );
}
