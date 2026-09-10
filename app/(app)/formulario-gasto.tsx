"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { registrarGasto, type EstadoGasto } from "@/lib/gastos/acciones";

const estadoInicial: EstadoGasto = {};
const claseCampo =
  "rounded-md border border-input bg-background px-3 py-2 text-base";

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function FormularioGasto({
  cuentas,
}: {
  cuentas: { id: string; nombre: string }[];
}) {
  const [estado, accion, pendiente] = useActionState(
    registrarGasto,
    estadoInicial,
  );

  return (
    <form action={accion} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Monto
        <input
          name="monto"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          autoFocus
          className={claseCampo}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Descripción
        <input name="descripcion" maxLength={200} className={claseCampo} />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Fecha
          <input
            name="fecha"
            type="date"
            required
            defaultValue={hoyISO()}
            className={claseCampo}
          />
        </label>

        {cuentas.length > 1 ? (
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Cuenta
            <select name="cuentaId" required className={claseCampo}>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="cuentaId" value={cuentas[0].id} />
        )}
      </div>

      {estado.error && (
        <p className="text-sm text-destructive" role="alert">
          {estado.error}
        </p>
      )}
      {estado.ok && (
        <p className="text-sm text-muted-foreground">Gasto registrado.</p>
      )}

      <Button type="submit" disabled={pendiente}>
        {pendiente ? "Guardando…" : "Registrar gasto"}
      </Button>
    </form>
  );
}
