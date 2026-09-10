"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { crearCuenta, type EstadoCuenta } from "@/lib/cuentas/acciones";
import { ETIQUETA_TIPO_CUENTA, TIPOS_CUENTA } from "@/lib/cuentas/esquemas";

const estadoInicial: EstadoCuenta = {};
const claseCampo =
  "rounded-md border border-input bg-background px-3 py-2 text-base";

export function FormularioCuenta() {
  const [estado, accion, pendiente] = useActionState(
    crearCuenta,
    estadoInicial,
  );

  return (
    <form
      action={accion}
      className="flex flex-col gap-4 border-t border-border pt-6"
    >
      <h2 className="text-sm font-medium">Nueva cuenta</h2>

      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input name="nombre" required className={claseCampo} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Tipo
        <select
          name="tipo"
          required
          defaultValue="efectivo"
          className={claseCampo}
        >
          {TIPOS_CUENTA.map((t) => (
            <option key={t} value={t}>
              {ETIQUETA_TIPO_CUENTA[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Saldo inicial
        <input
          name="saldoInicial"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          defaultValue="0"
          className={claseCampo}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="visibilidad" value="compartida" />
        Compartida con el hogar
      </label>

      {estado.error && (
        <p className="text-sm text-destructive" role="alert">
          {estado.error}
        </p>
      )}
      {estado.ok && (
        <p className="text-sm text-muted-foreground">Cuenta creada.</p>
      )}

      <Button type="submit" disabled={pendiente}>
        {pendiente ? "Creando…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
