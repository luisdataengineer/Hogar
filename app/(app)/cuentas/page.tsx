import { ETIQUETA_TIPO_CUENTA } from "@/lib/cuentas/esquemas";
import { crearClienteServidor } from "@/lib/supabase/server";

import { FormularioCuenta } from "./formulario-cuenta";

const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default async function PaginaCuentas() {
  const supabase = await crearClienteServidor();
  const { data: cuentas } = await supabase
    .from("cuentas")
    .select("id, nombre, tipo, visibilidad, saldo_inicial")
    .order("creada_en", { ascending: true });

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold">Cuentas</h1>

      <ul className="flex flex-col gap-2">
        {cuentas && cuentas.length > 0 ? (
          cuentas.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
            >
              <span>
                <span className="font-medium">{c.nombre}</span>{" "}
                <span className="text-muted-foreground">
                  · {ETIQUETA_TIPO_CUENTA[c.tipo]}
                  {c.visibilidad === "compartida" ? " · compartida" : ""}
                </span>
              </span>
              <span className="tabular-nums text-muted-foreground">
                {pesos.format(Number(c.saldo_inicial))}
              </span>
            </li>
          ))
        ) : (
          <li className="text-sm text-muted-foreground">
            Aún no tienes cuentas. Crea una abajo.
          </li>
        )}
      </ul>

      <FormularioCuenta />
    </main>
  );
}
