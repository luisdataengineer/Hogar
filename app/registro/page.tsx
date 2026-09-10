"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { registrarse, type EstadoAuth } from "@/lib/auth/acciones";

const estadoInicial: EstadoAuth = {};
const claseInput =
  "rounded-md border border-input bg-background px-3 py-2 text-base";

export default function PaginaRegistro() {
  const [estado, accion, pendiente] = useActionState(
    registrarse,
    estadoInicial,
  );
  const [modoHogar, setModoHogar] = useState<"crear" | "unir">("crear");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-xl font-semibold">Crear cuenta</h1>

      <form action={accion} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Tu nombre
          <input
            name="nombre"
            required
            autoComplete="name"
            className={claseInput}
          />
        </label>

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

        <label className="flex flex-col gap-1 text-sm">
          Clave
          <input
            type="password"
            name="clave"
            required
            minLength={6}
            autoComplete="new-password"
            className={claseInput}
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm">Tu hogar</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoHogar"
              value="crear"
              checked={modoHogar === "crear"}
              onChange={() => setModoHogar("crear")}
            />
            Crear un hogar nuevo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoHogar"
              value="unir"
              checked={modoHogar === "unir"}
              onChange={() => setModoHogar("unir")}
            />
            Unirme con un código de invitación
          </label>
        </fieldset>

        {modoHogar === "crear" ? (
          <label className="flex flex-col gap-1 text-sm">
            Nombre del hogar
            <input name="nombreHogar" required className={claseInput} />
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-sm">
            Código de invitación
            <input name="codigo" required className={claseInput} />
          </label>
        )}

        {estado.error && (
          <p className="text-sm text-destructive" role="alert">
            {estado.error}
          </p>
        )}

        <Button type="submit" disabled={pendiente}>
          {pendiente ? "Creando…" : "Crear cuenta"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
