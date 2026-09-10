"use server";

import { redirect } from "next/navigation";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  esquemaClaveNueva,
  esquemaLogin,
  esquemaRecuperacion,
  esquemaRegistro,
} from "@/lib/auth/esquemas";

export type EstadoAuth = { error?: string; ok?: boolean };

function primerError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Datos inválidos";
}

// -------------------------------------------------------------
// Iniciar sesión
// -------------------------------------------------------------
export async function iniciarSesion(
  _prev: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const r = esquemaLogin.safeParse({
    email: formData.get("email"),
    clave: formData.get("clave"),
  });
  if (!r.success) return { error: primerError(r.error.issues) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: r.data.email,
    password: r.data.clave,
  });
  if (error) return { error: "Correo o clave incorrectos" };

  redirect("/");
}

// -------------------------------------------------------------
// Registrarse (crea hogar nuevo o se une con código)
// -------------------------------------------------------------
export async function registrarse(
  _prev: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const r = esquemaRegistro.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    clave: formData.get("clave"),
    modoHogar: formData.get("modoHogar"),
    nombreHogar: formData.get("nombreHogar"),
    codigo: formData.get("codigo"),
  });
  if (!r.success) return { error: primerError(r.error.issues) };
  const d = r.data;

  // metadata que lee el trigger public.manejar_usuario_nuevo
  const metadata =
    d.modoHogar === "crear"
      ? { nombre: d.nombre, nombre_hogar: d.nombreHogar }
      : { nombre: d.nombre, codigo_invitacion: d.codigo };

  if (d.modoHogar === "unir") {
    const admin = crearClienteAdmin();
    const { data: hogar } = await admin
      .from("hogares")
      .select("id")
      .eq("codigo_invitacion", d.codigo)
      .maybeSingle();
    if (!hogar) return { error: "Ese código de invitación no existe" };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signUp({
    email: d.email,
    password: d.clave,
    options: { data: metadata },
  });
  if (error) return { error: error.message };

  redirect("/");
}

// -------------------------------------------------------------
// Cerrar sesión
// -------------------------------------------------------------
export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}

// -------------------------------------------------------------
// Pedir correo de recuperación
// -------------------------------------------------------------
export async function pedirRecuperacion(
  _prev: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const r = esquemaRecuperacion.safeParse({ email: formData.get("email") });
  if (!r.success) return { error: primerError(r.error.issues) };

  const supabase = await crearClienteServidor();
  await supabase.auth.resetPasswordForEmail(r.data.email, {
    // Destino logico tras cambiar la clave. El enlace real del correo lo
    // arma la plantilla supabase/templates/recuperar_clave.html, que apunta
    // a /auth/confirm con el token_hash.
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/recuperar/nueva-clave`,
  });

  // Mismo mensaje exista o no el correo.
  return { ok: true };
}

// -------------------------------------------------------------
// Fijar clave nueva (ya con sesión, tras el link de recuperación)
// -------------------------------------------------------------
export async function cambiarClave(
  _prev: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const r = esquemaClaveNueva.safeParse({ clave: formData.get("clave") });
  if (!r.success) return { error: primerError(r.error.issues) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: r.data.clave });
  if (error) return { error: error.message };

  redirect("/");
}
