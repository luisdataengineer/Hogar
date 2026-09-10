"use server";

import { revalidatePath } from "next/cache";

import { esquemaCuenta } from "@/lib/cuentas/esquemas";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoCuenta = { error?: string; ok?: boolean };

export async function crearCuenta(
  _prev: EstadoCuenta,
  formData: FormData,
): Promise<EstadoCuenta> {
  const r = esquemaCuenta.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    saldoInicial: formData.get("saldoInicial") || 0,
    visibilidad: formData.get("visibilidad") ?? "privada",
  });
  if (!r.success) {
    return { error: r.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await crearClienteServidor();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims.sub;
  if (!uid) return { error: "Sesión no válida" };

  // hogar_id: lo da mi_hogar(), que es lo que compara la politica RLS.
  const { data: hogarId, error: eHogar } = await supabase.rpc("mi_hogar");
  if (eHogar || !hogarId) return { error: "No se pudo determinar tu hogar" };

  const { error } = await supabase.from("cuentas").insert({
    perfil_id: uid,
    hogar_id: hogarId,
    nombre: r.data.nombre,
    tipo: r.data.tipo,
    saldo_inicial: r.data.saldoInicial,
    visibilidad: r.data.visibilidad,
  });
  if (error) return { error: error.message };

  revalidatePath("/cuentas");
  revalidatePath("/");
  return { ok: true };
}
