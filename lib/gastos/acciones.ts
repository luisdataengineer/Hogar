"use server";

import { revalidatePath } from "next/cache";

import { esquemaGasto } from "@/lib/gastos/esquemas";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoGasto = { error?: string; ok?: boolean };

export async function registrarGasto(
  _prev: EstadoGasto,
  formData: FormData,
): Promise<EstadoGasto> {
  const r = esquemaGasto.safeParse({
    cuentaId: formData.get("cuentaId"),
    monto: formData.get("monto"),
    descripcion: formData.get("descripcion") || undefined,
    fecha: formData.get("fecha"),
  });
  if (!r.success) {
    return { error: r.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await crearClienteServidor();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims.sub;
  if (!uid) return { error: "Sesión no válida" };

  const { data: hogarId, error: eHogar } = await supabase.rpc("mi_hogar");
  if (eHogar || !hogarId) return { error: "No se pudo determinar tu hogar" };

  const { error } = await supabase.from("transacciones").insert({
    cuenta_id: r.data.cuentaId,
    perfil_id: uid,
    hogar_id: hogarId,
    tipo: "gasto",
    monto: r.data.monto,
    descripcion: r.data.descripcion ?? null,
    fecha: r.data.fecha,
  });
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}
