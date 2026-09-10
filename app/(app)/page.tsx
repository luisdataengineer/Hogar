import Link from "next/link";

import { crearClienteServidor } from "@/lib/supabase/server";

import { FormularioGasto } from "./formulario-gasto";

const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const diaMes = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
});

export default async function PaginaInicio() {
  const supabase = await crearClienteServidor();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims.sub ?? "";

  const { data: cuentas } = await supabase
    .from("cuentas")
    .select("id, nombre")
    .eq("perfil_id", uid)
    .eq("activa", true)
    .order("creada_en", { ascending: true });

  const ahora = new Date();
  const desde = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: gastos } = await supabase
    .from("transacciones")
    .select("id, monto, descripcion, fecha, cuenta_id")
    .eq("perfil_id", uid)
    .eq("tipo", "gasto")
    .gte("fecha", desde)
    .order("fecha", { ascending: false })
    .order("creada_en", { ascending: false });

  const nombreCuenta = new Map((cuentas ?? []).map((c) => [c.id, c.nombre]));
  const total = (gastos ?? []).reduce((s, g) => s + Number(g.monto), 0);

  return (
    <main className="flex flex-col gap-6 p-6">
      {cuentas && cuentas.length > 0 ? (
        <FormularioGasto cuentas={cuentas} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Primero{" "}
          <Link href="/cuentas" className="underline">
            crea una cuenta
          </Link>
          .
        </p>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Gastos del mes</h2>
          <span className="text-sm tabular-nums text-muted-foreground">
            {pesos.format(total)}
          </span>
        </div>

        <ul className="flex flex-col gap-1">
          {gastos && gastos.length > 0 ? (
            gastos.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate">
                    {g.descripcion || "Sin descripción"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {diaMes.format(new Date(g.fecha + "T00:00:00"))} ·{" "}
                    {nombreCuenta.get(g.cuenta_id) ?? "—"}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {pesos.format(Number(g.monto))}
                </span>
              </li>
            ))
          ) : (
            <li className="text-sm text-muted-foreground">
              Aún no hay gastos este mes.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
